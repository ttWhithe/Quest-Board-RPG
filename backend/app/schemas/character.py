"""Character schemas (spec.md §7.6)."""

from __future__ import annotations

import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

from app.schemas.user import UserOut

# Те же правила для ника, что и при регистрации (§7.1)
_NICKNAME_PATTERN = re.compile(r"^[A-Za-zА-Яа-яЁё0-9 _\-]+$")


class CharacterStats(BaseModel):
    """Определения stats строго по §7.6."""

    completed_total: int
    failed_total: int
    by_rank: dict[str, int]


class CharacterOut(BaseModel):
    """Ответ GET /character."""

    user: UserOut
    level: int
    xp_into_level: int
    xp_for_next_level: int
    xp_bonus_percent: int
    stats: CharacterStats


class CharacterUpdate(BaseModel):
    """Тело PATCH /character. Whitelist: nickname, emblem_seed, timezone."""

    model_config = ConfigDict(extra="forbid")

    nickname: str | None = None
    emblem_seed: str | None = None
    timezone: str | None = None

    @field_validator("nickname")
    @classmethod
    def _validate_nickname(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not (2 <= len(value) <= 32):
            raise PydanticCustomError("INVALID_NICKNAME", "Nickname must be 2–32 characters")
        if not _NICKNAME_PATTERN.match(value):
            raise PydanticCustomError(
                "INVALID_NICKNAME",
                "Nickname may contain only letters, digits, space, '-' and '_'",
            )
        return value

    @field_validator("timezone")
    @classmethod
    def _validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise PydanticCustomError("INVALID_TIMEZONE", f"Unknown timezone: {value!r}") from exc
        return value


class CharacterStatsResponse(BaseModel):
    """Ответ GET /character/stats."""

    stats: dict[str, float]


class InventoryItem(BaseModel):
    """Модель предмета в инвентаре."""

    id: str
    name: str
    type: str
    slot: str
    rarity: str
    icon_path: str
    stats: dict[str, int]
    is_pinned: bool = False
    equipped_slot: str | None = None


class InventoryItemUpdate(BaseModel):
    """Тело PATCH /character/inventory/{item_code}."""

    model_config = ConfigDict(extra="forbid")

    is_pinned: bool | None = None
    equipped_slot: str | None = None


class InventoryResponse(BaseModel):
    """Ответ GET /character/inventory."""

    items: list[InventoryItem]
    total: int
