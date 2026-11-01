from __future__ import annotations

import contextvars
import json
import logging
import sys
import time
import uuid
from datetime import UTC, datetime

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from starlette.types import ASGIApp

request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")
user_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("user_id", default="-")


class JSONFormatter(logging.Formatter):
    """Single-line JSON log records per spec §14."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "ts": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "level": record.levelname,
            "event": getattr(record, "event", record.name),
            "request_id": request_id_var.get(),
        }
        uid = user_id_var.get()
        if uid != "-":
            payload["user_id"] = uid

        for key in ("method", "path", "status", "duration_ms"):
            val = getattr(record, key, None)
            if val is not None:
                payload[key] = val

        if record.exc_info:
            payload["error"] = record.getMessage()
            payload["traceback"] = self.formatException(record.exc_info)
        else:
            payload["msg"] = record.getMessage()

        return json.dumps(payload, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root.addHandler(handler)
    root.setLevel(level.upper())

    # Let uvicorn's loggers flow through our JSON handler (no duplicate lines)
    for name in ("uvicorn", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


class RequestContextMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._log = logging.getLogger("app.request")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_var.set(rid)
        start = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Request-ID"] = rid
            return response
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            level = logging.ERROR if status_code >= 500 else logging.INFO
            self._log.log(
                level,
                "http_request",
                extra={
                    "event": "http_request",
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "duration_ms": duration_ms,
                },
            )
            request_id_var.reset(token)
