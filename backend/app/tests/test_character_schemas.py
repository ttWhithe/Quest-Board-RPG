"""Unit tests for character schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.character import CharacterUpdate


def test_character_update_valid() -> None:
    """Валидные данные проходят."""
    payload = CharacterUpdate(nickname="Arthas", timezone="Europe/Moscow", emblem_seed="dragon-42")
    assert payload.nickname == "Arthas"
    assert payload.timezone == "Europe/Moscow"


def test_character_update_nickname_invalid() -> None:
    """Никнейм слишком короткий или с недопустимыми символами."""
    # Слишком короткий
    with pytest.raises(ValidationError) as exc_info:
        CharacterUpdate(nickname="A")
    assert "INVALID_NICKNAME" in str(exc_info.value)

    # Недопустимые символы (знак @)
    with pytest.raises(ValidationError) as exc_info:
        CharacterUpdate(nickname="@rthas")
    assert "INVALID_NICKNAME" in str(exc_info.value)


def test_character_update_timezone_invalid() -> None:
    """Несуществующая таймзона."""
    with pytest.raises(ValidationError) as exc_info:
        CharacterUpdate(timezone="Mars/Olympus")
    assert "INVALID_TIMEZONE" in str(exc_info.value)
