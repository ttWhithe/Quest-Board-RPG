"""Тесты для стриков, ежедневных наград и множителей редкости."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.streaks import update_login_streak
from app.models.user import User


@pytest.mark.asyncio
async def test_update_login_streak_new_user(async_client: AsyncClient):
    """Проверяем, что у нового пользователя стрик становится 1."""
    email = f"test_streak_{uuid4()}@example.com"
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "nickname": "StreakTester",
            "timezone": "UTC",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["login_streak"] == 1


@pytest.mark.asyncio
async def test_streak_logic_manually():
    """Тестируем чистую логику функции update_login_streak."""
    user = User(
        id=uuid4(),
        nickname="Test",
        emblem_seed="seed",
        timezone="UTC",
        last_login_at=datetime.now(UTC) - timedelta(days=1),
        login_streak=1,
    )

    # Заходим сегодня (прошло 1 день) -> стрик +1
    updated = update_login_streak(user)
    assert updated is True
    assert user.login_streak == 2

    # Заходим повторно в тот же день -> стрик не меняется
    updated_again = update_login_streak(user)
    assert updated_again is False
    assert user.login_streak == 2

    # Имитируем пропуск дня (заходили 3 дня назад) -> стрик сбрасывается
    user.last_login_at = datetime.now(UTC) - timedelta(days=3)
    update_login_streak(user)
    assert user.login_streak == 1


@pytest.mark.asyncio
async def test_daily_reward_flow(async_client: AsyncClient):
    """Полный цикл получения награды."""
    email = f"test_reward_{uuid4()}@example.com"
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "nickname": "RewardTester",
            "timezone": "UTC",
        },
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Проверяем инфу о наградах
    info_res = await async_client.get("/api/v1/auth/daily-reward", headers=headers)
    assert info_res.status_code == 200
    assert info_res.json()["can_claim"] is True
    assert info_res.json()["current_day"] == 1

    # 2. Забираем награду
    claim_res = await async_client.post("/api/v1/auth/daily-reward", headers=headers)
    assert claim_res.status_code == 200
    data = claim_res.json()
    assert data["success"] is True
    assert data["xp_awarded"] > 0

    # 3. Пытаемся забрать еще раз (Sad Path)
    claim_again = await async_client.post("/api/v1/auth/daily-reward", headers=headers)
    assert claim_again.status_code == 409
    assert claim_again.json()["code"] == "ALREADY_CLAIMED"


@pytest.mark.asyncio
async def test_rarity_multipliers_in_stats(async_client: AsyncClient):
    """Проверяем, что редкость предмета умножает статы."""
    email = f"test_rarity_{uuid4()}@example.com"
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "nickname": "RarityTester",
            "timezone": "UTC",
        },
    )
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Надеваем меч
    await async_client.patch(
        "/api/v1/character/inventory/item_001",
        json={"equipped_slot": "main_hand"},
        headers=headers,
    )

    # Проверяем базовые статы (Сила 5.0 + 1 от меча = 6.0)
    stats_base = (await async_client.get("/api/v1/character/stats", headers=headers)).json()
    assert stats_base["stats"]["strength"] == 6.0

    # Меняем редкость на Legendary (множитель x3.5)
    await async_client.patch(
        "/api/v1/character/inventory/item_001",
        json={"rarity": "legendary"},
        headers=headers,
    )

    # Проверяем статы (Сила 5.0 + 1 * 3.5 = 8.5)
    stats_leg = (await async_client.get("/api/v1/character/stats", headers=headers)).json()
    assert stats_leg["stats"]["strength"] == 8.5
