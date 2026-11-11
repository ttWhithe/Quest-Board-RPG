import json
import re
import math
from pathlib import Path

JSON_PATH = Path("backend/app/core/talent_tree.json")
SVG_DIR = Path("frontend/public/talents")

RADIUS = 1300      # Увеличили до 1300, чтобы ветки разошлись
TARGET_SPAN = 350  # Оставили 350

BRANCH_NAMES = [
    "Illusion", "Conjuration", "Destruction", "Restoration", "Alteration", "Enchanting",
    "Smithing", "Heavy Armor", "Block", "Two-Handed", "One-Handed", "Archery",
    "Light Armor", "Sneak", "Lockpicking", "Pickpocket", "Speech", "Alchemy"
]

def parse_svg(file_path):
    svg_text = Path(file_path).read_text(encoding="utf-8")
    circles = re.findall(r'<circle id="circle-([A-Z])" cx="(\d+)" cy="(\d+)"', svg_text)
    dots = {label: (int(cx), int(cy)) for label, cx, cy in circles}
    lines = re.findall(r'<line id="line-([A-Z])-([A-Z])"', svg_text)
    return dots, lines

def main():
    data = {
        "nodes": [
            {"id": "skyrim_start", "name": "Созвездие", "description": "Древние знания Скайрима.", "type": "start", "x": 0, "y": 0, "max_rank": 1}
        ],
        "edges": []
    }

    for i, branch_name in enumerate(BRANCH_NAMES):
        file_path = SVG_DIR / f"{branch_name}.svg"
        if not file_path.exists():
            print(f"Пропуск {branch_name}")
            continue

        dots, lines = parse_svg(file_path)
        if not dots: continue

        angle = -90 + i * 20
        angle_rad = math.radians(angle)
        rot_angle = math.radians(angle + 90)
        prefix = branch_name.lower().replace(" ", "_").replace("-", "_")

        letter_to_id = {}
        id_to_letter = {}
        for j, letter in enumerate(sorted(dots.keys())):
            node_id = f"{prefix}_root" if j == 0 else f"{prefix}_{j}"
            letter_to_id[letter] = node_id
            id_to_letter[node_id] = letter

        root_x, root_y = dots['A']
        max_r = max(math.hypot(old_x - root_x, old_y - root_y) for old_x, old_y in dots.values())
        local_scale = TARGET_SPAN / max_r if max_r > 0 else 1.0

        base_x = RADIUS * math.cos(angle_rad)
        base_y = RADIUS * math.sin(angle_rad)

        for letter, (old_x, old_y) in dots.items():
            node_id = letter_to_id[letter]
            dx = (old_x - root_x) * local_scale
            dy = (old_y - root_y) * local_scale
            rot_x = dx * math.cos(rot_angle) - dy * math.sin(rot_angle)
            rot_y = dx * math.sin(rot_angle) + dy * math.cos(rot_angle)

            data["nodes"].append({
                "id": node_id,
                "name": f"Талант {branch_name} {letter}",
                "description": "Описание таланта...",
                "type": "small",
                "x": round(base_x + rot_x),
                "y": round(base_y + rot_y),
                "max_rank": 1
            })

        data["edges"].append(["skyrim_start", f"{prefix}_root"])

        undirected = {n_id: [] for n_id in letter_to_id.values()}
        svg_edges = []
        for l1, l2 in lines:
            id1, id2 = letter_to_id[l1], letter_to_id[l2]
            undirected[id1].append(id2)
            undirected[id2].append(id1)
            svg_edges.append((id1, id2))

        depth = {f"{prefix}_root": 0}
        q = [f"{prefix}_root"]
        while q:
            curr = q.pop(0)
            for n in undirected[curr]:
                if n not in depth:
                    depth[n] = depth[curr] + 1
                    q.append(n)

        for id1, id2 in svg_edges:
            if depth[id1] < depth[id2]:
                data["edges"].append([id1, id2])
            elif depth[id2] < depth[id1]:
                data["edges"].append([id2, id1])
            else:
                l1, l2 = id_to_letter[id1], id_to_letter[id2]
                dist1 = (dots[l1][0] - root_x)**2 + (dots[l1][1] - root_y)**2
                dist2 = (dots[l2][0] - root_x)**2 + (dots[l2][1] - root_y)**2
                if dist1 < dist2:
                    data["edges"].append([id1, id2])
                else:
                    data["edges"].append([id2, id1])

    JSON_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✓ Дерево пересобрано! Узлов: {len(data['nodes'])}, веток: {len(BRANCH_NAMES)}")

if __name__ == "__main__":
    main()
