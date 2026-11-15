"""Тесты для API персонажа."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_avatar_invalid_format(async_client: AsyncClient) -> None:
    res = await async_client.post("/api/v1/auth/demo")
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Отправляем текстовый файл вместо картинки (Sad Path)
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    upload_res = await async_client.post("/api/v1/character/avatar", headers=headers, files=files)

    assert upload_res.status_code == 422
    assert upload_res.json()["code"] == "INVALID_IMAGE"
