"""Character API endpoints (spec.md §7.6)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.game import effective_status, level_for_xp, xp_for_next_level, xp_into_level
from app.db import get_session
from app.models.enums import QuestRank, QuestStatus
from app.models.quest import Quest
from app.models.user import User
from app.schemas.character import CharacterOut, CharacterStats, CharacterUpdate
from app.schemas.user import UserOut

router = APIRouter(prefix="/character", tags=["character"])


def _user_tz(user: User) -> ZoneInfo:
    """TZ пользователя; безопасный fallback на UTC при битых данных в БД."""
    try:
        return ZoneInfo(user.timezone)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


@router.get("", response_model=CharacterOut)
async def get_character(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CharacterOut:
    """§7.6: персонаж + статистика."""
    level = level_for_xp(current_user.total_xp)
    xp_in = xp_into_level(current_user.total_xp)
    xp_next = xp_for_next_level(level)

    # 1. Сбор статистики по выполненным (по рангам и всего)
    stmt = (
        select(Quest.rank, func.sum(Quest.completion_count))
        .where(Quest.user_id == current_user.id)
        .group_by(Quest.rank)
    )
    result = await session.execute(stmt)

    # Инициализируем словарь нулями для всех рангов (S..F)
    by_rank = {rank.value: 0 for rank in QuestRank}
    completed_total = 0

    for rank_enum, count in result.all():
        if count:
            by_rank[rank_enum.value] = count
            completed_total += count

    # 2. Статистика по проваленным (failed_total)
    now = datetime.now(UTC)
    tz = _user_tz(current_user)

    active_quests_stmt = select(Quest).where(
        Quest.user_id == current_user.id, Quest.status == QuestStatus.active
    )
    active_quests = (await session.scalars(active_quests_stmt)).all()

    failed_total = sum(1 for q in active_quests if effective_status(q, now, tz) == "failed")

    return CharacterOut(
        user=UserOut.model_validate(current_user),
        level=level,
        xp_into_level=xp_in,
        xp_for_next_level=xp_next,
        stats=CharacterStats(
            completed_total=completed_total,
            failed_total=failed_total,
            by_rank=by_rank,
        ),
    )


@router.patch("", response_model=CharacterOut)
async def update_character(
    payload: CharacterUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CharacterOut:
    """§7.6: обновление whitelist полей профиля."""
    if payload.nickname is not None:
        current_user.nickname = payload.nickname
    if payload.emblem_seed is not None:
        current_user.emblem_seed = payload.emblem_seed
    if payload.timezone is not None:
        current_user.timezone = payload.timezone

    await session.commit()
    await session.refresh(current_user)

    # Возвращаем то же, что и GET
    return await get_character(current_user, session)
