"""Игровая логика: XP, уровни, effective_status.

Единая точка правды (spec.md §4.3). Формулы — §5.1, §5.2, §5.5, §5.6, §7.5.
Никаких зависимостей от моделей и БД — чистые функции для юнит-тестов.
"""

from __future__ import annotations

import math
from datetime import UTC, datetime, timedelta, tzinfo
from typing import Literal, Protocol

# ---------------------------------------------------------------------------
# Константы (spec.md §5.1)
# ---------------------------------------------------------------------------

BASE_XP: dict[str, int] = {
    "F": 10,
    "E": 20,
    "D": 35,
    "C": 55,
    "B": 80,
    "A": 120,
    "S": 200,
}

RARITY_MULT: dict[str, float] = {
    "common": 1.0,
    "uncommon": 1.2,
    "rare": 1.5,
    "epic": 2.0,
    "legendary": 3.0,
}

XP_PER_LEVEL: int = 50
URGENCY_WINDOW: timedelta = timedelta(hours=24)
URGENCY_MULT: float = 1.5
NORMAL_MULT: float = 1.0

UTC = UTC

EffectiveStatus = Literal["active", "completed", "failed", "archived"]


# ---------------------------------------------------------------------------
# Утилиты
# ---------------------------------------------------------------------------


def _as_aware(dt: datetime) -> datetime:
    """tz-aware; naive считаем UTC (безопасно для timestamptz)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


class QuestLike(Protocol):
    """Минимальный контракт квеста для `effective_status` (§7.5).

    Свойства (а не атрибуты) — чтобы `Mapped[Rank]` (str-Enum) был
    совместим с `str` по ковариантности. Иначе strict-mypy ругается
    на инвариантность протоколов.
    """

    @property
    def status(self) -> str: ...
    @property
    def recurrence(self) -> str: ...
    @property
    def deadline(self) -> datetime | None: ...
    @property
    def last_completed_at(self) -> datetime | None: ...


# ---------------------------------------------------------------------------
# XP (§5.1, §5.5)
# ---------------------------------------------------------------------------


def is_urgent(
    recurrence: str,
    deadline: datetime | None,
    now: datetime,
) -> bool:
    """§5.5: бонус 1.5× применяется ⇔ все три условия истинны:

        1) recurrence == 'none';
        2) deadline задан;
        3) 0 <= (deadline − now) < 24h.

    При deadline == now — бонус да; при deadline < now — уже нет.
    """
    if recurrence != "none":
        return False
    if deadline is None:
        return False
    delta = _as_aware(deadline) - _as_aware(now)
    return timedelta(0) <= delta < URGENCY_WINDOW


def calc_xp(
    rank: str,
    rarity: str,
    *,
    recurrence: str = "none",
    deadline: datetime | None = None,
    now: datetime | None = None,
) -> int:
    """§5.1:  XP = floor(base[rank] × mult[rarity] × urgency_mult).

    `now` по умолчанию — текущее UTC; в тестах передавайте явно
    (иначе результат недетерминирован).
    """
    if now is None:
        now = datetime.now(UTC)
    base = BASE_XP[rank]
    mult = RARITY_MULT[rarity]
    urgency = URGENCY_MULT if is_urgent(recurrence, deadline, now) else NORMAL_MULT
    return math.floor(base * mult * urgency)


# ---------------------------------------------------------------------------
# Уровень (§5.2)
# ---------------------------------------------------------------------------


def level_for_xp(total_xp: int) -> int:
    """level = floor(sqrt(total_xp / 50)) + 1."""
    if total_xp < 0:
        total_xp = 0
    return math.floor(math.sqrt(total_xp / XP_PER_LEVEL)) + 1


def xp_threshold(level: int) -> int:
    """Минимальный total_xp, чтобы **достичь** уровня `level`: 50·(level−1)²."""
    return XP_PER_LEVEL * (level - 1) ** 2


def xp_into_level(total_xp: int) -> int:
    """Сколько XP набрано внутри текущего уровня."""
    if total_xp < 0:
        total_xp = 0
    lvl = level_for_xp(total_xp)
    return total_xp - xp_threshold(lvl)


def xp_for_next_level(level: int) -> int:
    """Сколько XP нужно, чтобы подняться с `level` на `level+1`: 50·(2·level−1)."""
    return XP_PER_LEVEL * (2 * level - 1)


# ---------------------------------------------------------------------------
# Рекуррентность и effective_status (§5.3, §5.6, §7.5)
# ---------------------------------------------------------------------------


def is_completed_in_current_period(
    last_completed_at: datetime | None,
    recurrence: str,
    now: datetime,
    tz: tzinfo,
) -> bool:
    """§5.3/§5.6: попадает ли завершение в текущие сутки/неделю в TZ `tz`.

    Начало недели — понедельник (ISO 8601). Сравнение — по локальным
    датам/ISO-неделе, поэтому переход через полночь в `Asia/Tokyo`
    при UTC-`now` обрабатывается корректно.
    """
    if last_completed_at is None or recurrence == "none":
        return False
    last_local = _as_aware(last_completed_at).astimezone(tz)
    now_local = _as_aware(now).astimezone(tz)
    if recurrence == "daily":
        return last_local.date() == now_local.date()
    if recurrence == "weekly":
        return last_local.isocalendar()[:2] == now_local.isocalendar()[:2]
    return False


def effective_status(
    quest: QuestLike,
    now: datetime,
    tz: tzinfo,
) -> EffectiveStatus:
    """§7.5: вычисляемый статус. Порядок проверок — как в ТЗ.

    - archived → 'archived'
    - completed → 'completed'
    - daily/weekly + last_completed_at в текущем периоде → 'completed'
    - deadline < now → 'failed'
    - иначе → 'active'
    """
    if quest.status == "archived":
        return "archived"
    if quest.status == "completed":
        return "completed"
    if quest.recurrence in ("daily", "weekly") and is_completed_in_current_period(
        quest.last_completed_at,
        quest.recurrence,
        now,
        tz,
    ):
        return "completed"
    if quest.deadline is not None and _as_aware(quest.deadline) < _as_aware(now):
        return "failed"
    return "active"
