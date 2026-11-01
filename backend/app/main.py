from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.log_setup import RequestContextMiddleware, setup_logging

settings = get_settings()
setup_logging(settings.log_level)

app = FastAPI(title="Quest Board RPG API")

# Starlette: last added = outermost.
# Inner (RequestContextMiddleware) attaches X-Request-ID + logs.
# Outer (CORSMiddleware) ensures CORS headers are on every response, incl. errors.
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
