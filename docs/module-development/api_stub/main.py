"""Minimal FastAPI stub that mimics a subset of the HLA-Compass API."""

from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List

import httpx
import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse


APP_ROOT = Path(__file__).resolve().parent
STATE_DIR = Path(os.environ.get("HLA_DEVKIT_STATE_DIR", "/var/lib/devkit"))
STATE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_MODULE_TEMPLATE = APP_ROOT / "modules.json"
MODULE_STATE_PATH = Path(
    os.environ.get("HLA_DEVKIT_MODULE_STATE", STATE_DIR / "modules.json")
)
RUN_STATE_PATH = Path(os.environ.get("HLA_DEVKIT_RUN_STATE", STATE_DIR / "runs.json"))
OPENAPI_PATH = Path(
    os.environ.get("HLA_DEVKIT_OPENAPI_PATH", "/app/docs/api/openapi.mini.json")
)

DB_HOST = os.environ.get("DEVKIT_DB_HOST", "postgres")
DB_PORT = int(os.environ.get("DEVKIT_DB_PORT", "5432"))
DB_NAME = os.environ.get("DEVKIT_DB_NAME", os.environ.get("DEVKIT_DB", "hla_compass"))
DB_USER = os.environ.get("DEVKIT_DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DEVKIT_DB_PASSWORD", "postgres")
MINIO_HEALTH = os.environ.get(
    "DEVKIT_MINIO_HEALTH", "http://localhost:9000/minio/health/ready"
)


def _ensure_module_state() -> None:
    if MODULE_STATE_PATH.exists():
        return
    MODULE_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DEFAULT_MODULE_TEMPLATE.exists():
        MODULE_STATE_PATH.write_text(DEFAULT_MODULE_TEMPLATE.read_text(), encoding="utf-8")
    else:
        MODULE_STATE_PATH.write_text("[]", encoding="utf-8")


def _load_modules() -> List[Dict[str, Any]]:
    _ensure_module_state()
    try:
        with MODULE_STATE_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    return []


def _save_modules(data: List[Dict[str, Any]]) -> None:
    MODULE_STATE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _load_runs() -> Dict[str, Any]:
    if not RUN_STATE_PATH.exists():
        return {}
    with RUN_STATE_PATH.open("r", encoding="utf-8") as handle:
        try:
            return json.load(handle)
        except json.JSONDecodeError:
            return {}


def _save_runs(data: Dict[str, Any]) -> None:
    RUN_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    RUN_STATE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


async def _check_postgres() -> dict:
    try:
        with psycopg.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME,
            connect_timeout=2,
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover - defensive
        return {"status": "error", "message": str(exc)}


async def _check_minio() -> dict:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(MINIO_HEALTH)
            response.raise_for_status()
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover - defensive
        return {"status": "error", "message": str(exc)}


app = FastAPI(title="HLA-Compass Devkit API", version="0.1.0")


@app.get("/v1/system/ready")
async def system_ready() -> dict:
    postgres = await _check_postgres()
    minio = await _check_minio()
    status = "ready" if postgres["status"] == "ok" and minio["status"] == "ok" else "degraded"
    return {
        "status": status,
        "timestamp": int(time.time()),
        "services": {
            "postgres": postgres,
            "minio": minio,
        },
    }


@app.get("/v1/system/health")
async def system_health() -> dict:
    payload = await system_ready()
    payload["modules"] = len(_load_modules())
    payload["runs"] = len(_load_runs())
    return payload


@app.get("/docs/openapi.json")
def openapi_document():
    if not OPENAPI_PATH.exists():
        raise HTTPException(404, detail="OpenAPI document not found")
    return FileResponse(OPENAPI_PATH)


@app.get("/v1/modules")
def list_modules() -> dict:
    return {"items": _load_modules()}


@app.post("/v1/devkit/modules")
def register_module(manifest: Dict[str, Any]) -> dict:
    required = ("name", "version")
    for field in required:
        if field not in manifest:
            raise HTTPException(status_code=400, detail=f"Manifest missing field '{field}'")

    modules = _load_modules()
    module_id = manifest.get("id") or manifest["name"]
    manifest.setdefault("id", module_id)

    filtered = [module for module in modules if module.get("id") != module_id]
    filtered.append(manifest)
    _save_modules(filtered)

    return {"status": "registered", "module": manifest}


@app.delete("/v1/devkit/modules/{module_id}")
def delete_module(module_id: str) -> dict:
    modules = _load_modules()
    updated = [module for module in modules if module.get("id") != module_id]
    if len(updated) == len(modules):
        raise HTTPException(status_code=404, detail="Module not found")
    _save_modules(updated)
    return {"status": "deleted", "moduleId": module_id}


@app.post("/v1/module-runs")
def start_module_run(payload: Dict[str, Any]) -> dict:
    module_id = payload.get("moduleId") or payload.get("module_id")
    if not module_id:
        raise HTTPException(status_code=400, detail="moduleId is required")

    modules = _load_modules()
    if not any(module.get("id") == module_id for module in modules):
        raise HTTPException(status_code=404, detail="Module not registered in devkit")

    run_id = f"devkit-run-{uuid.uuid4().hex[:8]}"
    runs = _load_runs()
    runs[run_id] = {
        "runId": run_id,
        "moduleId": module_id,
        "status": "completed",
        "parameters": payload.get("parameters") or {},
        "result": {
            "status": "success",
            "summary": {
                "message": "Devkit stub executed successfully"
            },
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
