from __future__ import annotations

import os
import secrets

from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader


API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
DEVKIT_API_KEY = os.environ.get("DEVKIT_API_KEY", "")


async def verify_api_key(api_key: str | None = Depends(API_KEY_HEADER)) -> str | None:
    if not DEVKIT_API_KEY:
        return None
    if not api_key or not secrets.compare_digest(api_key, DEVKIT_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key
