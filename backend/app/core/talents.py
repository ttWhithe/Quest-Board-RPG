import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class TalentNode:
    id: str
    name: str
    description: str
    type: str
    x: int
    y: int
    max_rank: int
    rank: int = 0  # Текущий уровень (заполняется из БД)
    can_upgrade: bool = False


# Загружаем JSON при старте
_TREE_PATH = Path(__file__).parent / "talent_tree.json"
with open(_TREE_PATH, encoding="utf-8") as f:
    _TREE_DATA = json.load(f)

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
    )
    for node in _TREE_DATA["nodes"]
}

# Создаем граф смежности (кто с кем соединен)
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
    """Проверяет, можно ли прокачать узел. Логика PoE:
    - Нельзя прокачивать 'start'.
    - Должны быть свободные очки.
    - Должен быть прокачан хотя бы один соседний узел (или это сосед 'start').
    """
    if talent_code not in TALENTS:
        return False
    if talent_code == "start":
        return False

    node = TALENTS[talent_code]
    current_rank = current_ranks.get(talent_code, 0)

    if available_points <= 0 or current_rank >= node.max_rank:
        return False

    # Проверка связей: хотя бы один сосед должен быть прокачан
    for neighbor_id in _NEIGHBORS[talent_code]:
        if neighbor_id == "start":
            return True  # 'start' всегда считается прокачанным
        if current_ranks.get(neighbor_id, 0) > 0:
            return True

    return False


def get_total_bonus_percent(ranks_by_code: dict[str, int]) -> int:
    """Считает суммарный бонус к XP.
    Для MVP суммируем все узлы, где в описании есть "% к" и "опыт".
    В будущем тут будет парсинг эффектов или словарь модификаторов.
    """
    total = 0
    for code, rank in ranks_by_code.items():
        node = TALENTS.get(code)
        if node and rank > 0:
            # Упрощенная логика для MVP: если в описании есть "% к" и "опыт", берем первое число
            # (В идеале нужно сделать нормальный парсинг модификаторов)
            desc = node.description.lower()
            if "опыт" in desc or "xp" in desc:
                # Вытаскиваем первое число из строки (например, из "+2% к получаемому опыту")
                import re

                match = re.search(r"\+(\d+)%", desc)
                if match:
                    total += int(match.group(1)) * rank
    return total
