import json
from pathlib import Path
from typing import Any, cast

DATA_DIR = Path(__file__).parent


def load_json(filename: str) -> dict[str, Any]:
    """Читает JSON из app/data/ (utf-8)."""
    content = (DATA_DIR / filename).read_text(encoding="utf-8")
    return cast(dict[str, Any], json.loads(content))
