"""Auth request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel

from app.schemas.user import NormalizedEmail, UserOut


class LoginRequest(BaseModel):
    """Payload for POST /auth/login. Email is normalized; password is not length-checked
    on login — a bad pair must return 401 INVALID_CREDENTIALS (spec §7.1)."""

    email: NormalizedEmail
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
