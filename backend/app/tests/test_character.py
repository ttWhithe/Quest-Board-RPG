"""Тесты для API персонажа."""

from io import BytesIO

import pytest
from httpx import AsyncClient
from PIL import Image

from app.core.rate_limit import check_demo_rate_limit
from app.main import app


@pytest.mark.asyncio
async def test_upload_avatar_invalid_format(async_client: AsyncClient) -> None:
    app.dependency_overrides[check_demo_rate_limit] = lambda: None
    try:
        res = await async_client.post("/api/v1/auth/demo")
    finally:
        app.dependency_overrides.pop(check_demo_rate_limit, None)

    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Отправляем текстовый файл вместо картинки (Sad Path)
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    upload_res = await async_client.post("/api/v1/character/avatar", headers=headers, files=files)

    assert upload_res.status_code == 422
    assert upload_res.json()["code"] == "INVALID_IMAGE"


@pytest.mark.asyncio
async def test_upload_avatar_success(async_client: AsyncClient) -> None:
    app.dependency_overrides[check_demo_rate_limit] = lambda: None
    try:
        res = await async_client.post("/api/v1/auth/demo")
    finally:
        app.dependency_overrides.pop(check_demo_rate_limit, None)

    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Создаем валидную картинку 10x10 в памяти
    img = Image.new("RGB", (10, 10), color="red")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("test.png", buf.read(), "image/png")}
    upload_res = await async_client.post("/api/v1/character/avatar", headers=headers, files=files)

    assert upload_res.status_code == 200
    assert upload_res.json()["user"]["avatar_url"] is not None
