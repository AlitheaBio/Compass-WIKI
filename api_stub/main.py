"""Minimal FastAPI stub that mimics a subset of the HLA-Compass API."""

import asyncio
import json
import logging
import os
import signal
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from api_stub.auth import verify_api_key
from api_stub.database import check_postgres, close_pool, init_pool
from api_stub.exceptions import (
    DevkitError,
    devkit_exception_handler,
    generic_exception_handler,
)
from api_stub.logging_config import CorrelationIdMiddleware, setup_logging
from api_stub.middleware import SecurityHeadersMiddleware
from api_stub.schemas import ModuleManifest, ModuleRunRequest
from api_stub.storage import AtomicJsonStorage

APP_ROOT = Path(__file__).resolve().parent
STATE_DIR = Path(os.environ.get("HLA_DEVKIT_STATE_DIR", "/var/lib/devkit"))


def _safe_path(base: Path, user_path: str | Path) -> Path:
    """Ensure path stays within allowed directory."""
    resolved = (base / user_path).resolve()
    if not resolved.is_relative_to(base.resolve()):
        raise ValueError(f"Path traversal detected: {user_path}")
    return resolved


STATE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_MODULE_TEMPLATE = APP_ROOT / "modules.json"
MODULE_STATE_PATH = _safe_path(
    STATE_DIR, os.environ.get("HLA_DEVKIT_MODULE_STATE", "modules.json")
)
RUN_STATE_PATH = _safe_path(
    STATE_DIR, os.environ.get("HLA_DEVKIT_RUN_STATE", "runs.json")
)
OPENAPI_PATH = Path(
    os.environ.get("HLA_DEVKIT_OPENAPI_PATH", "/app/docs/api/openapi.mini.json")
)

modules_storage = AtomicJsonStorage(MODULE_STATE_PATH)
runs_storage = AtomicJsonStorage(RUN_STATE_PATH)

DB_PASSWORD = os.environ.get("DEVKIT_DB_PASSWORD", "postgres")
S3_SECRET_KEY = os.environ.get("DEVKIT_S3_SECRET_KEY", "")
MINIO_HEALTH = os.environ.get(
    "DEVKIT_MINIO_HEALTH", "http://localhost:9000/minio/health/ready"
)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

setup_logging()
logger = logging.getLogger(__name__)
shutdown_event = asyncio.Event()
http_client: httpx.AsyncClient | None = None

_health_cache: dict[str, dict[str, object]] = {}
_health_cache_ttl = timedelta(seconds=5)


def _handle_sigterm(*_args: object) -> None:
    shutdown_event.set()


try:
    signal.signal(signal.SIGTERM, _handle_sigterm)
    signal.signal(signal.SIGINT, _handle_sigterm)
except ValueError:
    # Signals can only be registered from the main thread.
    pass


def _validate_credentials() -> None:
    insecure = {"postgres", "minioadmin", "CHANGE_ME_INSECURE", "password", "admin"}
    if DB_PASSWORD in insecure:
        raise RuntimeError(
            "Insecure DEVKIT_DB_PASSWORD detected. Run scripts/init-dev.sh"
        )
    if S3_SECRET_KEY in insecure:
        raise RuntimeError(
            "Insecure DEVKIT_S3_SECRET_KEY detected. Run scripts/init-dev.sh"
        )


def _ensure_module_state() -> None:
    if MODULE_STATE_PATH.exists():
        return
    if DEFAULT_MODULE_TEMPLATE.exists():
        try:
            data = json.loads(DEFAULT_MODULE_TEMPLATE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = []
        if isinstance(data, list):
            modules_storage.write(data)
            return
    modules_storage.write([])


def _load_modules() -> List[Dict[str, Any]]:
    _ensure_module_state()
    data = modules_storage.read(default=[])
    return data if isinstance(data, list) else []


def _save_modules(data: List[Dict[str, Any]]) -> None:
    modules_storage.write(data)


def _load_runs() -> Dict[str, Any]:
    data = runs_storage.read(default={})
    return data if isinstance(data, dict) else {}


def _save_runs(data: Dict[str, Any]) -> None:
    runs_storage.write(data)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException)),
    reraise=True,
)
async def _check_minio_request(client: httpx.AsyncClient) -> None:
    response = await client.get(MINIO_HEALTH)
    response.raise_for_status()


