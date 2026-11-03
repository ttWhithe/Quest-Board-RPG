"""Pydantic-схемы квестов (spec.md §6.2, §7.2–§7.7).

Типы-псевдонимы используют `Literal`, а не модели/enums — чтобы модуль
схем не зависел от `models.enums` (циклические импорты в FastAPI-слоях —
частая боль). На уровне эндпоинтов str-Enum (`Rank.S`) коэрсится в `"S"`
при построении ответа, а Pydantic при валидации тела принимает и `"S"`.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Псевдонимы типов (совпадают с enum-значениями моделей)
# ---------------------------------------------------------------------------

QuestRank = Literal["S", "A", "B", "C", "D", "E", "F"]
QuestRarity = Literal["common", "uncommon", "rare", "epic", "legendary"]
QuestStatus = Literal["active", "completed", "archived"]
EffectiveStatus = Literal["active", "completed", "failed", "archived"]
Recurrence = Literal["none", "daily", "weekly"]

# §7.2: сортировки.
QuestSort = Literal[
    "deadline_asc",
    "deadline_desc",
    "created_desc",
    "created_asc",
    "rank_desc",
    "rank_asc",
    "rarity_desc",
    "rarity_asc",
]

# §7.2: фильтр по effective_status (включая 'failed', которого нет в БД).
QuestStatusFilter = Literal["active", "completed", "failed", "archived"]


# ---------------------------------------------------------------------------
# Утилиты
# ---------------------------------------------------------------------------


def _to_aware_utc(dt: datetime | None) -> datetime | None:
    """Naive datetime из фронта трактуем как UTC, чтобы БД (timestamptz)
    не сделала это за нас в неизвестной сессии."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


# ---------------------------------------------------------------------------
# Входные схемы
# ---------------------------------------------------------------------------


class QuestCreate(BaseModel):
    """Тело POST /quests (§7.7)."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    rank: QuestRank
    rarity: QuestRarity
    deadline: datetime | None = None
    recurrence: Recurrence = "none"

    @field_validator("deadline")
    @classmethod
    def _normalize_deadline(cls, v: datetime | None) -> datetime | None:
        return _to_aware_utc(v)


class QuestUpdate(BaseModel):
    """Тело PATCH /quests/{id} — whitelist полей (§7.3).

    Проверка IMMUTABLE_AFTER_COMPLETION — **в эндпоинте**, не здесь
    (схема не знает состояния `completion_count` в БД).

    `extra='forbid'` отсекает любые «лишние» поля, включая `status`,
    `user_id`, `last_completed_at` и т.п. — это одновременно и валидация,
    и защита от случайного расширения контракта.
    """

    model_config = ConfigDict(extra="forbid")

    # Поля БД NOT NULL — null принимаем только как «не задано»
    # (проверка ниже через model_fields_set).
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    rank: QuestRank | None = None
    rarity: QuestRarity | None = None
    deadline: datetime | None = None
    recurrence: Recurrence | None = None

    @field_validator("deadline")
    @classmethod
    def _normalize_deadline(cls, v: datetime | None) -> datetime | None:
        return _to_aware_utc(v)

    @model_validator(mode="after")
    def _reject_null_for_not_null(self) -> QuestUpdate:
        # Отличаем «поле не передано» (его нет в model_fields_set) от
        # «передано как null» (есть в set и равно None).
        # Для NOT NULL-колонок явный null — ошибка 422 VALIDATION_ERROR.
        for name in ("title", "rank", "rarity", "recurrence"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} cannot be null")
        return self


# ---------------------------------------------------------------------------
# Выходные схемы
# ---------------------------------------------------------------------------


class QuestRead(BaseModel):
    """Полное представление квеста в ответах API (§7.7).

    `effective_status` — вычисляется эндпоинтом через `core.game.effective_status`
    и передаётся явно (поэтому `from_attributes` здесь не включаем —
    атрибута нет на модели).
    """

    id: UUID
    user_id: UUID
    title: str
    description: str | None
    rank: QuestRank
    rarity: QuestRarity
    deadline: datetime | None
    status: QuestStatus
    effective_status: EffectiveStatus
    recurrence: Recurrence
    last_completed_at: datetime | None
    completion_count: int
    xp_awarded_total: int
    created_at: datetime
    updated_at: datetime


class QuestListResponse(BaseModel):
    """Ответ GET /quests с пагинацией (§7.2)."""

    items: list[QuestRead]
    total: int
    limit: int
    offset: int


# ----- /complete -----


class QuestCompleteQuest(BaseModel):
    """Минимальный снимок квеста в ответе на complete (§7.7)."""

    id: UUID
    status: QuestStatus
    effective_status: EffectiveStatus
    completion_count: int
    xp_awarded_total: int
    last_completed_at: datetime | None


class UserAfterComplete(BaseModel):
    """Снимок пользователя после начисления XP (§7.7)."""

    total_xp: int
    level: int
    xp_into_level: int
    xp_for_next_level: int


class QuestCompleteResponse(BaseModel):
    """Тело успешного ответа POST /quests/{id}/complete."""

    quest: QuestCompleteQuest
    xp_awarded: int
    user_after: UserAfterComplete
