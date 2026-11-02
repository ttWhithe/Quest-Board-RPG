import os
from collections.abc import AsyncGenerator

# При локальном запуске тестов на хосте (Windows/Mac) используем localhost.
# В Docker или CI эта переменная уже будет задана окружением, и мы её не перезапишем.
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = (
        "postgresql+asyncpg://questboard:questboard@localhost:5432/questboard"
    )

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Асинхронный клиент для тестирования FastAPI-эндпоинтов."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
