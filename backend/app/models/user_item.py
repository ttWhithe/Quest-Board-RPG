"""Модель состояния предметов пользователя."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserItem(Base):
    """Хранит переопределения для предметов (закрепление, экипировка)."""

    __tablename__ = "user_items"
    __table_args__ = (UniqueConstraint("user_id", "item_code", name="uq_user_items_user_item"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    item_code: Mapped[str] = mapped_column(String(64))
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    equipped_slot: Mapped[str | None] = mapped_column(String(32), nullable=True)
    enhancement_level: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    user: Mapped[User] = relationship(back_populates="items")
