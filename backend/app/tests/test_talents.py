from app.core.talents import (
    TALENTS,
    available_talent_points,
    can_upgrade,
    get_total_bonus_percent,
)


def test_talent_catalog_keys() -> None:
    assert "start" in TALENTS
    assert "xp_small_1" in TALENTS
    assert "xp_notable_1" in TALENTS


def test_available_talent_points_level_1() -> None:
    assert available_talent_points(1, 0) == 0


def test_available_talent_points_level_3() -> None:
    assert available_talent_points(3, 0) == 2
    assert available_talent_points(3, 1) == 1
    assert available_talent_points(3, 2) == 0
    assert available_talent_points(3, 5) == 0


def test_total_xp_bonus_percent_empty() -> None:
    assert get_total_bonus_percent({}) == 0


def test_total_xp_bonus_percent_single() -> None:
    # xp_small_1 дает +2% к опыту за ранг
    assert get_total_bonus_percent({"xp_small_1": 3}) == 6


def test_total_xp_bonus_percent_capped() -> None:
    # Функция просто умножает, ограничение max_rank контролируется в API
    assert get_total_bonus_percent({"xp_small_1": 5}) == 10


def test_can_upgrade_unknown_talent() -> None:
    assert can_upgrade("unknown_talent", {}, 5) is False


def test_can_upgrade_no_points() -> None:
    assert can_upgrade("xp_small_1", {}, 0) is False


def test_can_upgrade_start_node() -> None:
    assert can_upgrade("start", {}, 5) is False


def test_can_upgrade_max_rank() -> None:
    # max_rank для xp_small_1 равен 3
    assert can_upgrade("xp_small_1", {"xp_small_1": 3}, 5) is False


def test_can_upgrade_missing_prereq() -> None:
    # xp_small_2 соединен с xp_small_1, который не прокачан
    assert can_upgrade("xp_small_2", {}, 5) is False


def test_can_upgrade_success() -> None:
    # xp_small_1 соединен со start, start всегда считается прокачанным
    assert can_upgrade("xp_small_1", {}, 1) is True
    # xp_small_2 соединен с прокачанным xp_small_1
    assert can_upgrade("xp_small_2", {"xp_small_1": 1}, 1) is True
