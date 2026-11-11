from app.core.talents import (
    TALENTS,
    available_talent_points,
    can_upgrade,
    get_total_bonus_percent,
)


def test_talent_catalog_keys() -> None:
    assert "skyrim_start" in TALENTS
    assert "illusion_root" in TALENTS
    assert "illusion_1" in TALENTS
    assert "xp_1" in TALENTS


def test_available_talent_points_level_1() -> None:
    assert available_talent_points(1, 0) == 0


def test_available_talent_points_level_3() -> None:
    assert available_talent_points(3, 0) == 2
    assert available_talent_points(3, 1) == 1
    assert available_talent_points(3, 2) == 0
    assert available_talent_points(3, 5) == 0


def test_total_xp_bonus_percent_empty() -> None:
    assert get_total_bonus_percent({}) == 0


def test_total_xp_bonus_percent_unknown() -> None:
    assert get_total_bonus_percent({"unknown": 5}) == 0


def test_total_xp_bonus_percent_no_effects() -> None:
    # У illusion_root и skyrim_start нет эффектов (effects: [])
    assert get_total_bonus_percent({"illusion_root": 1, "skyrim_start": 1}) == 0


def test_total_xp_bonus_percent_linear() -> None:
    # xp_1 (Жажда знаний): values = [2, 2, 2]
    assert get_total_bonus_percent({"xp_1": 1}) == 2
    assert get_total_bonus_percent({"xp_1": 2}) == 4
    assert get_total_bonus_percent({"xp_1": 3}) == 6
    # Если ранг передан больше max_rank, sum просто сложит все, что есть
    assert get_total_bonus_percent({"xp_1": 4}) == 6


def test_total_xp_bonus_percent_multiple_nodes() -> None:
    # xp_1 (+2%) + xp_2 (+3%) + xp_3 (+2%)
    ranks = {"xp_1": 1, "xp_2": 1, "xp_3": 1}
    assert get_total_bonus_percent(ranks) == 7


def test_total_xp_bonus_percent_non_xp_effects() -> None:
    # str_1 дает strength_percent, а не xp_percent, поэтому бонус к опыту = 0
    assert get_total_bonus_percent({"str_1": 3}) == 0


def test_can_upgrade_unknown_talent() -> None:
    assert can_upgrade("unknown_talent", {}, 5) is False


def test_can_upgrade_no_points() -> None:
    assert can_upgrade("illusion_root", {}, 0) is False


def test_can_upgrade_start_node() -> None:
    assert can_upgrade("skyrim_start", {}, 5) is False


def test_can_upgrade_max_rank() -> None:
    # illusion_root имеет max_rank=1, уже прокачан -> нельзя
    assert can_upgrade("illusion_root", {"illusion_root": 1}, 5) is False


def test_can_upgrade_missing_prereq() -> None:
    # illusion_1 требует illusion_root (rank=0) -> нельзя
    assert can_upgrade("illusion_1", {}, 5) is False


def test_can_upgrade_root_from_start() -> None:
    # illusion_root связан с skyrim_start -> можно
    assert can_upgrade("illusion_root", {}, 1) is True


def test_can_upgrade_success() -> None:
    # illusion_1 требует прокачанный illusion_root
    assert can_upgrade("illusion_1", {"illusion_root": 1}, 1) is True
