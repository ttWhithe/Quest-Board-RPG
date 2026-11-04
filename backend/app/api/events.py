from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db import get_session
from app.models.enums import EventKind
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventOut, EventUpdate

router = APIRouter(prefix="/events", tags=["events"])


def _error(http_status: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=http_status,
        detail={"detail": message, "code": code},
    )


async def _get_own_event(event_id: UUID, user: User, db: AsyncSession) -> Event:
    """404 на несуществующее и на чужое — неотличимо (см. §7.9)."""
    stmt = select(Event).where(Event.id == event_id, Event.user_id == user.id)
    event = (await db.execute(stmt)).scalar_one_or_none()
    if event is None:
        raise _error(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Event not found")
    return event


@router.get("", response_model=list[EventOut])
async def list_events(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> list[Event]:
    stmt = (
        select(Event)
        .where(Event.user_id == user.id)
        .order_by(Event.date.asc(), Event.created_at.asc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return list(rows)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Event:
    # §6.3: kind='birthday' → repeats_yearly форсится true, поле из тела игнорируется
    repeats_yearly = True if payload.kind == EventKind.birthday else payload.repeats_yearly

    event = Event(
        user_id=user.id,
        title=payload.title,
        date=payload.date,
        kind=payload.kind,
        repeats_yearly=repeats_yearly,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.patch("/{event_id}", response_model=EventOut)
async def update_event(
    event_id: UUID,
    payload: EventUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Event:
    event = await _get_own_event(event_id, user, db)

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        # явный null не разрешён (в БД поля NOT NULL)
        if value is None:
            raise _error(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR",
                f"{key} cannot be null",
            )
        setattr(event, key, value)

    # §6.3: инвариант kind='birthday' → repeats_yearly=true
    if event.kind == EventKind.birthday and not event.repeats_yearly:
        raise _error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "BIRTHDAY_MUST_REPEAT",
            "Birthday events must repeat yearly",
        )

    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", response_class=Response)
async def delete_event(
    event_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> Response:
    event = await _get_own_event(event_id, user, db)
    await db.delete(event)
    await db.commit()
    # Day 3 lesson #1: 204 без тела — обязательно через Response
    return Response(status_code=status.HTTP_204_NO_CONTENT)
