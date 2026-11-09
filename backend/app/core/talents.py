from dataclasses import dataclass


@dataclass(frozen=True)
class TalentDef:
    code: str
    title: str
    max_rank: int
    xp_bonus_per_rank: int
    requires: dict[str, int]


TALENTS: dict[str, TalentDef] = {
    "guild_apprentice": TalentDef(
        code="guild_apprentice",
        title="Ученик гильдии",
        max_rank=5,
        xp_bonus_per_rank=2,
        requires={},
    ),
    "arcane_focus": TalentDef(
        code="arcane_focus",
        title="Магический фокус",
        max_rank=3,
        xp_bonus_per_rank=3,
        requires={"guild_apprentice": 3},
    ),
    "heroic_spirit": TalentDef(
        code="heroic_spirit",
        title="Дух героя",
        max_rank=1,
        xp_bonus_per_rank=10,
        requires={"arcane_focus": 2},
    ),
}


def available_talent_points(level: int, spent_ranks: int) -> int:
    """Calculate unspent talent points based on character level and spent points."""
    total_points = max(0, level - 1)
    return max(0, total_points - spent_ranks)


def total_xp_bonus_percent(ranks_by_code: dict[str, int]) -> int:
    """Calculate total XP bonus percentage from learned talents."""
    total = 0
    for code, rank in ranks_by_code.items():
        talent = TALENTS.get(code)
        if talent and rank > 0:
            total += talent.xp_bonus_per_rank * min(rank, talent.max_rank)
    return total


def can_upgrade(talent_code: str, current_ranks: dict[str, int], available_points: int) -> bool:
    """Check if a talent can be upgraded to the next rank."""
    talent = TALENTS.get(talent_code)
    if not talent:
        return False

    if available_points <= 0:
        return False

    current_rank = current_ranks.get(talent_code, 0)
    if current_rank >= talent.max_rank:
        return False

    for req_code, req_rank in talent.requires.items():
        if current_ranks.get(req_code, 0) < req_rank:
            return False

    return True
