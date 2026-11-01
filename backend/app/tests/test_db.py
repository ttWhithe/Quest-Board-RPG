import pytest
from sqlalchemy import text

from app.db import SessionLocal


@pytest.mark.asyncio
async def test_database_connection() -> None:
    """Проверяем, что сессия открывается и БД отвечает."""
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT 1"))
        assert result.scalar() == 1
