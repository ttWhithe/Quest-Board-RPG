"""Achievement schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AchievementOut(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    rarity: str
    reward: dict[str, Any]
    unlocked: bool
    unlocked_at: datetime | None = None
