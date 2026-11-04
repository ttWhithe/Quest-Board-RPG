"""Demo user creation logic (Spec §7.8)."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_emblem_seed
from app.models.enums import (
    EventKind,
    QuestRank,
    QuestRarity,
    QuestRecurrence,
    QuestStatus,
)
from app.models.event import Event
from app.models.quest import Quest
from app.models.user import User


async def create_demo_user(session: AsyncSession) -> User:
    """Create a demo user with deterministic seed data."""
    now = datetime.now(UTC)
    today = now.date()

    # 1. Очистка старых демо-юзеров (> 7 дней). Каскад удалит их квесты/события.
    cutoff = now - timedelta(days=7)
    await session.execute(delete(User).where(User.is_demo.is_(True), User.created_at < cutoff))

    # 2. Создание пользователя
    demo_user = User(
        email=None,
        password_hash=None,
        nickname="Странник",
        timezone="Europe/Moscow",
        emblem_seed=generate_emblem_seed(),
        is_demo=True,
        total_xp=238,  # Сумма xp_awarded_total трех completed квестов ниже
    )
    session.add(demo_user)
    await session.flush()  # Получаем user.id до создания квестов

    # 3. Квесты (13 штук)
    quests: list[Quest] = []

    # 3.1. 3 completed квеста
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Разобрать сумку",
            rank=QuestRank.C,
            rarity=QuestRarity.uncommon,
            status=QuestStatus.completed,
            recurrence=QuestRecurrence.none,
            completion_count=1,
            xp_awarded_total=66,
            last_completed_at=now - timedelta(days=1),
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Доставить письмо",
            rank=QuestRank.B,
            rarity=QuestRarity.rare,
            status=QuestStatus.completed,
            recurrence=QuestRecurrence.none,
            completion_count=1,
            xp_awarded_total=120,
            last_completed_at=now - timedelta(days=2),
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Собрать травы",
            rank=QuestRank.D,
            rarity=QuestRarity.rare,
            status=QuestStatus.completed,
            recurrence=QuestRecurrence.none,
            completion_count=1,
            xp_awarded_total=52,
            last_completed_at=now - timedelta(days=3),
        )
    )

    # 3.2. 1 просроченный active (эффективный failed)
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Оплатить счёт",
            rank=QuestRank.A,
            rarity=QuestRarity.epic,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=now - timedelta(days=2),
        )
    )

    # 3.3. 2 рекуррентных
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Утренняя зарядка",
            rank=QuestRank.F,
            rarity=QuestRarity.common,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.daily,
            last_completed_at=None,
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Недельный отчёт",
            rank=QuestRank.D,
            rarity=QuestRarity.uncommon,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.weekly,
            last_completed_at=None,
        )
    )

    # 3.4. 7 обычных active
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Финальный босс: сдать проект",
            rank=QuestRank.S,
            rarity=QuestRarity.legendary,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=now + timedelta(days=3),
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Переговоры с драконом",
            rank=QuestRank.S,
            rarity=QuestRarity.rare,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=now + timedelta(hours=20),
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Прочитать главу",
            rank=QuestRank.A,
            rarity=QuestRarity.epic,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=None,
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Позвонить кузнецу",
            rank=QuestRank.B,
            rarity=QuestRarity.uncommon,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=now + timedelta(days=5),
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Купить зелья",
            rank=QuestRank.C,
            rarity=QuestRarity.common,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=now + timedelta(days=1),
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Прибраться в гильдии",
            rank=QuestRank.D,
            rarity=QuestRarity.common,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=None,
        )
    )
    quests.append(
        Quest(
            user_id=demo_user.id,
            title="Покормить кота",
            rank=QuestRank.E,
            rarity=QuestRarity.common,
            status=QuestStatus.active,
            recurrence=QuestRecurrence.none,
            deadline=now + timedelta(hours=6),
        )
    )

    session.add_all(quests)

    # 4. События (4 штуки)
    events = [
        Event(
            user_id=demo_user.id,
            title="ДР Гильдмастера",
            date=today + timedelta(days=3),
            kind=EventKind.birthday,
            repeats_yearly=True,
        ),
        Event(
            user_id=demo_user.id,
            title="Новый год",
            date=date(today.year, 1, 1),
            kind=EventKind.holiday,
            repeats_yearly=True,
        ),
        Event(
            user_id=demo_user.id,
            title="Совет гильдии",
            date=today + timedelta(days=7),
            kind=EventKind.custom,
            repeats_yearly=False,
        ),
        Event(
            user_id=demo_user.id,
            title="Забрать заказ",
            date=today + timedelta(days=2),
            kind=EventKind.reminder,
            repeats_yearly=False,
        ),
    ]
    session.add_all(events)

    await session.commit()
    await session.refresh(demo_user)
    return demo_user
