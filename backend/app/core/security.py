"""Password hashing, JWT, and emblem seed generation."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, cast
from uuid import UUID

import bcrypt
import jwt

from app.config import get_settings

ALGORITHM = "HS256"
BCRYPT_MAX_BYTES = 72

_settings = get_settings()

_EMBLEM_WORDS: tuple[str, ...] = (
    "dragon",
    "phoenix",
    "wolf",
    "raven",
    "tiger",
    "bear",
    "serpent",
    "griffin",
    "lion",
    "eagle",
    "stag",
    "owl",
    "fox",
    "boar",
    "falcon",
    "wyvern",
)


def hash_password(password: str) -> str:
    """Hash a password with bcrypt. Length (8–72 UTF-8 bytes) is enforced upstream."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time bcrypt comparison; returns False on malformed hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: UUID | str) -> str:
    """Create a signed HS256 JWT with `sub`, `iat`, `exp` (default 7 days)."""
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=_settings.jwt_expires_days)).timestamp()),
    }
    # types-PyJWT 1.7.1 (latest) still describes PyJWT 1.x behaviour (`bytes`);
    # PyJWT 2.x returns `str`. Cast documents the runtime truth.
    return cast(str, jwt.encode(payload, _settings.jwt_secret, algorithm=ALGORITHM))


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode & verify a JWT. Raises `jwt.InvalidTokenError` (and subclasses) on failure."""
    return jwt.decode(token, _settings.jwt_secret, algorithms=[ALGORITHM])


def generate_emblem_seed() -> str:
    """Short thematic seed like `dragon-0042` (fits varchar(64))."""
    word = secrets.choice(_EMBLEM_WORDS)
    number = secrets.randbelow(10_000)
    return f"{word}-{number:04d}"
