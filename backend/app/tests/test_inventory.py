"""Интеграционные тесты для инвентаря (UserItem)."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


async def _get_auth_headers(async_client: AsyncClient) -> dict[str, str]:
    """Хелпер: регистрация и получение токена (уникальный email на каждый тест)."""
    email = f"inventory_{uuid.uuid4().hex}@test.com"
    res = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "nickname": "InventoryTester",
            "timezone": "UTC",
        },
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_inventory_get_defaults(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    res = await async_client.get("/api/v1/character/inventory", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 100
    # Проверяем, что по умолчанию предметы не закреплены и не надеты
    first_item = data["items"][0]
    assert first_item["is_pinned"] is False
    assert first_item["equipped_slot"] is None


@pytest.mark.asyncio
async def test_inventory_pin_item(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    res = await async_client.patch(
        "/api/v1/character/inventory/item_001",
        headers=headers,
        json={"is_pinned": True},
    )
    assert res.status_code == 200
    assert res.json()["is_pinned"] is True

    # Проверяем, что состояние сохранилось при следующем GET
    res_get = await async_client.get("/api/v1/character/inventory", headers=headers)
    item_001 = next(i for i in res_get.json()["items"] if i["id"] == "item_001")
    assert item_001["is_pinned"] is True


@pytest.mark.asyncio
async def test_inventory_equip_item(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    # item_006 — "Железный шлем" (слот head)
    res = await async_client.patch(
        "/api/v1/character/inventory/item_006",
        headers=headers,
        json={"equipped_slot": "head"},
    )
    assert res.status_code == 200
    assert res.json()["equipped_slot"] == "head"


@pytest.mark.asyncio
async def test_inventory_equip_swaps_slot(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    # Надеваем первый шлем
    await async_client.patch(
        "/api/v1/character/inventory/item_006",
        headers=headers,
        json={"equipped_slot": "head"},
    )
    # Надеваем второй шлем (item_007 — "Рогатый шлем")
    res = await async_client.patch(
        "/api/v1/character/inventory/item_007",
        headers=headers,
        json={"equipped_slot": "head"},
    )
    assert res.status_code == 200

    # Проверяем, что первый шлем автоматически снялся
    res_get = await async_client.get("/api/v1/character/inventory", headers=headers)
    item_006 = next(i for i in res_get.json()["items"] if i["id"] == "item_006")
    assert item_006["equipped_slot"] is None  # Снят


@pytest.mark.asyncio
async def test_inventory_equip_wrong_slot(async_client: AsyncClient) -> None:
    headers = await _get_auth_headers(async_client)
    # item_006 — это шлем (head). Пытаемся надеть на "feet".
    res = await async_client.patch(
        "/api/v1/character/inventory/item_006",
        headers=headers,
        json={"equipped_slot": "feet"},
    )
    assert res.status_code == 422
    assert res.json()["detail"] == "Item must be equipped to head"
