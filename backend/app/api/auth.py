"""Authentication endpoints."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


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
    update_login_streak(user)
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
    await session.commit()
    await session.refresh(demo_user)

    token = create_access_token(demo_user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(demo_user))


@router.get("/daily-reward")
async def get_daily_reward_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Возвращает список наград и информацию о текущем дне."""
    config = load_json("daily_rewards.json")
    rewards = config.get("rewards", [])

    # Циклический переход: если день 7 прошел, начинается 1
    current_day = current_user.daily_reward_day
    if current_day > len(rewards):
        current_day = 1

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
) -> dict:
    """Забирает ежедневную награду и начисляет XP."""
    if not can_claim_daily_reward(current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"detail": "Already claimed today", "code": "ALREADY_CLAIMED"},
        )

    config = load_json("daily_rewards.json")
    rewards = config.get("rewards", [])

    current_day = current_user.daily_reward_day
    if current_day > len(rewards):
        current_day = 1

    reward = rewards[current_day - 1]

    # Начисляем награду (пока только XP)
    xp_awarded = 0
    if reward["type"] == "xp":
        xp_awarded = reward["amount"]
        current_user.total_xp += xp_awarded
    # TODO: Добавить выдачу предметов (когда будет инвентарь)

    current_user.last_daily_reward_at = datetime.now(UTC)
    current_user.daily_reward_day = current_day + 1

    await session.commit()

    return {
        "success": True,
        "xp_awarded": xp_awarded,
        "next_day": current_user.daily_reward_day,
        "new_total_xp": current_user.total_xp,
        "login_streak": current_user.login_streak,
    }
