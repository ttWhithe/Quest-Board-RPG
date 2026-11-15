"""Achievements API endpoints."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.data import load_json
from app.db import get_session
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.schemas.achievement import AchievementOut

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
async def get_achievements(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AchievementOut]:
    """Возвращает все достижения с прогрессом текущего пользователя."""
    data = load_json("achievements.json")
    all_achievements = data.get("achievements", [])

    stmt = select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    user_achievements = (await session.scalars(stmt)).all()
    unlocked_map = {ua.achievement_code: ua.unlocked_at for ua in user_achievements}

    result = []
    for ach in all_achievements:
        is_unlocked = ach["id"] in unlocked_map
        result.append(
            AchievementOut(
                **ach,
                unlocked=is_unlocked,
                unlocked_at=unlocked_map.get(ach["id"]),
            )
        )
    return result


@router.post("/{achievement_id}/unlock", response_model=AchievementOut)
async def unlock_achievement(
    achievement_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AchievementOut:
    """Фиксирует получение достижения в БД."""
    data = load_json("achievements.json")
    ach_data = next((a for a in data.get("achievements", []) if a["id"] == achievement_id), None)
    if not ach_data:
        raise HTTPException(
            status_code=404, detail="Achievement not found", headers={"code": "NOT_FOUND"}
        )

    stmt = select(UserAchievement).where(
        UserAchievement.user_id == current_user.id,
        UserAchievement.achievement_code == achievement_id,
    )
    existing = await session.scalar(stmt)

    if not existing:
        new_ua = UserAchievement(
            user_id=current_user.id, achievement_code=achievement_id, unlocked_at=datetime.now(UTC)
        )
        session.add(new_ua)
        await session.commit()
        await session.refresh(new_ua)
        unlocked_at = new_ua.unlocked_at
    else:
        unlocked_at = existing.unlocked_at

    return AchievementOut(**ach_data, unlocked=True, unlocked_at=unlocked_at)
