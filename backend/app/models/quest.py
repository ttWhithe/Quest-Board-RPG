from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import QuestRank, QuestRarity, QuestRecurrence, QuestStatus

if TYPE_CHECKING:
    from app.models.user import User


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    rank: Mapped[QuestRank] = mapped_column(Enum(QuestRank, name="quest_rank"), nullable=False)
    rarity: Mapped[QuestRarity] = mapped_column(
        Enum(QuestRarity, name="quest_rarity"), nullable=False
    )

    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[QuestStatus] = mapped_column(
        Enum(QuestStatus, name="quest_status"),
        default=QuestStatus.active,
        server_default="active",
    )
    recurrence: Mapped[QuestRecurrence] = mapped_column(
        Enum(QuestRecurrence, name="quest_recurrence"),
        default=QuestRecurrence.none,
        server_default="none",
    )

    last_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completion_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    xp_awarded_total: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped[User] = relationship(back_populates="quests")

    # Indexes (Spec §6.4)
    __table_args__ = (
        Index("ix_quests_user_id_status", "user_id", "status"),
        Index("ix_quests_user_id_deadline", "user_id", "deadline"),
    )
