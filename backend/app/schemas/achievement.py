"""Achievement schemas.

`AchievementDef` — внутренняя (валидирует JSON, содержит условие).
`AchievementOut` — публичный ответ (без `condition`, содержит `progress`).
`NewAchievementEvent` — то, что движок возвращает в `new_achievements`.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ConditionType = Literal[
    "quest_count",
    "quest_count_per_rank",
    "quest_failed",
    "quests_created_today",
    "time_of_day",
    "specific_date",
    "event_flag",
    "talents_total",
    "talents_notable",
    "talents_branch_complete",
    "talents_branch_count",
    "login_streak",
    "daily_reward",
    "return_after_gap",
    "inventory_count",
    "equipped_count",
    "equipped_slots",
    "item_pinned",
    "enhancement",
    "rarity_upgrade",
    "events_created",
    "profile_change",
    "level_reached",
    "xp_total",
    "demo_login",
    "manual",
]


class AchievementCondition(BaseModel):
    type: ConditionType
    params: dict[str, Any] = Field(default_factory=dict)


class AchievementDef(BaseModel):
    """Определение из achievements.json. Используется движком."""

    id: str
    name: str
    description: str
    icon: str
    rarity: str
    reward: dict[str, Any]
    condition: AchievementCondition


class AchievementProgress(BaseModel):
    current: int
    target: int


class AchievementOut(BaseModel):
    """Ответ GET /achievements. Без внутренней `condition`."""

    id: str
    name: str
    description: str
    icon: str
    rarity: str
    reward: dict[str, Any]
    unlocked: bool
    unlocked_at: datetime | None = None
    progress: AchievementProgress | None = None


class NewAchievementEvent(BaseModel):
    """Одно только что разблокированное достижение (для тостов на фронте)."""

    code: str
    name: str
    description: str
    icon: str
    rarity: str
    reward: dict[str, Any]
