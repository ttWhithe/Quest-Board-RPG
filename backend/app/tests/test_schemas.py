"""Tests for Pydantic schemas and validators."""

import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate


def test_user_create_valid() -> None:
    user = UserCreate(
        email="  Hero@Example.com  ",
        password="s3cret_password",
        nickname="Arthas",
        timezone="Europe/Moscow",
    )
    # Email normalization
    assert user.email == "hero@example.com"
    assert user.nickname == "Arthas"


def test_user_create_password_too_short() -> None:
    with pytest.raises(ValidationError) as exc:
        UserCreate(email="a@b.c", password="short", nickname="Arthas")
    assert exc.value.errors()[0]["type"] == "PASSWORD_TOO_SHORT"


def test_user_create_password_too_long() -> None:
    # 73 bytes UTF-8 (e.g., Cyrillic chars might take 2 bytes)
    long_password = "a" * 73
    with pytest.raises(ValidationError) as exc:
        UserCreate(email="a@b.c", password=long_password, nickname="Arthas")
    assert exc.value.errors()[0]["type"] == "PASSWORD_TOO_LONG"


def test_user_create_invalid_nickname() -> None:
    with pytest.raises(ValidationError) as exc:
        # Invalid char '!'
        UserCreate(email="a@b.c", password="s3cret!", nickname="Arthas!")
    assert exc.value.errors()[0]["type"] == "INVALID_NICKNAME"


def test_user_create_invalid_timezone() -> None:
    with pytest.raises(ValidationError) as exc:
        UserCreate(
            email="a@b.c", password="s3cret!", nickname="Arthas", timezone="Mars/OlympusMons"
        )
    assert exc.value.errors()[0]["type"] == "INVALID_TIMEZONE"


def test_user_create_invalid_email() -> None:
    with pytest.raises(ValidationError) as exc:
        UserCreate(email="not-an-email", password="s3cret!", nickname="Arthas")
    assert exc.value.errors()[0]["type"] == "VALIDATION_ERROR"
