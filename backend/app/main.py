from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.auth import router as auth_router
from app.api.character import router as character_router
from app.api.quests import router as quests_router
from app.config import get_settings
from app.log_setup import RequestContextMiddleware, setup_logging

settings = get_settings()
setup_logging(settings.log_level)

app = FastAPI(title="Quest Board RPG API")

# --- Exception Handlers ---


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Map Pydantic validation errors to our custom format."""
    error = exc.errors()[0]
    raw_type = error.get("type", "")

    # 1. Наши кастомные ошибки, которые мы явно кидаем в схемах через PydanticCustomError
    custom_codes = {
        "PASSWORD_TOO_SHORT",
        "PASSWORD_TOO_LONG",
        "INVALID_NICKNAME",
        "INVALID_TIMEZONE",
        "BIRTHDAY_MUST_REPEAT",
    }

    # 2. Если это стандартная ошибка Pydantic (missing, string_too_short, enum и т.д.)
    #    отдаём VALIDATION_ERROR (по ТЗ §7.9)
    code = raw_type if raw_type in custom_codes else "VALIDATION_ERROR"
    detail = error.get("msg", "Validation error")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": detail, "code": code},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Ensure all HTTPExceptions match the {detail, code} format."""
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    # Fallback for unhandled HTTPExceptions
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail), "code": "HTTP_ERROR"},
    )


# --- Middleware ---

# Starlette: last added = outermost.
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---

app.include_router(auth_router, prefix="/api/v1")
app.include_router(quests_router, prefix="/api/v1")
app.include_router(character_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
