from pydantic import BaseModel


class TalentOut(BaseModel):
    code: str
    title: str
    rank: int
    max_rank: int
    xp_bonus_per_rank: int
    requires: dict[str, int]
    can_upgrade: bool


class TalentListResponse(BaseModel):
    available_points: int
    total_spent_points: int
    talents: list[TalentOut]


class TalentUpgradeResponse(BaseModel):
    available_points: int
    talent: TalentOut
