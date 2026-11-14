"""Логика ежедневных входов и стриков."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from app.models.user import User


def update_login_streak(user: User) -> bool:
    """
    Обновляет стрик при входе.
    Возвращает True, если это первый вход за сегодня (нужно показать награду).
    """
    now_utc = datetime.now(UTC)
    tz = ZoneInfo(user.timezone)
    now_local = now_utc.astimezone(tz)
    today = now_local.date()

    # Если пользователь заходил сегодня, ничего не меняем
    if user.last_login_at:
        last_local = user.last_login_at.astimezone(tz).date()
        if today == last_local:
            return False

        delta = (today - last_local).days
        if delta == 1:
            user.login_streak += 1
        else:
            user.login_streak = 1
    else:
        user.login_streak = 1

    user.last_login_at = now_utc
    if user.login_streak > user.max_login_streak:
        user.max_login_streak = user.login_streak

    return True


def can_claim_daily_reward(user: User) -> bool:
    """Проверяет, можно ли забрать награду сегодня."""
    if not user.last_daily_reward_at:
        return True

    now_utc = datetime.now(UTC)
    tz = ZoneInfo(user.timezone)
    now_local = now_utc.astimezone(tz)
    last_claim_local = user.last_daily_reward_at.astimezone(tz)

    return now_local.date() > last_claim_local.date()
