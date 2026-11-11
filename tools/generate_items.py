import json
import random

types = ["weapon", "armor", "jewelry"]
slots = ["main_hand", "head", "chest", "ring", "amulet"]
rarities = ["common", "uncommon", "rare", "epic", "legendary"]

items = []
for i in range(1, 101):
    item_id = f"item_{i:03d}"
    t = types[i % 3]
    r = rarities[i % 5]
    s = slots[i % 5]

    items.append({
        "id": item_id,
        "name": f"Предмет {i}",
        "type": t,
        "slot": s,
        "rarity": r,
        "icon_path": f"/items/{item_id}.png",
        "stats": { "strength": random.randint(1, 10) }
    })

with open("backend/app/data/items.json", "w", encoding="utf-8") as f:
    json.dump({"items": items}, f, ensure_ascii=False, indent=2)
