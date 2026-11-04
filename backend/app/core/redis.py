from redis.asyncio import Redis

from app.config import get_settings

_settings = get_settings()

# decode_responses=True возвращает str вместо bytes, с ним удобнее работать
redis_client: Redis = Redis.from_url(_settings.redis_url, decode_responses=True)
