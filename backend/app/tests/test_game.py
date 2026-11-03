"""Unit tests for core game logic (spec.md §10.1)."""

from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.game import (
    calc_xp,
    effective_status,
    is_completed_in_current_period,
    level_for_xp,
    xp_for_next_level,
    xp_into_level,
)

# --- calc_xp ---


def test_calc_xp_base() -> None:
    # S / legendary = 200 * 3.0 = 600
    assert calc_xp("S", "legendary") == 600
    # C / uncommon = 55 * 1.2 = 66
    assert calc_xp("C", "uncommon") == 66
    # D / rare = 35 * 1.5 = 52.5 -> floor -> 52
    assert calc_xp("D", "rare") == 52


def test_calc_xp_urgency() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)

    # 1. Без дедлайна
    assert calc_xp("F", "common", deadline=None, now=now) == 10

    # 2. Дедлайн в прошлом
    assert calc_xp("F", "common", deadline=now - timedelta(hours=1), now=now) == 10

    # 3. Дедлайн ровно через 24 часа (не срабатывает)
    assert calc_xp("F", "common", deadline=now + timedelta(hours=24), now=now) == 10

    # 4. Дедлайн через 23 часа 59 минут (срабатывает, x1.5)
    # 10 * 1.5 = 15
    assert calc_xp("F", "common", deadline=now + timedelta(hours=23, minutes=59), now=now) == 15

    # 5. Дедлайн ровно сейчас (срабатывает, x1.5)
    assert calc_xp("F", "common", deadline=now, now=now) == 15

    # 6. Рекуррентный квест (даже если дедлайн близко, срабатывает x1.0)
    assert (
        calc_xp("F", "common", recurrence="daily", deadline=now + timedelta(hours=1), now=now) == 10
    )


# --- Уровни ---


def test_level_calculations() -> None:
    # Проверочный ряд из §5.2
    assert level_for_xp(0) == 1
    assert level_for_xp(49) == 1
    assert level_for_xp(50) == 2
    assert level_for_xp(199) == 2
    assert level_for_xp(200) == 3
    assert level_for_xp(300) == 3

    assert xp_into_level(0) == 0
    assert xp_into_level(49) == 49
    assert xp_into_level(50) == 0
    assert xp_into_level(199) == 149
    assert xp_into_level(200) == 0
    assert xp_into_level(300) == 100

    assert xp_for_next_level(1) == 50
    assert xp_for_next_level(2) == 150
    assert xp_for_next_level(3) == 250


# --- Периоды рекуррентности ---


def test_is_completed_in_current_period() -> None:
    tz_moscow = ZoneInfo("Europe/Moscow")
    tz_tokyo = ZoneInfo("Asia/Tokyo")

    # Среда, 7 января 2026, 10:00 UTC (13:00 МСК, 19:00 Токио)
    # Выбрана среда, чтобы "минус 2 дня" (понедельник) попадало в текущую ISO-неделю
    now_utc = datetime(2026, 1, 7, 10, 0, 0, tzinfo=UTC)

    # --- daily ---
    assert is_completed_in_current_period(None, "daily", now_utc, tz_moscow) is False
    # Выполнено сегодня в 09:00 UTC
    assert (
        is_completed_in_current_period(now_utc - timedelta(hours=1), "daily", now_utc, tz_moscow)
        is True
    )
    # Выполнено вчера в 23:00 UTC (в Москве это уже сегодня 02:00)
    assert (
        is_completed_in_current_period(
            datetime(2026, 1, 6, 23, 0, tzinfo=UTC), "daily", now_utc, tz_moscow
        )
        is True
    )
    # Для Токио вчерашние 23:00 UTC — это сегодня 08:00
    assert (
        is_completed_in_current_period(
            datetime(2026, 1, 6, 23, 0, tzinfo=UTC), "daily", now_utc, tz_tokyo
        )
        is True
    )
    # Выполнено 5 дней назад
    assert (
        is_completed_in_current_period(now_utc - timedelta(days=5), "daily", now_utc, tz_moscow)
        is False
    )

    # --- weekly ---
    # Выполнено 2 дня назад (понедельник) — та же ISO-неделя (среда - понедельник)
    assert (
        is_completed_in_current_period(now_utc - timedelta(days=2), "weekly", now_utc, tz_moscow)
        is True
    )
    # Выполнено 3 дня назад (воскресенье) — прошлая ISO-неделя
    # (воскресенье - это конец прошлой недели)
    assert (
        is_completed_in_current_period(now_utc - timedelta(days=3), "weekly", now_utc, tz_moscow)
        is False
    )


# --- effective_status ---


class FakeQuest:
    def __init__(
        self,
        status: str,
        recurrence: str,
        deadline: datetime | None,
        last_completed_at: datetime | None = None,
    ):
        self.status = status
        self.recurrence = recurrence
        self.deadline = deadline
        self.last_completed_at = last_completed_at


def test_effective_status() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
    tz = UTC

    # archived, completed
    assert effective_status(FakeQuest("archived", "none", None), now, tz) == "archived"
    assert effective_status(FakeQuest("completed", "none", None), now, tz) == "completed"

    # daily/weekly, completed in period -> completed
    q_rec = FakeQuest("active", "daily", None, last_completed_at=now - timedelta(hours=1))
    assert effective_status(q_rec, now, tz) == "completed"

    # active + deadline < now -> failed
    q_failed = FakeQuest("active", "none", now - timedelta(hours=1))
    assert effective_status(q_failed, now, tz) == "failed"

    # active + deadline >= now -> active
    q_active = FakeQuest("active", "none", now + timedelta(hours=1))
    assert effective_status(q_active, now, tz) == "active"

    # active + deadline None -> active
    q_no_deadline = FakeQuest("active", "none", None)
    assert effective_status(q_no_deadline, now, tz) == "active"
