from app.core.talents import (
    TALENTS,
    available_talent_points,
    can_upgrade,
    total_xp_bonus_percent,
)


def test_talent_catalog_keys() -> None:
    assert "guild_apprentice" in TALENTS
    assert "arcane_focus" in TALENTS
    assert "heroic_spirit" in TALENTS


def test_available_talent_points_level_1() -> None:
    assert available_talent_points(1, 0) == 0


def test_available_talent_points_level_3() -> None:
    assert available_talent_points(3, 0) == 2
    assert available_talent_points(3, 1) == 1
    assert available_talent_points(3, 2) == 0
    assert available_talent_points(3, 5) == 0


def test_total_xp_bonus_percent_empty() -> None:
    assert total_xp_bonus_percent({}) == 0


def test_total_xp_bonus_percent_single() -> None:
    assert total_xp_bonus_percent({"guild_apprentice": 3}) == 6


def test_total_xp_bonus_percent_multiple() -> None:
    ranks = {"guild_apprentice": 3, "arcane_focus": 2, "heroic_spirit": 1}
    # 3*2 + 2*3 + 1*10 = 6 + 6 + 10 = 22
    assert total_xp_bonus_percent(ranks) == 22


def test_total_xp_bonus_percent_capped() -> None:
    # Guild apprentice max rank is 5
    assert total_xp_bonus_percent({"guild_apprentice": 10}) == 10


def test_can_upgrade_unknown_talent() -> None:
    assert can_upgrade("unknown_talent", {}, 5) is False


def test_can_upgrade_no_points() -> None:
    assert can_upgrade("guild_apprentice", {}, 0) is False


def test_can_upgrade_max_rank() -> None:
    assert can_upgrade("guild_apprentice", {"guild_apprentice": 5}, 5) is False


def test_can_upgrade_missing_prereq() -> None:
    assert can_upgrade("arcane_focus", {"guild_apprentice": 2}, 5) is False


def test_can_upgrade_success() -> None:
    assert can_upgrade("guild_apprentice", {}, 1) is True
    assert can_upgrade("arcane_focus", {"guild_apprentice": 3}, 1) is True
    assert can_upgrade("heroic_spirit", {"guild_apprentice": 3, "arcane_focus": 2}, 1) is True
