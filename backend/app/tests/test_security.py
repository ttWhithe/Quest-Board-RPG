"""Tests for security primitives (bcrypt, JWT, emblem seed)."""

import re
from uuid import uuid4

import jwt
import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_emblem_seed,
    hash_password,
    verify_password,
)


def test_password_hashing() -> None:
    password = "s3cret_password"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_verify_password_invalid_hash() -> None:
    # Should return False instead of raising an error on malformed hash
    assert verify_password("any", "not-a-valid-bcrypt-hash") is False


def test_jwt_roundtrip() -> None:
    user_id = uuid4()
    token = create_access_token(user_id)

    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert "exp" in payload
    assert "iat" in payload


def test_jwt_invalid_token() -> None:
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("invalid.token.string")


def test_generate_emblem_seed() -> None:
    seed = generate_emblem_seed()
    # e.g. "dragon-0042"
    assert re.match(r"^[a-z]+-\d{4}$", seed)
