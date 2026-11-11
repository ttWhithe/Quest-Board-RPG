import json
from pathlib import Path

DATA_DIR = Path(__file__).parent


def load_json(filename: str) -> dict:
    """Читает JSON из app/data/ (utf-8)."""
    return json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))
