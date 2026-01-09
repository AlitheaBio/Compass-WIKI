from __future__ import annotations

import logging

from fastapi import Request
from fastapi.responses import JSONResponse


logger = logging.getLogger(__name__)


class DevkitError(Exception):
    def __init__(self, message: str, status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code


async def devkit_exception_handler(request: Request, exc: DevkitError) -> JSONResponse:
    correlation_id = getattr(request.state, "correlation_id", None)
    logger.error(
        "DevkitError: %s",
        exc.message,
        extra={"path": request.url.path, "correlation_id": correlation_id},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": type(exc).__name__},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    correlation_id = getattr(request.state, "correlation_id", None)
    logger.exception(
        "Unhandled exception",
        extra={"path": request.url.path, "correlation_id": correlation_id},
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "type": "InternalError"},
    )
