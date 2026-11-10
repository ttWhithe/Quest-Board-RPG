import json
import re
import math
from pathlib import Path

SVG_PATH = Path("tools/illusion.svg")
JSON_PATH = Path("backend/app/core/talent_tree.json")
OUTPUT_JSON = Path("backend/app/core/talent_tree.json")

def main():
    if not SVG_PATH.exists() or not JSON_PATH.exists():
        print(f"Ошибка: нет файлов.")
        return

    old_data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    svg_text = SVG_PATH.read_text(encoding="utf-8")

    # 1. Парсим круги из SVG
    circles = re.findall(r'<circle id="circle-([A-Z])" cx="(\d+)" cy="(\d+)"', svg_text)
    dots = {label: (int(cx), int(cy)) for label, cx, cy in circles}

    # 2. Парсим линии из SVG
    lines = re.findall(r'<line id="line-([A-Z])-([A-Z])"', svg_text)

    if not dots or not lines:
        print("Ошибка: не найдены круги или линии в SVG.")
        return

    # 3. Сопоставляем буквы A-M с ID узлов (A = root, B = _1, C = _2 и т.д.)
    letter_to_id = {}
    for i, letter in enumerate(sorted(dots.keys())):
        if i == 0:
            letter_to_id[letter] = "illusion_root"
        else:
            letter_to_id[letter] = f"illusion_{i}"

    # Берем старые названия и описания для этих 13 узлов
    old_nodes = {n['id']: n for n in old_data['nodes'] if n['id'].startswith('illusion_')}

    new_nodes = [{
        "id": "skyrim_start", "name": "Созвездие",
        "description": "Древние знания Скайрима. Секретная пасхалка.",
        "type": "start", "x": 0, "y": 0, "max_rank": 1
    }]

    new_edges = []

    # 4. Пересчет координат (ветка строго вверх)
    root_x, root_y = dots['A']
    SCALE = 1.5
    CENTER_Y_OFFSET = -250

    for letter, (old_x, old_y) in dots.items():
        node_id = letter_to_id[letter]
        orig = old_nodes.get(node_id)

        # Если в старом JSON не хватило узла (вдруг), берем заглушку
        if not orig:
            orig = {"name": f"Талант {letter}", "description": "...", "type": "small", "max_rank": 1}

        dx = (old_x - root_x) * SCALE
        dy = (old_y - root_y) * SCALE

        # В SVG Y растет вниз. Чтобы ветка росла вверх, вычитаем dy из оффсета
        new_x = dx
        new_y = CENTER_Y_OFFSET + dy

        # Переопределяем типы (F, H, M - notable, остальные small)
        if letter in ['F', 'H', 'M']:
            final_type = 'notable'
        else:
            final_type = 'small'

        new_nodes.append({
            "id": node_id,
            "name": orig['name'],
            "description": orig['description'],
            "type": final_type,  # <--- ИСПОЛЬЗУЕМ НОВЫЙ ТИП
            "x": round(new_x),
            "y": round(new_y),
            "max_rank": orig['max_rank']
        })

    # 5. Строим связи по линиям из SVG и ориентируем их от корня
    # Сначала строим неориентированный граф, чтобы найти кратчайшие расстояния
    undirected_adj = {node_id: [] for node_id in letter_to_id.values()}
    svg_edges = []
    for l1, l2 in lines:
        id1 = letter_to_id[l1]
        id2 = letter_to_id[l2]
        undirected_adj[id1].append(id2)
        undirected_adj[id2].append(id1)
        svg_edges.append((id1, id2))

    # BFS от корня для определения глубины (кто ближе к А)
    depth = {"illusion_root": 0}
    queue = ["illusion_root"]
    while queue:
        curr = queue.pop(0)
        for neighbor in undirected_adj[curr]:
            if neighbor not in depth:
                depth[neighbor] = depth[curr] + 1
                queue.append(neighbor)

    # Ориентируем ребра: от меньшей глубины к большей (от корня к листьям)
    new_edges = [["skyrim_start", "illusion_root"]]
    for id1, id2 in svg_edges:
        if depth[id1] < depth[id2]:
            new_edges.append([id1, id2])
        else:
            new_edges.append([id2, id1])

    # 6. Сохраняем только эту ветку
    OUTPUT_JSON.write_text(
        json.dumps({"nodes": new_nodes, "edges": new_edges}, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"✓ Успех! JSON содержит только старт и ветку Иллюзий.")
    print(f"  Узлов: {len(new_nodes)}, Линий: {len(new_edges)}")

if __name__ == "__main__":
    main()
