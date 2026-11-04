import asyncio
import os
import sys
from collections.abc import AsyncGenerator

import pytest_asyncio

# Фикс для Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Настройка env
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = (
        "postgresql+asyncpg://questboard:questboard@localhost:5432/questboard"
    )
if "REDIS_URL" not in os.environ:
    os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from httpx import ASGITransport, AsyncClient

from app.db import engine
from app.main import app


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Асинхронный клиент для тестирования FastAPI-эндпоинтов."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture(autouse=True)
async def dispose_engine() -> AsyncGenerator[None, None]:
    """Закрываем пул соединений БД после каждого теста.

    Это гарантирует, что следующий тест в новом Event Loop создаст новые соединения,
    а не будет пытаться использовать старые (что вызывает ошибку).
    """
    yield
    await engine.dispose()
