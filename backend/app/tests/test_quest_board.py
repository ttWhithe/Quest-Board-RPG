"""Тесты для визуальных полей Quest Board (Day 20)."""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient


async def _create_user(async_client: AsyncClient) -> dict[str, str]:
    email = f"board-{uuid4().hex[:8]}@test.local"
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123",
            "nickname": "BoardTester",
            "timezone": "UTC",
        },
    )
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_create_quest_with_visuals(async_client: AsyncClient) -> None:
    headers = await _create_user(async_client)

    payload = {
        "title": "Убить дракона",
        "rank": "S",
        "rarity": "legendary",
        "image_preset": "dragon",
        "has_watermark": True,
    }
    res = await async_client.post("/api/v1/quests", json=payload, headers=headers)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["image_preset"] == "dragon"
    assert data["has_watermark"] is True


@pytest.mark.asyncio
async def test_invalid_image_preset(async_client: AsyncClient) -> None:
    headers = await _create_user(async_client)

    payload = {
        "title": "Test Quest",
        "rank": "F",
        "rarity": "common",
        "image_preset": "invalid_preset_name",
    }
    res = await async_client.post("/api/v1/quests", json=payload, headers=headers)
    assert res.status_code == 422
    assert res.json()["code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_update_quest_visuals(async_client: AsyncClient) -> None:
    headers = await _create_user(async_client)

    # Создаем
    res = await async_client.post(
        "/api/v1/quests",
        json={"title": "Test", "rank": "C", "rarity": "rare"},
        headers=headers,
    )
    quest_id = res.json()["id"]

    # Обновляем
    res = await async_client.patch(
        f"/api/v1/quests/{quest_id}",
        json={"image_preset": "sword", "has_watermark": True},
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["image_preset"] == "sword"
    assert data["has_watermark"] is True

    # Проверяем, что сохранилось
    res = await async_client.get(f"/api/v1/quests/{quest_id}", headers=headers)
    assert res.json()["image_preset"] == "sword"
