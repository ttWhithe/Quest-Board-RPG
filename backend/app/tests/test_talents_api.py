from uuid import uuid4

import pytest
from httpx import AsyncClient


async def _get_auth_headers(client: AsyncClient) -> dict[str, str]:
    email = f"test_{uuid4().hex[:8]}@example.com"
    payload = {
        "email": email,
        "password": "password123",
        "nickname": "TestUser",
        "timezone": "UTC",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_get_talents_empty(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    response = await async_client.get("/api/v1/talents", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["available_points"] == 0
    assert data["total_spent_points"] == 0
    assert len(data["talents"]) == 3
    for t in data["talents"]:
        assert t["rank"] == 0
        assert t["can_upgrade"] is False


@pytest.mark.asyncio
async def test_upgrade_talent_no_points(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    response = await async_client.post("/api/v1/talents/guild_apprentice/upgrade", headers=headers)
    assert response.status_code == 409
    assert response.json()["code"] == "TALENT_UPGRADE_FAILED"


@pytest.mark.asyncio
async def test_upgrade_talent_success(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)

    # Даем XP: создаем S/legendary квест и выполняем (600 XP -> level 4 -> 3 очка)
    quest_payload = {
        "title": "Test Quest",
        "rank": "S",
        "rarity": "legendary",
        "recurrence": "none",
    }
    create_resp = await async_client.post("/api/v1/quests", json=quest_payload, headers=headers)
    quest_id = create_resp.json()["id"]
    await async_client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)

    response = await async_client.post("/api/v1/talents/guild_apprentice/upgrade", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["available_points"] == 2
    assert data["talent"]["rank"] == 1
    assert data["talent"]["code"] == "guild_apprentice"


@pytest.mark.asyncio
async def test_upgrade_prereq_not_met(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)

    quest_payload = {
        "title": "Test Quest",
        "rank": "S",
        "rarity": "legendary",
        "recurrence": "none",
    }
    create_resp = await async_client.post("/api/v1/quests", json=quest_payload, headers=headers)
    quest_id = create_resp.json()["id"]
    await async_client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)

    # Пытаемся взять arcane_focus (требует guild_apprentice >= 3)
    response = await async_client.post("/api/v1/talents/arcane_focus/upgrade", headers=headers)
    assert response.status_code == 409
    assert response.json()["code"] == "TALENT_UPGRADE_FAILED"


@pytest.mark.asyncio
async def test_talent_bonus_applied(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)

    # 1. Выполняем S/legendary квест (600 XP -> level 4 -> 3 очка)
    quest_payload = {
        "title": "Quest 1",
        "rank": "S",
        "rarity": "legendary",
        "recurrence": "none",
    }
    create_resp = await async_client.post("/api/v1/quests", json=quest_payload, headers=headers)
    quest_id = create_resp.json()["id"]
    complete_resp = await async_client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)
    assert complete_resp.json()["xp_awarded"] == 600

    # 2. Апаем guild_apprentice (2% xp bonus)
    await async_client.post("/api/v1/talents/guild_apprentice/upgrade", headers=headers)

    # 3. Выполняем еще один S/legendary квест (600 * 1.02 = 612)
    create_resp2 = await async_client.post("/api/v1/quests", json=quest_payload, headers=headers)
    quest_id2 = create_resp2.json()["id"]
    complete_resp2 = await async_client.post(
        f"/api/v1/quests/{quest_id2}/complete", headers=headers
    )
    assert complete_resp2.json()["xp_awarded"] == 612

    # 4. Проверяем, что GET /character возвращает бонус
    char_resp = await async_client.get("/api/v1/character", headers=headers)
    assert char_resp.status_code == 200
    assert char_resp.json()["xp_bonus_percent"] == 2
