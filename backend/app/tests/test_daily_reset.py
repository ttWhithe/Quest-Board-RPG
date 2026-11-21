"""Unit + интеграционные тесты для daily reset tracking_stats (Day 20)."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.daily_reset import DAILY_STAT_KEYS, apply_daily_reset
from app.db import engine
from app.models.user import User


def _make_user(
    *,
    timezone: str = "UTC",
    tracking_stats: dict[str, int] | None = None,
    last_reset: date | None = None,
) -> User:
    """User без БД — только для unit-проверок apply_daily_reset."""
    return User(
        nickname="Tester",
        emblem_seed="seed-42",
        timezone=timezone,
        tracking_stats=tracking_stats or {},
        last_daily_reset_date=last_reset,
    )


class TestApplyDailyReset:
    def test_first_call_sets_date_without_reset(self) -> None:
        user = _make_user(tracking_stats={"emblem_click": 5})
        now = datetime(2026, 11, 21, 12, 0, tzinfo=UTC)

        assert apply_daily_reset(user, now) is True
        assert user.last_daily_reset_date == date(2026, 11, 21)
        # Кумулятивные не тронуты
        assert user.tracking_stats["emblem_click"] == 5

    def test_same_day_is_noop(self) -> None:
        user = _make_user(
            tracking_stats={"equip_changes_today": 7},
            last_reset=date(2026, 11, 21),
        )
        now = datetime(2026, 11, 21, 23, 59, tzinfo=UTC)

        assert apply_daily_reset(user, now) is False
        assert user.tracking_stats["equip_changes_today"] == 7

    def test_new_day_resets_daily_keys_only(self) -> None:
        user = _make_user(
            tracking_stats={
                "equip_changes_today": 9,
                "emblem_changes_total": 42,
                "emblem_click": 3,
            },
            last_reset=date(2026, 11, 20),
        )
        now = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)

        assert apply_daily_reset(user, now) is True
        assert user.last_daily_reset_date == date(2026, 11, 21)
        assert user.tracking_stats["equip_changes_today"] == 0
        assert user.tracking_stats["emblem_changes_total"] == 42  # кумулятивный
        assert user.tracking_stats["emblem_click"] == 3  # кумулятивный

    def test_respects_user_timezone(self) -> None:
        """На UTC ещё вчера, но у пользователя в Asia/Tokyo уже завтра."""
        user = _make_user(
            timezone="Asia/Tokyo",
            tracking_stats={"emblem_changed_today": 5},
            last_reset=date(2026, 11, 20),
        )
        # 2026-11-20 22:00 UTC == 2026-11-21 07:00 Asia/Tokyo
        now = datetime(2026, 11, 20, 22, 0, tzinfo=UTC)

        assert apply_daily_reset(user, now) is True
        assert user.last_daily_reset_date == date(2026, 11, 21)
        assert user.tracking_stats["emblem_changed_today"] == 0

    def test_invalid_timezone_falls_back_to_utc(self) -> None:
        user = _make_user(
            timezone="Invalid/Zone",
            tracking_stats={"equip_changes_today": 2},
            last_reset=date(2026, 11, 20),
        )
        now = datetime(2026, 11, 21, 0, 1, tzinfo=UTC)

        assert apply_daily_reset(user, now) is True
        assert user.last_daily_reset_date == date(2026, 11, 21)

    def test_empty_stats_with_new_day(self) -> None:
        user = _make_user(last_reset=date(2026, 11, 20))
        now = datetime(2026, 11, 21, 5, 0, tzinfo=UTC)

        assert apply_daily_reset(user, now) is True
        assert user.last_daily_reset_date == date(2026, 11, 21)
        assert user.tracking_stats == {}

    def test_daily_keys_constant_does_not_contain_cumulative(self) -> None:
        """Защита от случайного добавления кумулятивных в DAILY_STAT_KEYS."""
        assert "emblem_changes_total" not in DAILY_STAT_KEYS
        assert "emblem_click" not in DAILY_STAT_KEYS
        assert "inventory_open" not in DAILY_STAT_KEYS
        # А daily-ключи — на месте
        assert "equip_changes_today" in DAILY_STAT_KEYS
        assert "nickname_changed_today" in DAILY_STAT_KEYS
        assert "emblem_changed_today" in DAILY_STAT_KEYS


class TestDailyResetIntegration:
    """Интеграционный тест через реальный HTTP-эндпоинт.

    Использует только `async_client` (единственная фикстура в conftest.py).
    Юзер регистрируется инлайн с уникальным email — БД между тестами не чистится.
    """

    @pytest.mark.asyncio
    async def test_track_resets_after_day_change(self, async_client) -> None:
        # 1. Уникальный пользователь
        email = f"daily-reset-{uuid4().hex[:12]}@test.local"
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "Password123",
                "nickname": "DailyResetTester",
                "timezone": "UTC",
            },
        )
        assert reg.status_code == 201, reg.text
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. «Сегодня»: daily + кумулятивный
        r1 = await async_client.post(
            "/api/v1/achievements/track",
            json={"stat_name": "equip_changes_today"},
            headers=headers,
        )
        assert r1.status_code == 200, r1.text

        r2 = await async_client.post(
            "/api/v1/achievements/track",
            json={"stat_name": "emblem_changes_total"},
            headers=headers,
        )
        assert r2.status_code == 200, r2.text

        # 3. Симулируем «вчера» через прямую запись в БД
        async with AsyncSession(engine) as session:
            user = await session.scalar(select(User).where(User.email == email))
            assert user is not None
            user.last_daily_reset_date = datetime.now(UTC).date() - timedelta(days=1)
            await session.commit()

        # 4. «Новый день»: daily → 1, кумулятивный продолжает → 2
        r3 = await async_client.post(
            "/api/v1/achievements/track",
            json={"stat_name": "equip_changes_today"},
            headers=headers,
        )
        assert r3.status_code == 200, r3.text

        r4 = await async_client.post(
            "/api/v1/achievements/track",
            json={"stat_name": "emblem_changes_total"},
            headers=headers,
        )
        assert r4.status_code == 200, r4.text

        # 5. Проверяем в свежей сессии
        async with AsyncSession(engine) as session:
            user = await session.scalar(select(User).where(User.email == email))
            assert user is not None
            assert user.tracking_stats["equip_changes_today"] == 1
            assert user.tracking_stats["emblem_changes_total"] == 2
