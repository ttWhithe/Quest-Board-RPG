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
async def test_get_talents_tree(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    response = await async_client.get("/api/v1/talents", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["available_points"] == 0
    assert len(data["nodes"]) >= 13
    assert len(data["edges"]) >= 12

    start_node = next(n for n in data["nodes"] if n["id"] == "skyrim_start")
    assert start_node["type"] == "start"
    assert start_node["can_upgrade"] is False


@pytest.mark.asyncio
async def test_upgrade_talent_success(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)

    # Даем XP (S/legendary = 600 XP -> level 4 -> 3 очка)
    quest_payload = {
        "title": "Test Quest",
        "rank": "S",
        "rarity": "legendary",
        "recurrence": "none",
    }
    create_resp = await async_client.post("/api/v1/quests", json=quest_payload, headers=headers)
    quest_id = create_resp.json()["id"]
    await async_client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)

    # Пытаемся прокачать illusion_1 (родитель illusion_root не прокачан) -> 409
    resp_fail = await async_client.post("/api/v1/talents/illusion_1/upgrade", headers=headers)
    assert resp_fail.status_code == 409

    # Прокачиваем illusion_root (связан со skyrim_start)
    resp_root = await async_client.post("/api/v1/talents/illusion_root/upgrade", headers=headers)
    assert resp_root.status_code == 200
    assert resp_root.json()["node"]["rank"] == 1

    # Теперь illusion_1 должен разблокироваться
    resp_ok = await async_client.post("/api/v1/talents/illusion_1/upgrade", headers=headers)
    assert resp_ok.status_code == 200
