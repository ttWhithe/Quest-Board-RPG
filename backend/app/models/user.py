from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.quest import Quest
    from app.models.user_talent import UserTalent


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str | None] = mapped_column(String(254), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    nickname: Mapped[str] = mapped_column(String(32), nullable=False)
    emblem_seed: Mapped[str] = mapped_column(String(64), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", server_default="UTC")
    total_xp: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    quests: Mapped[list[Quest]] = relationship(back_populates="user", cascade="all, delete-orphan")
    events: Mapped[list[Event]] = relationship(back_populates="user", cascade="all, delete-orphan")
    talents: Mapped[list[UserTalent]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
