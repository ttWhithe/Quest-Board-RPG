from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.game import level_for_xp
from app.core.talents import TALENTS, available_talent_points, can_upgrade
from app.db import get_session
from app.models.user import User
from app.models.user_talent import UserTalent
from app.schemas.talent import TalentListResponse, TalentOut, TalentUpgradeResponse

router = APIRouter(prefix="/talents", tags=["talents"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


async def _get_user_talents(session: AsyncSession, user_id: UUID) -> list[UserTalent]:
    stmt = select(UserTalent).where(UserTalent.user_id == user_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def _build_talent_list(user_talents: list[UserTalent], user_level: int) -> TalentListResponse:
    ranks_by_code = {t.talent_code: t.rank for t in user_talents}
    spent_points = sum(ranks_by_code.values())
    available_points = available_talent_points(user_level, spent_points)

    talents_out = []
    for code, talent_def in TALENTS.items():
        current_rank = ranks_by_code.get(code, 0)
        talents_out.append(
            TalentOut(
                code=code,
                title=talent_def.title,
                rank=current_rank,
                max_rank=talent_def.max_rank,
                xp_bonus_per_rank=talent_def.xp_bonus_per_rank,
                requires=talent_def.requires,
                can_upgrade=can_upgrade(code, ranks_by_code, available_points),
            )
        )

    return TalentListResponse(
        available_points=available_points,
        total_spent_points=spent_points,
        talents=talents_out,
    )


@router.get("", response_model=TalentListResponse)
async def list_talents(session: SessionDep, user: CurrentUser) -> TalentListResponse:
    user_talents = await _get_user_talents(session, user.id)
    user_level = level_for_xp(user.total_xp)
    return _build_talent_list(user_talents, user_level)


@router.post("/{code}/upgrade", response_model=TalentUpgradeResponse)
async def upgrade_talent(
    code: str, session: SessionDep, user: CurrentUser
) -> TalentUpgradeResponse:
    user_talents = await _get_user_talents(session, user.id)
    ranks_by_code = {t.talent_code: t.rank for t in user_talents}

    user_level = level_for_xp(user.total_xp)
    spent_points = sum(ranks_by_code.values())
    available_points = available_talent_points(user_level, spent_points)

    if not can_upgrade(code, ranks_by_code, available_points):
        raise HTTPException(
            status_code=409,
            detail={"detail": "Cannot upgrade talent", "code": "TALENT_UPGRADE_FAILED"},
        )

    existing = next((t for t in user_talents if t.talent_code == code), None)
    if existing:
        existing.rank += 1
    else:
        existing = UserTalent(user_id=user.id, talent_code=code, rank=1)
        session.add(existing)

    await session.commit()
    await session.refresh(existing)

    ranks_by_code[code] = existing.rank
    new_available_points = available_talent_points(user_level, spent_points + 1)

    talent_def = TALENTS[code]
    return TalentUpgradeResponse(
        available_points=new_available_points,
        talent=TalentOut(
            code=code,
            title=talent_def.title,
            rank=existing.rank,
            max_rank=talent_def.max_rank,
            xp_bonus_per_rank=talent_def.xp_bonus_per_rank,
            requires=talent_def.requires,
            can_upgrade=can_upgrade(code, ranks_by_code, new_available_points),
        ),
    )
