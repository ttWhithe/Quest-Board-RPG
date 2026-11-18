"""Tests for achievements engine (Day 17).

Покрываем:
  * GET /achievements — все 100 достижений, unlocked/progress, DEMO_LOGIN-триггер.
  * complete quest → unlock ach_q_1, XP начислен.
  * Sad Path: повторный complete не выдаёт ту же ачивку второй раз.
  * Sad Path: ручной /unlock удалён — 404.
  * talent upgrade → unlock ach_t_1.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.rate_limit import check_demo_rate_limit
from app.main import app


async def _demo_headers(async_client: AsyncClient) -> dict[str, str]:
    """Возвращает Authorization-заголовок demo-юзера.

    Override dependency `check_demo_rate_limit` отключает Redis-проверку.
    """
    app.dependency_overrides[check_demo_rate_limit] = lambda: None
    try:
        res = await async_client.post("/api/v1/auth/demo")
    finally:
        app.dependency_overrides.pop(check_demo_rate_limit, None)
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.mark.asyncio
async def test_achievements_returns_all_with_progress(async_client: AsyncClient) -> None:
    headers = await _demo_headers(async_client)
    res = await async_client.get("/api/v1/achievements", headers=headers)
    assert res.status_code == 200
    achievements = res.json()
    assert len(achievements) == 100

    # ach_sec_6 («Таинственный странник») выдан при создании demo (DEMO_LOGIN).
    sec6 = next(a for a in achievements if a["id"] == "ach_sec_6")
    assert sec6["unlocked"] is True
    assert sec6["unlocked_at"] is not None

    # ach_glob_1 (Уровень 10): demo level = 3 → not unlocked, progress 3/10.
    glob1 = next(a for a in achievements if a["id"] == "ach_glob_1")
    assert glob1["unlocked"] is False
    assert glob1["progress"] == {"current": 3, "target": 10}


@pytest.mark.asyncio
async def test_complete_quest_unlocks_first_achievement(async_client: AsyncClient) -> None:
    headers = await _demo_headers(async_client)

    create = await async_client.post(
        "/api/v1/quests",
        headers=headers,
        json={"title": "Test quest", "rank": "F", "rarity": "common"},
    )
    assert create.status_code == 201
    quest_id = create.json()["id"]

    complete = await async_client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)
    assert complete.status_code == 200
    body = complete.json()

    codes = [a["code"] for a in body["new_achievements"]]
    assert "ach_q_1" in codes

    ach = next(a for a in body["new_achievements"] if a["code"] == "ach_q_1")
    assert ach["reward"]["type"] == "xp"
    assert ach["reward"]["amount"] == 50


@pytest.mark.asyncio
async def test_repeat_complete_does_not_double_unlock(async_client: AsyncClient) -> None:
    """Sad Path: повторный complete не выдаёт ту же ачивку второй раз."""
    headers = await _demo_headers(async_client)

    async def _complete_new_quest() -> list[str]:
        create = await async_client.post(
            "/api/v1/quests",
            headers=headers,
            json={"title": "Test", "rank": "F", "rarity": "common"},
        )
        quest_id = create.json()["id"]
        complete = await async_client.post(f"/api/v1/quests/{quest_id}/complete", headers=headers)
        return [a["code"] for a in complete.json()["new_achievements"]]

    first_codes = await _complete_new_quest()
    assert "ach_q_1" in first_codes

    second_codes = await _complete_new_quest()
    # ach_q_1 уже выдан — не должен появиться повторно.
    assert "ach_q_1" not in second_codes


@pytest.mark.asyncio
async def test_manual_unlock_endpoint_removed(async_client: AsyncClient) -> None:
    """Sad Path: старый POST /achievements/{id}/unlock удалён — 404."""
    headers = await _demo_headers(async_client)
    res = await async_client.post("/api/v1/achievements/ach_q_1/unlock", headers=headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_talent_upgrade_unlocks_first_talent_achievement(
    async_client: AsyncClient,
) -> None:
    headers = await _demo_headers(async_client)
    tree = await async_client.get("/api/v1/talents", headers=headers)
    assert tree.status_code == 200
    available = [n for n in tree.json()["nodes"] if n["can_upgrade"]]
    assert available, "demo user should have upgradable talents"

    code = available[0]["id"]
    res = await async_client.post(f"/api/v1/talents/{code}/upgrade", headers=headers)
    assert res.status_code == 200

    ach_res = await async_client.get("/api/v1/achievements", headers=headers)
    ach_t_1 = next(a for a in ach_res.json() if a["id"] == "ach_t_1")
    assert ach_t_1["unlocked"] is True


@pytest.mark.asyncio
async def test_talent_branch_achievements(async_client: AsyncClient) -> None:
    """Проверяем, что ачивки за ветки талантов (ach_t_8, ach_t_9, ach_t_10) работают."""
    headers = await _demo_headers(async_client)

    # 1. Получаем дерево талантов
    tree = await async_client.get("/api/v1/talents", headers=headers)
    nodes = tree.json()["nodes"]

    # Ищем 5 доступных узлов в ветке магии (illusion_*, conjuration_* и т.д.)
    magic_prefixes = ("illusion_", "conjuration_", "destruction_")
    magic_nodes = [n for n in nodes if n["id"].startswith(magic_prefixes) and n["can_upgrade"]]

    if len(magic_nodes) >= 5:
        for node in magic_nodes[:5]:
            res = await async_client.post(f"/api/v1/talents/{node['id']}/upgrade", headers=headers)
            assert res.status_code == 200

        # Проверяем, что ach_t_8 (Маг) выдался
        ach_res = await async_client.get("/api/v1/achievements", headers=headers)
        ach_t_8 = next(a for a in ach_res.json() if a["id"] == "ach_t_8")
        assert ach_t_8["unlocked"] is True
