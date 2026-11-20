"""Authentication endpoints."""

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.achievements import AchievementEvent, check_and_unlock_achievements
from app.core.demo import create_demo_user
from app.core.deps import get_current_user
from app.core.rate_limit import check_demo_rate_limit
from app.core.security import (
    create_access_token,
    generate_emblem_seed,
    hash_password,
    verify_password,
)
from app.core.streaks import can_claim_daily_reward, update_login_streak
from app.data import load_json
from app.db import get_session
from app.models.user import User
from app.models.user_item import UserItem
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_cycle_day(day: int, total_days: int) -> int:
    """Возвращает текущий день цикла (1..total_days) для любого day >= 1.

    Пример: day=8, total=7 -> ((8-1) % 7) + 1 = 1
    Пример: day=14, total=7 -> ((14-1) % 7) + 1 = 7
    """
    if total_days <= 0:
        return 1
    return ((max(1, day) - 1) % total_days) + 1


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    """Create a new user and return JWT."""
    user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        nickname=user_in.nickname,
        timezone=user_in.timezone,
        emblem_seed=generate_emblem_seed(),
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Email already registered", "code": "EMAIL_TAKEN"},
        ) from None

    await session.refresh(user)
    # При регистрации сразу активируем стрик первого дня
    update_login_streak(user)
    await session.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    """Authenticate and return JWT."""
    user = await session.scalar(select(User).where(User.email == payload.email))

    if (
        user is None
        or not user.password_hash
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"detail": "Invalid email or password", "code": "INVALID_CREDENTIALS"},
        )

    # Обновляем стрик при входе
    prev_login_at = user.last_login_at
    update_login_streak(user)

    now = datetime.now(UTC)
    ctx: dict[str, Any] = {"now": now}
    if prev_login_at is not None:
        ctx["days_since_previous_login"] = (now - prev_login_at).days

    await session.flush()
    await check_and_unlock_achievements(session, user, AchievementEvent.LOGIN, ctx)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Get current user profile."""
    # Проверяем стрик при каждой загрузке приложения
    updated = update_login_streak(current_user)
    if updated:
        await session.flush()
        await check_and_unlock_achievements(
            session,
            current_user,
            AchievementEvent.LOGIN,
            {"now": datetime.now(UTC)},
        )
        await session.commit()
        await session.refresh(current_user)
    return current_user


@router.post(
    "/demo",
    response_model=TokenResponse,
    dependencies=[Depends(check_demo_rate_limit)],
)
async def demo_login(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TokenResponse:
    """Create a demo user with seeded data and return JWT (Spec §7.8)."""
    demo_user = await create_demo_user(session)
    update_login_streak(demo_user)
    await session.flush()
    await check_and_unlock_achievements(
        session,
        demo_user,
        AchievementEvent.DEMO_LOGIN,
        {"now": datetime.now(UTC)},
    )
    await session.commit()
    await session.refresh(demo_user)

    token = create_access_token(demo_user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(demo_user))


@router.get("/daily-reward")
async def get_daily_reward_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    """Возвращает список наград и информацию о текущем дне."""
    config = load_json("daily_rewards.json")
    rewards = config.get("rewards", [])

    # Источник правды — daily_reward_day (инкрементится при получении награды)
    current_day = _get_cycle_day(current_user.daily_reward_day, len(rewards))

    can_claim = can_claim_daily_reward(current_user)

    return {
        "rewards": rewards,
        "current_day": current_day,
        "can_claim": can_claim,
        "streak": current_user.login_streak,
    }


@router.post("/daily-reward")
async def claim_daily_reward(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Забирает ежедневную награду и начисляет XP."""
    if not can_claim_daily_reward(current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Already claimed today", "code": "ALREADY_CLAIMED"},
        )

    config = load_json("daily_rewards.json")
    rewards = config.get("rewards", [])

    # Текущий день = позиция в цикле на основе daily_reward_day
    current_day = _get_cycle_day(current_user.daily_reward_day, len(rewards))
    reward = rewards[current_day - 1]

    # Начисляем награду
    xp_awarded = 0
    item_awarded = None

    if reward["type"] == "xp":
        xp_awarded = reward["amount"]
        current_user.total_xp += xp_awarded
    elif reward["type"] == "item":
        item_id = reward.get("item_id")
        amount = int(reward.get("amount", 1))
        items_dict = load_json("items.json").get("items", [])
        # Проверяем, что предмет существует, чтобы не выдать битый
        if any(i["id"] == item_id for i in items_dict):
            for _ in range(amount):
                session.add(UserItem(user_id=current_user.id, item_code=item_id))
            item_awarded = item_id

    current_user.last_daily_reward_at = datetime.now(UTC)
    # Синхронизируем daily_reward_day
    current_user.daily_reward_day = current_day + 1

    await session.flush()
    await check_and_unlock_achievements(
        session,
        current_user,
        AchievementEvent.DAILY_REWARD,
        {"now": datetime.now(UTC)},
    )
    await session.commit()
    await session.refresh(current_user)

    return {
        "success": True,
        "xp_awarded": xp_awarded,
        "item_awarded": item_awarded,
        "next_day": _get_cycle_day(current_user.daily_reward_day, len(rewards)),
        "new_total_xp": current_user.total_xp,
        "login_streak": current_user.login_streak,
    }
