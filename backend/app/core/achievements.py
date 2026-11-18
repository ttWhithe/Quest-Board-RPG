"""Achievements engine.

Единая точка проверки и выдачи достижений.

Контракт:
  * `check_and_unlock_achievements(session, user, event, context?)`
    — вызывается в endпоинтах-триггерах;
    — НЕ коммитит сессию (это делает caller);
    — добавляет `UserAchievement`, начисляет `reward.xp` атомарным UPDATE;
    — возвращает список `NewAchievementEvent` для тостов.

  * `get_all_achievements_with_progress(session, user)`
    — для GET /achievements: полный список с `unlocked`/`progress`.

Условия (`condition.type`) описаны в `schemas/achievement.py`.
Тип `manual` — не проверяется (Day 18+: клиентские счётчики, ветки талантов).
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from functools import lru_cache
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.game import effective_status, level_for_xp
from app.core.talents import TALENTS
from app.data import load_json
from app.models.enums import QuestRank, QuestRarity, QuestRecurrence, QuestStatus
from app.models.event import Event
from app.models.quest import Quest
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.models.user_item import UserItem
from app.models.user_talent import UserTalent
from app.schemas.achievement import (
    AchievementDef,
    AchievementOut,
    AchievementProgress,
    NewAchievementEvent,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Events (что триггерит проверку)
# ---------------------------------------------------------------------------


class AchievementEvent(StrEnum):
    QUEST_COMPLETED = "quest_completed"
    QUEST_CREATED = "quest_created"
    ITEM_CHANGED = "item_changed"
    TALENT_UPGRADED = "talent_upgraded"
    EVENT_CREATED = "event_created"
    DAILY_REWARD = "daily_reward"
    LOGIN = "login"
    PROFILE_CHANGED = "profile_changed"
    DEMO_LOGIN = "demo_login"


# Какие condition.type проверяем при каком событии.
_EVENT_CONDITION_MAP: dict[AchievementEvent, set[str]] = {
    AchievementEvent.QUEST_COMPLETED: {
        "quest_count",
        "quest_count_per_rank",
        "quest_failed",
        "time_of_day",
        "specific_date",
        "event_flag",
        "level_reached",
        "xp_total",
    },
    AchievementEvent.QUEST_CREATED: {
        "quests_created_today",
    },
    AchievementEvent.ITEM_CHANGED: {
        "inventory_count",
        "equipped_count",
        "equipped_slots",
        "item_pinned",
        "enhancement",
        "rarity_upgrade",
        "event_flag",
    },
    AchievementEvent.TALENT_UPGRADED: {
        "talents_total",
        "talents_notable",
        "talents_branch_complete",
        "talents_branch_count",
    },
    AchievementEvent.EVENT_CREATED: {
        "events_created",
    },
    AchievementEvent.DAILY_REWARD: {
        "daily_reward",
        "level_reached",
        "xp_total",
    },
    AchievementEvent.LOGIN: {
        "login_streak",
        "return_after_gap",
    },
    AchievementEvent.PROFILE_CHANGED: {
        "profile_change",
    },
    AchievementEvent.DEMO_LOGIN: {
        "demo_login",
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _user_tz(user: User) -> ZoneInfo:
    try:
        return ZoneInfo(user.timezone)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"]


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------

HandlerResult = tuple[bool, int | None, int | None]
Handler = Callable[
    [AsyncSession, User, dict[str, Any], dict[str, Any] | None],
    Awaitable[HandlerResult],
]


async def _handle_quest_count(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    total = int(params.get("total", 1))
    stmt = select(func.coalesce(func.sum(Quest.completion_count), 0)).where(
        Quest.user_id == user.id
    )
    if "rank_in" in params:
        stmt = stmt.where(Quest.rank.in_([QuestRank(r) for r in params["rank_in"]]))
    if "rarity_in" in params:
        stmt = stmt.where(Quest.rarity.in_([QuestRarity(r) for r in params["rarity_in"]]))
    if "recurrence_in" in params:
        stmt = stmt.where(
            Quest.recurrence.in_([QuestRecurrence(r) for r in params["recurrence_in"]])
        )
    current = int(await session.scalar(stmt) or 0)
    return current >= total, current, total


async def _handle_quest_count_per_rank(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_per_rank = int(params.get("min_per_rank", 1))
    stmt = (
        select(Quest.rank, func.coalesce(func.sum(Quest.completion_count), 0))
        .where(Quest.user_id == user.id)
        .group_by(Quest.rank)
    )
    rows = (await session.execute(stmt)).all()
    by_rank = {r.value: int(c) for r, c in rows}
    target = len(QuestRank)
    current = sum(1 for rank in QuestRank if by_rank.get(rank.value, 0) >= min_per_rank)
    return current >= target, current, target


async def _handle_quest_failed(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_count = int(params.get("min_count", 1))
    now = (context or {}).get("now") or datetime.now(UTC)
    tz = _user_tz(user)
    stmt = select(Quest).where(Quest.user_id == user.id, Quest.status == QuestStatus.active)
    quests = (await session.scalars(stmt)).all()
    current = sum(1 for q in quests if effective_status(q, now, tz) == "failed")
    return current >= min_count, current, min_count


async def _handle_time_of_day(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    hour_from = int(params["hour_from"])
    hour_to = int(params["hour_to"])
    now = (context or {}).get("now") or datetime.now(UTC)
    local_hour = now.astimezone(_user_tz(user)).hour
    return hour_from <= local_hour < hour_to, None, None


async def _handle_specific_date(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    month = int(params["month"])
    day = int(params["day"])
    now = (context or {}).get("now") or datetime.now(UTC)
    local = now.astimezone(_user_tz(user))
    return (local.month == month and local.day == day), None, None


async def _handle_event_flag(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    flag = params.get("flag", "")
    ctx = context or {}
    if flag == "overdue_completed":
        quest: Quest | None = ctx.get("quest")
        now: datetime | None = ctx.get("now")
        if quest is not None and quest.deadline is not None and now is not None:
            return quest.deadline < now, None, None
        return False, None, None
    if flag == "enhancement_downgraded":
        return bool(ctx.get("enhancement_downgraded")), None, None
    if flag == "rarity_upgraded":
        return bool(ctx.get("rarity_upgraded")), None, None
    if flag == "enhanced_negative_item":
        return bool(ctx.get("enhanced_negative_item")), None, None
    return False, None, None


async def _handle_quests_created_today(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_count = int(params.get("min_count", 1))
    now = (context or {}).get("now") or datetime.now(UTC)
    local_now = now.astimezone(_user_tz(user))
    start_local = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_utc = start_local.astimezone(UTC)
    end_utc = (start_local + timedelta(days=1)).astimezone(UTC)
    stmt = select(func.count(Quest.id)).where(
        Quest.user_id == user.id,
        Quest.created_at >= start_utc,
        Quest.created_at < end_utc,
    )
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_talents_total(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_count = int(params.get("min_count", 1))
    stmt = select(func.coalesce(func.sum(UserTalent.rank), 0)).where(UserTalent.user_id == user.id)
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_talents_notable(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    # TODO(Day 18): проверить, что в talent_tree.json есть `type == "notable"`.
    # Если нет — счётчик всегда 0, достижение не выдаётся.
    min_count = int(params.get("min_count", 1))
    stmt = select(UserTalent).where(UserTalent.user_id == user.id)
    user_talents = (await session.scalars(stmt)).all()
    current = 0
    for ut in user_talents:
        node = TALENTS.get(ut.talent_code)
        if node is not None and node.type == "notable":
            current += 1
    return current >= min_count, current, min_count


async def _handle_talents_branch_complete(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    stmt = select(UserTalent).where(UserTalent.user_id == user.id)
    user_talents = (await session.scalars(stmt)).all()
    ranks_by_code = {ut.talent_code: ut.rank for ut in user_talents}

    for branch in ["magic", "war", "stealth"]:
        # Берем все узлы этой ветки, исключая рут (если он есть, но у нас нет)
        nodes_in_branch = [n for n in TALENTS.values() if n.branch == branch]
        if not nodes_in_branch:
            continue
        # Проверяем, что каждый узел в ветке прокачан хотя бы на 1
        if all(ranks_by_code.get(n.id, 0) > 0 for n in nodes_in_branch):
            return True, None, None

    return False, None, None


async def _handle_talents_branch_count(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    branch = params.get("branch", "")
    min_count = int(params.get("min_count", 1))

    stmt = select(UserTalent).where(UserTalent.user_id == user.id)
    user_talents = (await session.scalars(stmt)).all()

    current = 0
    for ut in user_talents:
        node = TALENTS.get(ut.talent_code)
        if node and node.branch == branch:
            current += 1

    return current >= min_count, current, min_count


async def _handle_login_streak(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_days = int(params.get("min_days", 1))
    current = user.login_streak or 0
    return current >= min_days, current, min_days


async def _handle_daily_reward(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_day = int(params.get("min_day", 1))
    current = user.daily_reward_day or 1
    return current >= min_day, current, min_day


async def _handle_return_after_gap(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_days = int(params.get("min_days", 7))
    days = (context or {}).get("days_since_previous_login")
    if days is None:
        return False, None, None
    return int(days) >= min_days, int(days), min_days


async def _handle_inventory_count(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_count = int(params.get("min_count", 1))
    stmt = select(func.count(UserItem.id)).where(UserItem.user_id == user.id)
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_equipped_count(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_count = int(params.get("min_count", 1))
    stmt = select(func.count(UserItem.id)).where(
        UserItem.user_id == user.id,
        UserItem.equipped_slot.isnot(None),
    )
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_equipped_slots(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    required = set(params.get("slots_required", []))
    both_weapons = bool(params.get("both_weapons", False))
    stmt = select(UserItem).where(
        UserItem.user_id == user.id,
        UserItem.equipped_slot.isnot(None),
    )
    items = (await session.scalars(stmt)).all()
    filled = {it.equipped_slot for it in items if it.equipped_slot}
    current = len(required & filled)
    target = len(required)
    satisfied = required.issubset(filled)
    if satisfied and both_weapons:
        items_data = load_json("items.json").get("items", [])
        types = {i["id"]: i.get("type", "") for i in items_data}
        main = next((it for it in items if it.equipped_slot == "main_hand"), None)
        off = next((it for it in items if it.equipped_slot == "off_hand"), None)
        satisfied = (
            main is not None
            and off is not None
            and types.get(main.item_code) == "weapon"
            and types.get(off.item_code) == "weapon"
        )
    return satisfied, current, target


async def _handle_item_pinned(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    stmt = select(func.count(UserItem.id)).where(
        UserItem.user_id == user.id,
        UserItem.is_pinned.is_(True),
    )
    current = int(await session.scalar(stmt) or 0)
    return current >= 1, current, 1


async def _handle_enhancement(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_level = int(params.get("min_level", 1))
    min_count = int(params.get("min_count", 1))
    stmt = select(func.count(UserItem.id)).where(
        UserItem.user_id == user.id,
        UserItem.enhancement_level >= min_level,
    )
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_rarity_upgrade(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    target_rarity = params.get("target_rarity", "rare")
    min_count = int(params.get("min_count", 1))
    target_idx = _RARITY_ORDER.index(target_rarity) if target_rarity in _RARITY_ORDER else 0
    higher_rarities = _RARITY_ORDER[target_idx:]
    stmt = select(func.count(UserItem.id)).where(
        UserItem.user_id == user.id,
        UserItem.rarity_override.in_(higher_rarities),
    )
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_events_created(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    min_count = int(params.get("min_count", 1))
    stmt = select(func.count(Event.id)).where(Event.user_id == user.id)
    if params.get("repeats_yearly") is True:
        stmt = stmt.where(Event.repeats_yearly.is_(True))
    if params.get("date_in_past") is True:
        now = (context or {}).get("now") or datetime.now(UTC)
        today_local = now.astimezone(_user_tz(user)).date()
        stmt = stmt.where(Event.date < today_local)
    current = int(await session.scalar(stmt) or 0)
    return current >= min_count, current, min_count


async def _handle_profile_change(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    field = params.get("field", "")
    ctx = context or {}
    return ctx.get("profile_field") == field, None, None


async def _handle_level_reached(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    target = int(params.get("level", 1))
    current = level_for_xp(user.total_xp)
    return current >= target, current, target


async def _handle_xp_total(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    target = int(params.get("amount", 1))
    current = user.total_xp or 0
    return current >= target, current, target


async def _handle_demo_login(
    session: AsyncSession,
    user: User,
    params: dict[str, Any],
    context: dict[str, Any] | None,
) -> HandlerResult:
    return bool(user.is_demo), None, None


_HANDLERS: dict[str, Handler] = {
    "quest_count": _handle_quest_count,
    "quest_count_per_rank": _handle_quest_count_per_rank,
    "quest_failed": _handle_quest_failed,
    "quests_created_today": _handle_quests_created_today,
    "time_of_day": _handle_time_of_day,
    "specific_date": _handle_specific_date,
    "event_flag": _handle_event_flag,
    "talents_total": _handle_talents_total,
    "talents_notable": _handle_talents_notable,
    "talents_branch_complete": _handle_talents_branch_complete,
    "talents_branch_count": _handle_talents_branch_count,
    "login_streak": _handle_login_streak,
    "daily_reward": _handle_daily_reward,
    "return_after_gap": _handle_return_after_gap,
    "inventory_count": _handle_inventory_count,
    "equipped_count": _handle_equipped_count,
    "equipped_slots": _handle_equipped_slots,
    "item_pinned": _handle_item_pinned,
    "enhancement": _handle_enhancement,
    "rarity_upgrade": _handle_rarity_upgrade,
    "events_created": _handle_events_created,
    "profile_change": _handle_profile_change,
    "level_reached": _handle_level_reached,
    "xp_total": _handle_xp_total,
    "demo_login": _handle_demo_login,
}


# ---------------------------------------------------------------------------
# Definitions loader (cached)
# ---------------------------------------------------------------------------


_ACHIEVEMENTS_CACHE: list[AchievementDef] | None = None


def _load_achievements() -> list[AchievementDef]:
    global _ACHIEVEMENTS_CACHE
    if _ACHIEVEMENTS_CACHE is None:
        raw = load_json("achievements.json")
        _ACHIEVEMENTS_CACHE = [
            AchievementDef.model_validate(a) for a in raw.get("achievements", [])
        ]
    return _ACHIEVEMENTS_CACHE


def _reset_cache_for_tests() -> None:
    """Только для тестов: сброс кэша, если подменили achievements.json."""
    global _ACHIEVEMENTS_CACHE
    _ACHIEVEMENTS_CACHE = None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _load_items() -> dict[str, Any]:
    """Кэшируем items.json, чтобы не читать его на каждый запрос."""
    return {i["id"]: i for i in load_json("items.json").get("items", [])}


async def check_and_unlock_achievements(
    session: AsyncSession,
    user: User,
    event: AchievementEvent,
    context: dict[str, Any] | None = None,
) -> list[NewAchievementEvent]:
    """Проверяет условия, выдаёт ачивки, предметы и XP.

    Использует цикл `while True`, чтобы если ачивка дала XP и это
    спровоцировало левелап, мы сразу проверили уровневые ачивки (ach_glob_*).
    """
    eligible_types = _EVENT_CONDITION_MAP.get(event, set())
    if not eligible_types:
        return []

    all_defs = _load_achievements()
    eligible = [a for a in all_defs if a.condition.type in eligible_types]
    if not eligible:
        return []

    existing_stmt = select(UserAchievement.achievement_code).where(
        UserAchievement.user_id == user.id
    )
    unlocked_codes: set[str] = set((await session.scalars(existing_stmt)).all())

    newly_unlocked: list[NewAchievementEvent] = []
    processed_in_this_call: set[str] = set()

    while True:
        unlocked_this_loop = 0
        xp_gained_this_loop = 0

        for ach in eligible:
            if ach.id in unlocked_codes or ach.id in processed_in_this_call:
                continue

            handler = _HANDLERS.get(ach.condition.type)
            if handler is None:
                continue

            try:
                satisfied, _current, _target = await handler(
                    session, user, ach.condition.params, context
                )
            except Exception:
                logger.exception(
                    "achievement_handler_failed",
                    extra={
                        "achievement_code": ach.id,
                        "condition_type": ach.condition.type,
                    },
                )
                continue

            if not satisfied:
                continue

            # Выдаем ачивку
            session.add(UserAchievement(user_id=user.id, achievement_code=ach.id))
            unlocked_codes.add(ach.id)
            processed_in_this_call.add(ach.id)
            unlocked_this_loop += 1

            newly_unlocked.append(
                NewAchievementEvent(
                    code=ach.id,
                    name=ach.name,
                    description=ach.description,
                    icon=ach.icon,
                    rarity=ach.rarity,
                    reward=ach.reward,
                )
            )

            # Начисляем награды
            reward_type = ach.reward.get("type")
            if reward_type == "xp":
                xp_gained_this_loop += int(ach.reward.get("amount", 0))
            elif reward_type == "item":
                item_id = ach.reward.get("item_id")
                amount = int(ach.reward.get("amount", 1))
                items_dict = _load_items()

                # Проверяем, существует ли предмет в JSON, чтобы не выдать битый
                if item_id in items_dict:
                    for _ in range(amount):
                        session.add(UserItem(user_id=user.id, item_code=item_id))
                else:
                    logger.warning(
                        "achievement_item_not_found",
                        extra={"achievement_code": ach.id, "item_id": item_id},
                    )

        # Если в этом цикле ничего не разблокировали — выходим
        if unlocked_this_loop == 0:
            break

        # Применяем XP и обновляем юзера, чтобы в следующем цикле
        # ачивки на уровень (ach_glob_*) увидели новый total_xp
        if xp_gained_this_loop > 0:
            await session.execute(
                update(User)
                .where(User.id == user.id)
                .values(total_xp=User.total_xp + xp_gained_this_loop)
            )
            await session.flush()
            await session.refresh(user)

    return newly_unlocked


async def get_achievement_progress(
    session: AsyncSession,
    user: User,
    ach: AchievementDef,
) -> tuple[bool, AchievementProgress | None]:
    """(satisfied, progress). progress=None для флагов и `manual`."""
    if ach.condition.type == "manual":
        return False, None
    handler = _HANDLERS.get(ach.condition.type)
    if handler is None:
        return False, None
    try:
        satisfied, current, target = await handler(session, user, ach.condition.params, None)
    except Exception:
        logger.exception(
            "achievement_progress_failed",
            extra={"achievement_code": ach.id},
        )
        return False, None
    if current is None or target is None:
        return satisfied, None
    return satisfied, AchievementProgress(current=current, target=target)


async def get_all_achievements_with_progress(
    session: AsyncSession,
    user: User,
) -> list[AchievementOut]:
    """Полный список достижений с unlocked/progress для GET /achievements.

    TODO(Day 18): сейчас по одному запросу на ачивку (~84 SELECT).
    MVP: приемлемо, при росте — batch-преагрегация.
    """
    all_defs = _load_achievements()
    existing_stmt = select(UserAchievement).where(UserAchievement.user_id == user.id)
    user_ach = (await session.scalars(existing_stmt)).all()
    unlocked_map = {ua.achievement_code: ua.unlocked_at for ua in user_ach}

    result: list[AchievementOut] = []
    for ach in all_defs:
        is_unlocked = ach.id in unlocked_map
        progress: AchievementProgress | None = None
        if not is_unlocked:
            _, progress = await get_achievement_progress(session, user, ach)
        result.append(
            AchievementOut(
                id=ach.id,
                name=ach.name,
                description=ach.description,
                icon=ach.icon,
                rarity=ach.rarity,
                reward=ach.reward,
                unlocked=is_unlocked,
                unlocked_at=unlocked_map.get(ach.id),
                progress=progress,
            )
        )
    return result


# ---------------------------------------------------------------------------
# Startup sanity checks
# ---------------------------------------------------------------------------


def _validate_handler_coverage() -> None:
    all_event_types: set[str] = set()
    for types in _EVENT_CONDITION_MAP.values():
        all_event_types |= types
    missing = set(_HANDLERS.keys()) - all_event_types
    if missing:
        logger.warning(
            "achievement_handlers_without_event",
            extra={"types": sorted(missing)},
        )


_validate_handler_coverage()
