from datetime import date

import pytest
from pydantic import ValidationError

from app.models.enums import EventKind
from app.schemas.event import EventCreate, EventUpdate


def test_event_create_title_strip() -> None:
    """Проверяем, что пробелы по краям обрезаются."""
    event = EventCreate(
        title="  ДР Гильдмастера  ", date=date(2026, 11, 4), kind=EventKind.birthday
    )
    assert event.title == "ДР Гильдмастера"


def test_event_create_blank_title() -> None:
    """Проверяем, что пустая строка (только пробелы) вызывает ошибку."""
    with pytest.raises(ValidationError):
        EventCreate(title="   ", date=date(2026, 11, 4), kind=EventKind.holiday)


def test_event_update_title_strip() -> None:
    """Проверяем обрезку пробелов в PATCH-схеме."""
    event = EventUpdate(title="  Совет гильдии  ")
    assert event.title == "Совет гильдии"


def test_event_update_none() -> None:
    """Проверяем, что все поля опциональны и могут быть None."""
    event = EventUpdate(title=None, date=None)
    assert event.title is None
    assert event.date is None


def test_event_update_blank_title() -> None:
    """Проверяем, что пустая строка в PATCH вызывает ошибку."""
    with pytest.raises(ValidationError):
        EventUpdate(title="   ")
