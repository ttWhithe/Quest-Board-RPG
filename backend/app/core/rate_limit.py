"""Redis-based rate limit for demo mode (Spec §7.1)."""

from __future__ import annotations

from fastapi import HTTPException, Request, status

from app.core.redis import redis_client


async def check_demo_rate_limit(request: Request) -> None:
    """Limit demo creation to 5 requests per hour per IP."""
    ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:demo:{ip}"

    # Атомарно инкрементим и ставим TTL (только при первом запросе)
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, 3600)  # 1 час

    if count > 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "detail": "Too many demo requests. Try again in an hour.",
                "code": "RATE_LIMIT_EXCEEDED",
            },
        )
