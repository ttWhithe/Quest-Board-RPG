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
from app.core.talents import TALENTS, get_total_bonus_percent
from app.data import load_json
from app.db import get_session
from app.models.enums import QuestRank, QuestStatus
from app.models.quest import Quest
from app.models.user import User
from app.models.user_talent import UserTalent
from app.schemas.character import (
    CharacterOut,
    CharacterStats,
    CharacterStatsResponse,
    CharacterUpdate,
    InventoryResponse,
)
from app.schemas.user import UserOut

router = APIRouter(prefix="/character", tags=["character"])


def _user_tz(user: User) -> ZoneInfo:
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

    stmt = (
        select(Quest.rank, func.sum(Quest.completion_count))
        .where(Quest.user_id == current_user.id)
        .group_by(Quest.rank)
    )
    result = await session.execute(stmt)

    by_rank = {rank.value: 0 for rank in QuestRank}
    completed_total = 0

    for rank_enum, count in result.all():
        if count:
            by_rank[rank_enum.value] = count
            completed_total += count

    now = datetime.now(UTC)
    tz = _user_tz(current_user)

    active_quests_stmt = select(Quest).where(
        Quest.user_id == current_user.id, Quest.status == QuestStatus.active
    )
    active_quests = (await session.scalars(active_quests_stmt)).all()

    failed_total = sum(1 for q in active_quests if effective_status(q, now, tz) == "failed")

    talents_stmt = select(UserTalent).where(UserTalent.user_id == current_user.id)
    user_talents = (await session.scalars(talents_stmt)).all()
    ranks_by_code = {t.talent_code: t.rank for t in user_talents}
    xp_bonus = get_total_bonus_percent(ranks_by_code)

    return CharacterOut(
        user=UserOut.model_validate(current_user),
        level=level,
        xp_into_level=xp_in,
        xp_for_next_level=xp_next,
        xp_bonus_percent=xp_bonus,
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
    if payload.nickname is not None:
        current_user.nickname = payload.nickname
    if payload.emblem_seed is not None:
        current_user.emblem_seed = payload.emblem_seed
    if payload.timezone is not None:
        current_user.timezone = payload.timezone

    await session.commit()
    await session.refresh(current_user)

    return await get_character(current_user, session)


@router.get("/stats", response_model=CharacterStatsResponse)
async def get_character_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CharacterStatsResponse:
    """Возвращает 7 базовых характеристик персонажа с учетом талантов."""
    stats = {
        "strength": 5.0,
        "dexterity": 5.0,
        "intellect": 5.0,
        "spirit": 5.0,
        "endurance": 5.0,
        "perception": 5.0,
        "luck": 5.0,
    }

    result = await session.execute(select(UserTalent).where(UserTalent.user_id == current_user.id))
    user_talents = result.scalars().all()
    ranks_by_code = {ut.talent_code: ut.rank for ut in user_talents}

    for code, rank in ranks_by_code.items():
        node = TALENTS.get(code)
        if not node:
            continue

        for effect in node.effects:
            stat_name = effect.get("stat", "")
            values = effect.get("values", [])

            if stat_name.endswith("_percent") and stat_name != "all_stats_percent":
                base_stat = stat_name.replace("_percent", "")
                if base_stat in stats:
                    bonus_percent = sum(values[:rank])
                    stats[base_stat] += bonus_percent / 10.0
            elif stat_name == "all_stats_percent":
                bonus_percent = sum(values[:rank])
                for k in stats:
                    stats[k] += bonus_percent / 10.0

    return CharacterStatsResponse(stats=stats)


@router.get("/inventory", response_model=InventoryResponse)
async def get_inventory(
    current_user: Annotated[User, Depends(get_current_user)],
) -> InventoryResponse:
    """Заглушка инвентаря. Читает из items.json."""
    data = load_json("items.json")
    items = data.get("items", [])

    return InventoryResponse(items=items[:12], total=len(items))
