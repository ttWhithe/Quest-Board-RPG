"""Daily reset для tracking_stats.

Ленивый сброс: не cron, не фоновая задача. Сравниваем `last_daily_reset_date`
с «сегодня» в TZ пользователя (§5.6 spec) при первом обращении к tracking_stats.

Почему lazy:
  * не зависит от аптайма воркера;
  * не требует синхронизации при нескольких инстансах API;
  * тривиально тестируется (unit test без моков фоновых задач).

Ключи из DAILY_STAT_KEYS обнуляются при смене дня.
Кумулятивные ключи (например, emblem_changes_total) НЕ входят в набор
и живут вечно — их сбрасывает только пользователь через devtools.
"""

from __future__ import annotations

from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models.user import User

# Ключи, которые сбрасываются при наступлении нового дня (в TZ пользователя).
# Пополнять при появлении новых daily-ачивок.
# ВАЖНО: кумулятивные счётчики (emblem_changes_total) сюда НЕ добавлять.
DAILY_STAT_KEYS: frozenset[str] = frozenset(
    {
        "equip_changes_today",
        "nickname_changed_today",
        "emblem_changed_today",
        "quests_completed_today",
    }
)


def _user_tz(user: User) -> ZoneInfo:
    """TZ пользователя с fallback на UTC (как в api/quests.py и core/achievements.py)."""
    try:
        return ZoneInfo(user.timezone)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def apply_daily_reset(user: User, now: datetime | None = None) -> bool:
    """Сбрасывает дневные счётчики, если сменился локальный день.

    Мутирует `user` in-place:
      * устанавливает `last_daily_reset_date` в сегодняшнюю локальную дату;
      * обнуляет ключи из DAILY_STAT_KEYS в `tracking_stats` (пересоздаёт dict —
        SQLAlchemy не отслеживает in-place мутации JSONB).

    Возвращает True, если был применён сброс или обновлена дата
    (caller должен сделать flush/commit).
    """
    now = now or datetime.now(UTC)
    today_local = now.astimezone(_user_tz(user)).date()

    if user.last_daily_reset_date == today_local:
        return False

    stats = dict(user.tracking_stats or {})
    for key in DAILY_STAT_KEYS:
        if key in stats:
            stats[key] = 0
    user.tracking_stats = stats
    user.last_daily_reset_date = today_local
    return True
