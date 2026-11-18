from pydantic import BaseModel

from app.schemas.achievement import NewAchievementEvent


class TalentOut(BaseModel):
    id: str
    name: str
    description: str
    type: str
    x: int
    y: int
    max_rank: int
    rank: int
    can_upgrade: bool


class TalentTreeOut(BaseModel):
    available_points: int
    total_spent_points: int
    nodes: list[TalentOut]
    edges: list[list[str]]


class TalentUpgradeResponse(BaseModel):
    available_points: int
    node: TalentOut
    new_achievements: list[NewAchievementEvent] = []
