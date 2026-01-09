import importlib
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

pytest.importorskip("psycopg", reason="psycopg is required to import api_stub.main")


def load_app(
    monkeypatch,
    tmp_path,
    *,
    api_key="test-key",
    db_password="safe-pass",
    s3_secret="safe-secret"
):
    monkeypatch.setenv("DEVKIT_API_KEY", api_key)
    monkeypatch.setenv("DEVKIT_DB_PASSWORD", db_password)
    monkeypatch.setenv("DEVKIT_S3_SECRET_KEY", s3_secret)
    monkeypatch.setenv("HLA_DEVKIT_STATE_DIR", str(tmp_path))
    monkeypatch.delenv("HLA_DEVKIT_MODULE_STATE", raising=False)
    monkeypatch.delenv("HLA_DEVKIT_RUN_STATE", raising=False)

    sys.modules.pop("api_stub.main", None)
    sys.modules.pop("api_stub.auth", None)

    module = importlib.import_module("api_stub.main")
    return module.app


def test_api_key_required(monkeypatch, tmp_path):
    app = load_app(monkeypatch, tmp_path)
    client = TestClient(app)

    response = client.post(
        "/v1/devkit/modules",
        json={"name": "test-module", "version": "1.0.0"},
    )

    assert response.status_code == 401


def test_register_module_valid(monkeypatch, tmp_path):
    app = load_app(monkeypatch, tmp_path)
    client = TestClient(app)

    response = client.post(
        "/v1/devkit/modules",
        headers={"X-API-Key": "test-key"},
        json={"name": "test-module", "version": "1.0.0"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "registered"
    assert payload["module"]["id"] == "test-module"


def test_register_module_invalid_name(monkeypatch, tmp_path):
    app = load_app(monkeypatch, tmp_path)
    client = TestClient(app)

    response = client.post(
        "/v1/devkit/modules",
        headers={"X-API-Key": "test-key"},
        json={"name": "../evil", "version": "1.0.0"},
    )

    assert response.status_code == 422


def test_register_module_missing_version(monkeypatch, tmp_path):
    app = load_app(monkeypatch, tmp_path)
    client = TestClient(app)

    response = client.post(
        "/v1/devkit/modules",
        headers={"X-API-Key": "test-key"},
        json={"name": "ok-name"},
    )

    assert response.status_code == 422


def test_module_run_unknown_module(monkeypatch, tmp_path):
    app = load_app(monkeypatch, tmp_path)
    client = TestClient(app)

    response = client.post(
        "/v1/module-runs",
        headers={"X-API-Key": "test-key"},
        json={"moduleId": "missing-module"},
    )

    assert response.status_code == 404


def test_insecure_credentials_block_startup(monkeypatch, tmp_path):
    app = load_app(
        monkeypatch,
        tmp_path,
        db_password="postgres",
        s3_secret="minioadmin",
    )

    with pytest.raises(RuntimeError, match="Insecure DEVKIT_DB_PASSWORD detected"):
        with TestClient(app):
            pass


def test_path_traversal_blocked(monkeypatch, tmp_path):
    monkeypatch.setenv("DEVKIT_DB_PASSWORD", "safe-pass")
    monkeypatch.setenv("DEVKIT_S3_SECRET_KEY", "safe-secret")
    monkeypatch.setenv("HLA_DEVKIT_STATE_DIR", str(tmp_path))
    monkeypatch.setenv("HLA_DEVKIT_MODULE_STATE", "../evil.json")

    sys.modules.pop("api_stub.main", None)
    sys.modules.pop("api_stub.auth", None)

    with pytest.raises(ValueError, match="Path traversal detected"):
        importlib.import_module("api_stub.main")