async def _check_minio() -> dict:
    try:
        client = http_client
        if client is None:
            async with httpx.AsyncClient(timeout=3.0) as fallback_client:
                await _check_minio_request(fallback_client)
        else:
            await _check_minio_request(client)
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Minio health check failed", exc_info=exc)
        return {"status": "error", "message": "Minio health check failed"}


async def _cached_health_check() -> dict:
    now = datetime.utcnow()
    cached = _health_cache.get("health")
    if cached:
        timestamp = cached.get("timestamp")
        if isinstance(timestamp, datetime) and now - timestamp < _health_cache_ttl:
            data = cached.get("data")
            if isinstance(data, dict):
                return data

    postgres = await check_postgres()
    minio = await _check_minio()
    result = {"postgres": postgres, "minio": minio}
    _health_cache["health"] = {"data": result, "timestamp": now}
    return result


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting HLA-Compass Devkit API")
    _validate_credentials()
    await init_pool()
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    )
    try:
        yield
    finally:
        logger.info("Shutting down HLA-Compass Devkit API")
        shutdown_event.set()
        if http_client:
            await http_client.aclose()
            http_client = None
        await close_pool()
        await asyncio.sleep(2)


limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="HLA-Compass Devkit API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(DevkitError, devkit_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
    max_age=600,
)


@app.get("/v1/system/ready")
async def system_ready() -> dict:
    services = await _cached_health_check()
    postgres = services.get("postgres", {})
    minio = services.get("minio", {})
    status = (
        "ready"
        if postgres.get("status") == "ok" and minio.get("status") == "ok"
        else "degraded"
    )
    return {
        "status": status,
        "timestamp": int(time.time()),
        "services": services,
    }


@app.get("/v1/system/health")
async def system_health() -> dict:
    payload = await system_ready()
    payload["modules"] = len(_load_modules())
    payload["runs"] = len(_load_runs())
    return payload


@app.get("/docs/openapi.json")
def openapi_document():
    if OPENAPI_PATH.exists():
        return FileResponse(OPENAPI_PATH)
    return app.openapi()


@app.get("/v1/modules")
def list_modules() -> dict:
    return {"items": _load_modules()}


@app.post("/v1/devkit/modules", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def register_module(request: Request, manifest: ModuleManifest) -> dict:
    manifest_data = manifest.model_dump()
    module_id = manifest_data.get("id") or manifest_data["name"]
    manifest_data["id"] = module_id

    modules = _load_modules()
    filtered = [module for module in modules if module.get("id") != module_id]
    filtered.append(manifest_data)
    _save_modules(filtered)

    return {"status": "registered", "module": manifest_data}


@app.delete("/v1/devkit/modules/{module_id}", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def delete_module(request: Request, module_id: str) -> dict:
    modules = _load_modules()
    updated = [module for module in modules if module.get("id") != module_id]
    if len(updated) == len(modules):
        raise HTTPException(status_code=404, detail="Module not found")
    _save_modules(updated)
    return {"status": "deleted", "moduleId": module_id}


@app.post("/v1/module-runs", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def start_module_run(request: Request, payload: ModuleRunRequest) -> dict:
    module_id = payload.module_id

    modules = _load_modules()
    if not any(module.get("id") == module_id for module in modules):
        raise HTTPException(status_code=404, detail="Module not registered in devkit")

    run_id = f"devkit-run-{uuid.uuid4().hex[:8]}"
    runs = _load_runs()
    runs[run_id] = {
        "runId": run_id,
        "moduleId": module_id,
        "status": "completed",
        "parameters": payload.parameters or {},
        "result": {
            "status": "success",
            "summary": {"message": "Devkit stub executed successfully"},
        },
        "createdAt": time.time(),
    }
    _save_runs(runs)

    return runs[run_id]


@app.get("/v1/module-runs/{run_id}")
def get_module_run(run_id: str) -> dict:
    runs = _load_runs()
    run = runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@app.get("/v1/module-runs/{run_id}/result")
def get_module_run_result(run_id: str) -> dict:
    run = get_module_run(run_id)
    return run.get("result", {})


@app.get("/")
def root_index() -> dict:
    return {
        "service": "hla-compass-devkit-api",
        "docs": "/docs",
        "openapi": "/docs/openapi.json",
    }
