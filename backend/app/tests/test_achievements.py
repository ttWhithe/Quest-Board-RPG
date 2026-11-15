"""Тесты для API достижений."""

import pytest
from httpx import AsyncClient

from app.core.rate_limit import check_demo_rate_limit
from app.main import app


@pytest.mark.asyncio
async def test_achievements_flow(async_client: AsyncClient) -> None:
    app.dependency_overrides[check_demo_rate_limit] = lambda: None
    try:
        res = await async_client.post("/api/v1/auth/demo")
    finally:
        app.dependency_overrides.pop(check_demo_rate_limit, None)

    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # 1. Получаем список достижений
    get_res = await async_client.get("/api/v1/achievements", headers=headers)
    assert get_res.status_code == 200
    achievements = get_res.json()
    assert len(achievements) > 0
    ach_id = achievements[0]["id"]

    # 2. Разблокируем достижение
    unlock_res = await async_client.post(f"/api/v1/achievements/{ach_id}/unlock", headers=headers)
    assert unlock_res.status_code == 200
    assert unlock_res.json()["unlocked"] is True
    assert unlock_res.json()["unlocked_at"] is not None

    # 3. Пробуем разблокировать несуществующую (Sad Path)
    bad_res = await async_client.post("/api/v1/achievements/invalid_id_123/unlock", headers=headers)
    assert bad_res.status_code == 404
    assert bad_res.json()["code"] == "NOT_FOUND"
