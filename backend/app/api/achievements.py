"""Achievements API endpoints.

Эндпоинт только для чтения: движок выдачи живёт в `core.achievements`.
Ручной `POST /achievements/{id}/unlock` удалён — обходной путь для читерства.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.achievements import get_all_achievements_with_progress
from app.core.deps import get_current_user
from app.db import get_session
from app.models.user import User
from app.schemas.achievement import AchievementOut

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("", response_model=list[AchievementOut])
async def get_achievements(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AchievementOut]:
    """Полный список достижений: unlocked/unlocked_at/progress."""
    return await get_all_achievements_with_progress(session, current_user)
