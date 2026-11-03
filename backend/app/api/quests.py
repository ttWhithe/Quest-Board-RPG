"""Quest CRUD and completion endpoints (spec.md §7.2–§7.7)."""

from __future__ import annotations

from datetime import UTC, date, datetime, tzinfo
from typing import Annotated, Any
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import ColumnElement, Date, case, cast, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.game import (
    calc_xp,
    effective_status,
    is_completed_in_current_period,
    level_for_xp,
    xp_for_next_level,
    xp_into_level,
)
from app.db import get_session
from app.models.enums import QuestRank, QuestRarity, QuestRecurrence, QuestStatus
from app.models.quest import Quest
from app.models.user import User
from app.schemas.quest import (
    QuestCompleteQuest,
    QuestCompleteResponse,
    QuestCreate,
    QuestListResponse,
    QuestRead,
    QuestSort,
    QuestStatusFilter,
    QuestUpdate,
    UserAfterComplete,
)

router = APIRouter(prefix="/quests", tags=["quests"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _user_tz(user: User) -> tzinfo:
    """TZ пользователя; безопасный fallback на UTC при битых данных в БД."""
    try:
        return ZoneInfo(user.timezone)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def _quest_to_read(quest: Quest, now: datetime, tz: tzinfo) -> QuestRead:
    """Явная сборка ответа (effective_status нет на модели — вычисляем сами).

    Через `model_validate(dict)` — чтобы не воевать с mypy из-за
    несовместимости `QuestStatus` (str-Enum из модели) и `Literal[...]`
    (схема). Pydantic провалидирует значения по `Literal` — если раскомментируешь
    и получишь `ValidationError`, значит данные в БД расходятся со схемой.
    """
    data: dict[str, Any] = {
        "id": quest.id,
        "user_id": quest.user_id,
        "title": quest.title,
        "description": quest.description,
        "rank": quest.rank.value,
        "rarity": quest.rarity.value,
        "deadline": quest.deadline,
        "status": quest.status.value,
        "effective_status": effective_status(quest, now, tz),
        "recurrence": quest.recurrence.value,
        "last_completed_at": quest.last_completed_at,
        "completion_count": quest.completion_count,
        "xp_awarded_total": quest.xp_awarded_total,
        "created_at": quest.created_at,
        "updated_at": quest.updated_at,
    }
    return QuestRead.model_validate(data)


async def _get_owned_quest(
    quest_id: UUID,
    user_id: UUID,
    session: AsyncSession,
    *,
    for_update: bool = False,
) -> Quest:
    """404 и на чужое, и на несуществующее (§7.9 — 403 не используем).

    `for_update=True` — SELECT ... FOR UPDATE (§7.4), блокирует строку
    до commit/rollback текущей транзакции.
    """
    quest = await session.get(Quest, quest_id, with_for_update=for_update)
    if quest is None or quest.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": "Quest not found", "code": "NOT_FOUND"},
        )
    return quest


# ---------------------------------------------------------------------------
# Sort expressions (§7.2)
# ---------------------------------------------------------------------------

# CASE для сложности (rank_desc = S..F) и срочности (rarity_desc = legendary..common).
# Enum-значения — однобуквенные/строковые, компилируются в ожидаемые литералы.
_RANK_CASE = case(
    (Quest.rank == QuestRank.S, 7),
    (Quest.rank == QuestRank.A, 6),
    (Quest.rank == QuestRank.B, 5),
    (Quest.rank == QuestRank.C, 4),
    (Quest.rank == QuestRank.D, 3),
    (Quest.rank == QuestRank.E, 2),
    (Quest.rank == QuestRank.F, 1),
    else_=0,
)
_RARITY_CASE = case(
    (Quest.rarity == QuestRarity.legendary, 5),
    (Quest.rarity == QuestRarity.epic, 4),
    (Quest.rarity == QuestRarity.rare, 3),
    (Quest.rarity == QuestRarity.uncommon, 2),
    (Quest.rarity == QuestRarity.common, 1),
    else_=0,
)

# Тайм-брейкер `created_at DESC` — по §7.2 при равенстве сортируемого поля.
# NULL в deadline всегда в конце (`nullslast`).
SORT_EXPRESSIONS: dict[str, list[ColumnElement[Any]]] = {
    "deadline_asc": [Quest.deadline.asc().nullslast(), Quest.created_at.desc()],
    "deadline_desc": [Quest.deadline.desc().nullslast(), Quest.created_at.desc()],
    "created_desc": [Quest.created_at.desc()],
    "created_asc": [Quest.created_at.asc()],
    "rank_desc": [_RANK_CASE.desc(), Quest.created_at.desc()],
    "rank_asc": [_RANK_CASE.asc(), Quest.created_at.desc()],
    "rarity_desc": [_RARITY_CASE.desc(), Quest.created_at.desc()],
    "rarity_asc": [_RARITY_CASE.asc(), Quest.created_at.desc()],
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=QuestListResponse)
async def list_quests(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    status_filter: Annotated[QuestStatusFilter | None, Query(alias="status")] = None,
    rank_filter: Annotated[QuestRank | None, Query(alias="rank")] = None,
    rarity_filter: Annotated[QuestRarity | None, Query(alias="rarity")] = None,
    deadline_date: Annotated[date | None, Query()] = None,
    sort: Annotated[QuestSort, Query()] = "deadline_asc",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> QuestListResponse:
    """§7.2: фильтры (status по effective_status), сортировки, пагинация.

    Тактика MVP:
      1. Всё, что можно (rank/rarity/deadline_date), фильтруем в SQL;
         сортировку — тоже в SQL.
      2. `status` фильтруем в Python: `effective_status` зависит от
         TZ + рекуррентного периода, SQL-only это громоздко и хрупко.
      3. `total` = len(post-filter) — соответствует §7.2.

    Данные пользователя в MVP ограничены; fetch-all на фильтрованном
    подмножестве — приемлемо. При росте данных вынесем в SQL.
    """
    now = datetime.now(UTC)
    tz = _user_tz(current_user)

    stmt = select(Quest).where(Quest.user_id == current_user.id)

    if rank_filter is not None:
        stmt = stmt.where(Quest.rank == QuestRank(rank_filter))
    if rarity_filter is not None:
        stmt = stmt.where(Quest.rarity == QuestRarity(rarity_filter))
    if deadline_date is not None:
        # `(deadline AT TIME ZONE tz)::date = :date` — §5.6/§7.2.
        # NULL deadline автоматически отсеивается (NULL = X → NULL → WHERE false).
        stmt = stmt.where(
            cast(func.timezone(current_user.timezone, Quest.deadline), Date) == deadline_date
        )

    for expr in SORT_EXPRESSIONS[sort]:
        stmt = stmt.order_by(expr)

    result = await session.scalars(stmt)
    all_quests = list(result.all())

    if status_filter is not None:
        filtered = [q for q in all_quests if effective_status(q, now, tz) == status_filter]
    else:
        filtered = all_quests

    total = len(filtered)
    page = filtered[offset : offset + limit]

    return QuestListResponse(
        items=[_quest_to_read(q, now, tz) for q in page],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=QuestRead, status_code=status.HTTP_201_CREATED)
async def create_quest(
    payload: QuestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QuestRead:
    """Создание квеста. Владелец — current_user."""
    quest = Quest(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        rank=QuestRank(payload.rank),
        rarity=QuestRarity(payload.rarity),
        deadline=payload.deadline,
        recurrence=QuestRecurrence(payload.recurrence),
        status=QuestStatus.active,
    )
    session.add(quest)
    await session.commit()
    await session.refresh(quest)

    return _quest_to_read(quest, datetime.now(UTC), _user_tz(current_user))


@router.get("/{quest_id}", response_model=QuestRead)
async def get_quest(
    quest_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QuestRead:
    quest = await _get_owned_quest(quest_id, current_user.id, session)
    return _quest_to_read(quest, datetime.now(UTC), _user_tz(current_user))


@router.patch("/{quest_id}", response_model=QuestRead)
async def update_quest(
    quest_id: UUID,
    payload: QuestUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QuestRead:
    """PATCH с whitelist (§7.3).

    - До первого complete (completion_count == 0): title, description, rank,
      rarity, deadline, recurrence.
    - После: только title, description, deadline. Попытка изменить
      rank/rarity/recurrence → 409 IMMUTABLE_AFTER_COMPLETION.
    - `status`, `user_id`, `last_completed_at`, счётчики — не входят в
      схему (`extra="forbid"`), Pydantic отклонит их как VALIDATION_ERROR.
    """
    quest = await _get_owned_quest(quest_id, current_user.id, session)

    # §7.3: защита от читерства после первого выполнения.
    # Сравниваем фактическое значение: PATCH с тем же значением — не «изменение».
    if quest.completion_count > 0:
        for field in ("rank", "rarity", "recurrence"):
            if field in payload.model_fields_set:
                new_val = getattr(payload, field)
                current_val = getattr(quest, field)
                if str(new_val) != current_val.value:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "detail": f"Cannot modify {field} after first completion",
                            "code": "IMMUTABLE_AFTER_COMPLETION",
                        },
                    )

    update_data = payload.model_dump(exclude_unset=True)
    if "title" in update_data:
        quest.title = update_data["title"]
    if "description" in update_data:
        quest.description = update_data["description"]
    if "deadline" in update_data:
        quest.deadline = update_data["deadline"]
    if "rank" in update_data:
        quest.rank = QuestRank(update_data["rank"])
    if "rarity" in update_data:
        quest.rarity = QuestRarity(update_data["rarity"])
    if "recurrence" in update_data:
        quest.recurrence = QuestRecurrence(update_data["recurrence"])

    await session.commit()
    await session.refresh(quest)

    return _quest_to_read(quest, datetime.now(UTC), _user_tz(current_user))


@router.delete("/{quest_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_quest(
    quest_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    quest = await _get_owned_quest(quest_id, current_user.id, session)
    await session.delete(quest)
    await session.commit()

    # Явно возвращаем пустой ответ без тела
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{quest_id}/complete", response_model=QuestCompleteResponse)
async def complete_quest(
    quest_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QuestCompleteResponse:
    """§7.4: одна транзакция + SELECT ... FOR UPDATE, атомарный инкремент XP.

    Порядок (как в ТЗ):
      1. SELECT ... FOR UPDATE.
      2. Проверки статуса (409 на провал — rollback автоматически при выходе
         из `async with SessionLocal()` в `get_session`).
      3. calc_xp (единая формула §5.1 + §5.5).
      4. UPDATE quests.
      5. UPDATE users SET total_xp = total_xp + :xp (atomic).
      6. COMMIT.

    Параллельный complete того же квеста ждёт на FOR UPDATE и после
    коммита первого получит 409 — двойного начисления нет.
    """
    now = datetime.now(UTC)
    tz = _user_tz(current_user)

    # 1. Lock row
    quest = await _get_owned_quest(quest_id, current_user.id, session, for_update=True)

    # 2. Status checks (§7.4 matrix)
    if quest.status == QuestStatus.archived:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Quest is archived", "code": "QUEST_ARCHIVED"},
        )

    if quest.recurrence == QuestRecurrence.none and quest.status == QuestStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Quest already completed", "code": "ALREADY_COMPLETED"},
        )

    if quest.recurrence in (QuestRecurrence.daily, QuestRecurrence.weekly):
        if is_completed_in_current_period(quest.last_completed_at, quest.recurrence.value, now, tz):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "detail": "Already completed in current period",
                    "code": "ALREADY_COMPLETED_IN_PERIOD",
                },
            )

    # Просроченный не-рекуррентный active — валиден к выполнению (urgency=1.0).
    # Отдельной проверки не нужно: calc_xp вернёт базовый XP.

    # 3. Compute XP (единственная точка правды)
    xp = calc_xp(
        quest.rank.value,
        quest.rarity.value,
        recurrence=quest.recurrence.value,
        deadline=quest.deadline,
        now=now,
    )

    # 4. Update quest (в памяти; commit ниже)
    quest.last_completed_at = now
    quest.completion_count += 1
    quest.xp_awarded_total += xp
    if quest.recurrence == QuestRecurrence.none:
        quest.status = QuestStatus.completed
    # Для daily/weekly status остаётся 'active' (§5.3).

    # 5. Atomic increment XP у пользователя (не `+=` в Python — потеряем
    # обновления при параллельных complete разных квестов одного юзера).
    await session.execute(
        update(User).where(User.id == current_user.id).values(total_xp=User.total_xp + xp)
    )

    # 6. COMMIT + refresh: подтягиваем server-side `updated_at` и новый total_xp.
    await session.commit()
    await session.refresh(quest)
    await session.refresh(current_user)

    level = level_for_xp(current_user.total_xp)
    return QuestCompleteResponse(
        quest=QuestCompleteQuest(
            id=quest.id,
            status=quest.status.value,
            effective_status=effective_status(quest, now, tz),
            completion_count=quest.completion_count,
            xp_awarded_total=quest.xp_awarded_total,
            last_completed_at=quest.last_completed_at,
        ),
        xp_awarded=xp,
        user_after=UserAfterComplete(
            total_xp=current_user.total_xp,
            level=level,
            xp_into_level=xp_into_level(current_user.total_xp),
            xp_for_next_level=xp_for_next_level(level),
        ),
    )


@router.post("/{quest_id}/archive", response_model=QuestRead)
async def archive_quest(
    quest_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QuestRead:
    """§7.2: status='archived'. Идемпотентно."""
    quest = await _get_owned_quest(quest_id, current_user.id, session, for_update=True)
    if quest.status != QuestStatus.archived:
        quest.status = QuestStatus.archived
        await session.commit()
        await session.refresh(quest)

    return _quest_to_read(quest, datetime.now(UTC), _user_tz(current_user))
