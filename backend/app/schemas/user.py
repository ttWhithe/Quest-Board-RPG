"""User-related Pydantic schemas."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AfterValidator, BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

# RFC-5322-basic — not full RFC, sufficient for MVP.
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Latin + Russian Cyrillic letters, digits, space, hyphen, underscore (spec §7.1).
_NICKNAME_PATTERN = re.compile(r"^[A-Za-zА-Яа-яЁё0-9 _\-]+$")

EMAIL_MAX_LEN = 254
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_BYTES = 72  # bcrypt limit in UTF-8 bytes, not chars


def _normalize_email(value: str) -> str:
    normalized = value.strip().lower()
    if len(normalized) > EMAIL_MAX_LEN:
        raise PydanticCustomError(
            "VALIDATION_ERROR",
            f"Email must be at most {EMAIL_MAX_LEN} characters",
        )
    if not _EMAIL_PATTERN.match(normalized):
        raise PydanticCustomError("VALIDATION_ERROR", "Invalid email format")
    return normalized


NormalizedEmail = Annotated[str, AfterValidator(_normalize_email)]


class UserBase(BaseModel):
    """Common identity fields (create-time validators live here)."""

    email: NormalizedEmail
    nickname: str
    timezone: str = "UTC"

    @field_validator("nickname")
    @classmethod
    def _validate_nickname(cls, value: str) -> str:
        value = value.strip()
        if not (2 <= len(value) <= 32):
            raise PydanticCustomError(
                "INVALID_NICKNAME",
                "Nickname must be 2–32 characters",
            )
        if not _NICKNAME_PATTERN.match(value):
            raise PydanticCustomError(
                "INVALID_NICKNAME",
                "Nickname may contain only letters, digits, space, '-' and '_'",
            )
        return value

    @field_validator("timezone")
    @classmethod
    def _validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise PydanticCustomError(
                "INVALID_TIMEZONE",
                f"Unknown timezone: {value!r}",
            ) from exc
        return value


class UserCreate(UserBase):
    """Payload for POST /auth/register."""

    password: str

    @field_validator("password")
    @classmethod
    def _validate_password(cls, value: str) -> str:
        if len(value) < PASSWORD_MIN_LENGTH:
            raise PydanticCustomError(
                "PASSWORD_TOO_SHORT",
                f"Password must be at least {PASSWORD_MIN_LENGTH} characters",
            )
        if len(value.encode("utf-8")) > PASSWORD_MAX_BYTES:
            raise PydanticCustomError(
                "PASSWORD_TOO_LONG",
                f"Password must be at most {PASSWORD_MAX_BYTES} bytes (UTF-8)",
            )
        return value


class UserOut(BaseModel):
    """Public user view — never exposes password_hash. `email` is null for demo users."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str | None
    nickname: str
    emblem_seed: str
    timezone: str
    total_xp: int
    is_demo: bool
    created_at: datetime
