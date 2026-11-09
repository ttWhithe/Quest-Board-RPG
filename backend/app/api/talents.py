from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.game import level_for_xp
from app.core.talents import _EDGES, TALENTS, available_talent_points, can_upgrade
from app.db import get_session
from app.models.user import User
from app.models.user_talent import UserTalent
from app.schemas.talent import TalentOut, TalentTreeOut, TalentUpgradeResponse

router = APIRouter(prefix="/talents", tags=["talents"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


async def _get_user_talents(session: AsyncSession, user_id: UUID) -> list[UserTalent]:
    stmt = select(UserTalent).where(UserTalent.user_id == user_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def _build_talent_tree(user_talents: list[UserTalent], user_level: int) -> TalentTreeOut:
    ranks_by_code = {t.talent_code: t.rank for t in user_talents}
    spent_points = sum(ranks_by_code.values())
    available_points = available_talent_points(user_level, spent_points)

    nodes_out = []
    for code, talent_def in TALENTS.items():
        current_rank = ranks_by_code.get(code, 0)
        nodes_out.append(
            TalentOut(
                id=code,
                name=talent_def.name,
                description=talent_def.description,
                type=talent_def.type,
                x=talent_def.x,
                y=talent_def.y,
                max_rank=talent_def.max_rank,
                rank=current_rank,
                can_upgrade=can_upgrade(code, ranks_by_code, available_points),
            )
        )

    return TalentTreeOut(
        available_points=available_points,
        total_spent_points=spent_points,
        nodes=nodes_out,
        edges=_EDGES,
    )


@router.get("", response_model=TalentTreeOut)
async def get_talent_tree(session: SessionDep, user: CurrentUser) -> TalentTreeOut:
    user_talents = await _get_user_talents(session, user.id)
    user_level = level_for_xp(user.total_xp)
    return _build_talent_tree(user_talents, user_level)


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
        node=TalentOut(
            id=code,
            name=talent_def.name,
            description=talent_def.description,
            type=talent_def.type,
            x=talent_def.x,
            y=talent_def.y,
            max_rank=talent_def.max_rank,
            rank=existing.rank,
            can_upgrade=can_upgrade(code, ranks_by_code, new_available_points),
        ),
    )
