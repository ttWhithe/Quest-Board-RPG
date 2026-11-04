import asyncio
import os
import sys
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio

# 1. Фикс для Windows: asyncpg и redis не любят ProactorEventLoop
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# 2. Настройка переменных окружения для локальных тестов
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = (
        "postgresql+asyncpg://questboard:questboard@localhost:5432/questboard"
    )

if "REDIS_URL" not in os.environ:
    os.environ["REDIS_URL"] = "redis://localhost:6379/0"

# Важно: импорты приложения идут ПОСЛЕ настройки env
from httpx import ASGITransport, AsyncClient

from app.core.redis import redis_client
from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Создаем единый Event Loop на всю тестовую сессию.

    Это решает проблему 'Event loop is closed' для глобальных клиентов
    (Redis, Asyncpg), которые переживают отдельные тесты.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Асинхронный клиент для тестирования FastAPI-эндпоинтов."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture(autouse=True)
async def clear_redis() -> AsyncGenerator[None, None]:
    """Очищаем Redis перед каждым тестом, чтобы Rate Limit не блокировал нас."""
    await redis_client.flushdb()
    yield
    await redis_client.flushdb()
