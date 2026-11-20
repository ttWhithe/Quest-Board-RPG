"""Achievements API endpoints.

Эндпоинт только для чтения: движок выдачи живёт в `core.achievements`.
Ручной `POST /achievements/{id}/unlock` удалён — обходной путь для читерства.
Добавлен `POST /achievements/track` для инкремента клиентских счётчиков.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.achievements import (
    AchievementEvent,
    check_and_unlock_achievements,
    get_all_achievements_with_progress,
)
from app.core.deps import get_current_user
from app.db import get_session
from app.models.user import User
from app.schemas.achievement import AchievementOut, NewAchievementEvent, TrackEventRequest

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
async def get_achievements(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AchievementOut]:
    """Полный список достижений: unlocked/unlocked_at/progress."""
    return await get_all_achievements_with_progress(session, current_user)


@router.post("/track", response_model=list[NewAchievementEvent])
async def track_event(
    payload: TrackEventRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[NewAchievementEvent]:
    """Инкрементирует счётчик (клики, открытия UI) и проверяет ачивки."""
    allowed_stats = {
        "emblem_click",
        "inventory_open",
        "watermark_click",
        "calendar_open",
        "calendar_skip_month",
        "unequip_double_click",
    }

    if payload.stat_name not in allowed_stats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"detail": "Invalid stat name", "code": "INVALID_STAT"},
        )

    # SQLAlchemy не отслеживает мутации внутри JSONB in-place, поэтому пересоздаём dict
    stats = dict(current_user.tracking_stats or {})
    stats[payload.stat_name] = stats.get(payload.stat_name, 0) + 1
    current_user.tracking_stats = stats

    await session.flush()
    new_achievements = await check_and_unlock_achievements(
        session, current_user, AchievementEvent.STATS_UPDATED, {"now": datetime.now(UTC)}
    )
    await session.commit()
    return new_achievements
