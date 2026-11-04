"""Integration tests for demo mode and rate limiting (Spec §7.8)."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_demo_creates_user_with_quests_and_events(async_client: AsyncClient) -> None:
    """POST /auth/demo должен создавать юзера, 13 квестов, 4 события и total_xp=238."""
    response = await async_client.post("/api/v1/auth/demo")
    assert response.status_code == 200

    data = response.json()
    assert data["user"]["nickname"] == "Странник"
    assert data["user"]["total_xp"] == 238
    assert data["user"]["is_demo"] is True

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Проверяем квесты (13 штук)
    quests_resp = await async_client.get("/api/v1/quests", headers=headers)
    assert quests_resp.status_code == 200
    assert len(quests_resp.json()["items"]) == 13

    # Проверяем события (4 штуки)
    events_resp = await async_client.get("/api/v1/events", headers=headers)
    assert events_resp.status_code == 200
    assert len(events_resp.json()) == 4


@pytest.mark.asyncio
async def test_demo_rate_limit(async_client: AsyncClient) -> None:
    """6-й запрос за час должен вернуть 429 RATE_LIMIT_EXCEEDED."""
    # Делаем 5 успешных запросов
    for _ in range(5):
        res = await async_client.post("/api/v1/auth/demo")
        assert res.status_code == 200

    # 6-й должен упасть
    res = await async_client.post("/api/v1/auth/demo")
    assert res.status_code == 429
    assert res.json()["code"] == "RATE_LIMIT_EXCEEDED"
