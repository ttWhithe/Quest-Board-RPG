from dataclasses import dataclass
from typing import Any

from app.data import load_json


@dataclass(frozen=True)
class TalentNode:
    id: str
    name: str
    description: str
    type: str
    x: int
    y: int
    max_rank: int
    effects: list[dict[str, Any]]
    rank: int = 0
    can_upgrade: bool = False


# Загружаем JSON при старте
_TREE_DATA = load_json("talent_tree.json")

# Создаем словарь узлов для быстрого доступа
TALENTS: dict[str, TalentNode] = {
    node["id"]: TalentNode(
        id=node["id"],
        name=node["name"],
        description=node["description"],
        type=node["type"],
        x=node["x"],
        y=node["y"],
        max_rank=node["max_rank"],
        effects=node.get("effects", []),
    )
    for node in _TREE_DATA["nodes"]
}

# Создаем граф смежности
_EDGES = _TREE_DATA["edges"]
_NEIGHBORS: dict[str, list[str]] = {t_id: [] for t_id in TALENTS}
for edge in _EDGES:
    u, v = edge
    if u in _NEIGHBORS and v in _NEIGHBORS:
        _NEIGHBORS[u].append(v)
        _NEIGHBORS[v].append(u)


def available_talent_points(level: int, spent_ranks: int) -> int:
    total_points = max(0, level - 1)
    return max(0, total_points - spent_ranks)


def can_upgrade(talent_code: str, current_ranks: dict[str, int], available_points: int) -> bool:
    """Проверяет, можно ли прокачать узел."""
    if talent_code not in TALENTS:
        return False
    if talent_code == "skyrim_start":
        return False

    node = TALENTS[talent_code]
    current_rank = current_ranks.get(talent_code, 0)

    if available_points <= 0 or current_rank >= node.max_rank:
        return False

    # Проверка связей: хотя бы один сосед должен быть прокачан
    for neighbor_id in _NEIGHBORS[talent_code]:
        if neighbor_id == "skyrim_start":
            return True
        if current_ranks.get(neighbor_id, 0) > 0:
            return True

    return False


def get_total_bonus_percent(ranks_by_code: dict[str, int]) -> int:
    """
    Считает суммарный бонус к XP.
    Ищет эффекты со stat="xp_percent" и суммирует кумулятивные значения.
    """
    total = 0
    for code, rank in ranks_by_code.items():
        node = TALENTS.get(code)
        if not node or rank <= 0:
            continue

        for effect in node.effects:
            if effect.get("stat") == "xp_percent":
                values = effect.get("values", [])
                # Берем значения до текущего ранга включительно и суммируем
                # Например, если rank=2, а values=[2,3,4], берем [2,3] -> сумма 5
                total += sum(values[:rank])
    return total
