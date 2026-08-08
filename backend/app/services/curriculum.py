from pathlib import Path
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[3] / "data"
ORGANIZER_DIR = Path(__file__).resolve().parents[3] / "organizer"


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        logger.warning("Data file not found: %s", path)
        return {}
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_curriculum() -> dict[str, Any]:
    for name in ("curriculum.json", "curriculum (1).json"):
        path = DATA_DIR / name
        if not path.exists():
            path = ORGANIZER_DIR / name
        if path.exists():
            return _load_json(path)
    return {}


def load_candidates() -> list[dict[str, Any]]:
    for name in ("candidates.json",):
        path = DATA_DIR / name
        if not path.exists():
            path = ORGANIZER_DIR / name
        if path.exists():
            data = _load_json(path)
            return data.get("candidates", [])
    return []


def curriculum_modules() -> list[dict[str, Any]]:
    return load_curriculum().get("modules", [])


def curriculum_days() -> list[dict[str, Any]]:
    return load_curriculum().get("days", [])


def day_by_number(day: int) -> dict[str, Any] | None:
    for d in curriculum_days():
        if d.get("day") == day:
            return d
    return None


def module_for_day(day: int) -> str:
    for mod in curriculum_modules():
        days = mod.get("days") or []
        if isinstance(days, list) and len(days) >= 2:
            start, end = days[0], days[1]
            if start <= day <= end:
                return mod.get("title", "")
    return "General AI Engineering"
