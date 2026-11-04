from __future__ import annotations

import datetime  # <--- Импортируем модуль, чтобы избежать конфликта имен
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import EventKind


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    date: datetime.date
    kind: EventKind
    repeats_yearly: bool = False

    @field_validator("title")
    @classmethod
    def _strip_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        return v


class EventUpdate(BaseModel):
    """Все поля опциональны; применяется только то, что пришло в теле."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    date: datetime.date | None = None
    kind: EventKind | None = None
    repeats_yearly: bool | None = None

    @field_validator("title")
    @classmethod
    def _strip_title(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        return v


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    date: datetime.date
    kind: EventKind
    repeats_yearly: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime
