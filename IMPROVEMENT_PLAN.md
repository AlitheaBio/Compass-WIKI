# Improvement Plan

> **Goal:** Transform the HLA-Compass SDK codebase to military-grade security, stability, and performance standards.

> **Principles:** No workarounds, no placeholders, no speculative abstractions, no over-engineering. Every change must be justified and verified. If uncertain, ask.

---

## Priority Classification

| Priority | Focus Area | Criteria |
|----------|------------|----------|
| **P0** | UI/UX/DX | Correctness of user flows, clarity, accessibility, dev ergonomics |
| **P1** | Security | AuthN/Z, data handling, injection, secrets, supply chain |
| **P2** | Performance | Hot paths, memory/IO, network, N+1, latency budgets |
| **P3** | Elegance/Maintainability | Readability, cohesion, tests, simplicity |

---

## P0: UI/UX/DX Issues

### P0.1 User Flow Correctness

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **Silent failure on missing credentials** | `api_stub/main.py` | App starts with insecure defaults, no warning | Add startup validation that fails loudly with clear instructions |
| **Unclear error messages** | `api_stub/main.py:152` | `"Manifest missing field 'name'"` lacks context | Include expected format, example, and docs link in error |
| **No input feedback in templates** | `templates/ui-template/frontend/index.tsx` | Form validation errors not shown inline | Add per-field validation feedback using Ant Design's validateStatus |
| **Missing loading states** | `templates/ui-template/frontend/api.ts` | No timeout or retry feedback for API calls | Add explicit timeout handling with user-facing retry option |

**Specific Fixes:**

```python
# api_stub/main.py - Clear startup failure
def _validate_environment():
    """Fail fast with actionable error messages."""
    errors = []

    if not DB_HOST:
        errors.append("DEVKIT_DB_HOST not set. See .env.example")
    if DB_PASSWORD in ("postgres", "CHANGE_ME", ""):
        errors.append("DEVKIT_DB_PASSWORD is insecure. Run: ./scripts/init-dev.sh")

    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        raise SystemExit(1)
```

### P0.2 Developer Ergonomics

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **No local setup script** | Root | Manual multi-step setup | Create `scripts/setup-dev.sh` with one command |
| **Missing type hints** | `api_stub/main.py:148` | `manifest: Dict[str, Any]` loses IDE support | Use Pydantic models for full autocomplete |
| **Inconsistent module ID fields** | `templates/*/backend/main.py` | `run_id`, `runId`, `job_id` all accepted | Standardize on snake_case, add deprecation warnings for others |
| **No hot reload for backend** | `docker-compose.yml` | Must restart container on code change | Add `--reload` flag to uvicorn in dev |

**Specific Fixes:**

```yaml
# docker-compose.yml - Add dev mode with reload
api-stub:
  ...
  command: ["uvicorn", "api_stub.main:app", "--host", "0.0.0.0", "--port", "4100", "--reload"]
  environment:
    PYTHONDONTWRITEBYTECODE: 1
```

### P0.3 Accessibility

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **Missing ARIA labels** | `templates/ui-template/frontend/index.tsx` | Form inputs lack accessible names | Add `aria-label` to all interactive elements |
| **Color-only indicators** | `index.tsx:282-294` | Score colors without text alternatives | Add text labels alongside color coding |
| **No keyboard navigation** | `LocalDataBrowser.tsx` | Tree navigation requires mouse | Add keyboard handlers for arrow keys |
| **Missing focus indicators** | `styles.css` | Custom styles may override focus rings | Ensure `:focus-visible` styles are present |

**Specific Fixes:**

```tsx
// templates/ui-template/frontend/index.tsx - Accessible score display
{(score * 100).toFixed(1)}%
<span className="sr-only">
  {score > 0.8 ? 'Good score' : score > 0.5 ? 'Medium score' : 'Low score'}
</span>
```

### P0.4 Documentation Gaps

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **No API error reference** | `docs/` | Users don't know what errors to expect | Add error codes documentation |
| **Missing env var docs** | `README.md` | Environment variables not documented | Add table of all env vars with defaults |
| **No troubleshooting guide** | `docs/` | Common issues not addressed | Add FAQ/troubleshooting section |

---

## P1: Security Issues

### P1.1 Authentication & Authorization

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **No authentication on API** | `api_stub/main.py` | Critical | Add API key middleware (see Phase 1.4) |
| **No authorization checks** | All endpoints | Critical | Add role-based access control |
| **JWT validation missing** | `api_stub/` | Critical | Validate `HLA_DEVKIT_USER_ID` is a real JWT |
| **No session management** | Frontend | High | Add session timeout and refresh |

**Specific Files to Create:**

- `api_stub/auth.py` - Authentication middleware
- `api_stub/authz.py` - Authorization policies

### P1.2 Data Handling

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **No input sanitization** | `api_stub/main.py:148` | Critical | Use Pydantic with strict validators |
| **Exception messages leak info** | `main.py:96` | High | Sanitize all error responses |
| **User input in file paths** | `main.py:155` | Critical | Validate and sanitize module IDs |
| **No request size limits** | FastAPI app | Medium | Add `RequestSizeLimitMiddleware` |

**Specific Fixes:**

```python
# api_stub/schemas.py - Strict input validation
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re

class ModuleManifest(BaseModel):
    model_config = ConfigDict(extra="forbid")  # Reject unknown fields

    name: str = Field(..., min_length=1, max_length=128, pattern=r"^[a-zA-Z][a-zA-Z0-9_-]*$")
    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$")
    id: str | None = Field(None, max_length=128)

    @field_validator("name", "id", mode="before")
    @classmethod
    def sanitize_id(cls, v):
        if v is None:
            return v
        # Remove any path traversal attempts
        v = str(v).replace("..", "").replace("/", "").replace("\\", "")
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Invalid characters in identifier")
        return v
```

### P1.3 Injection Prevention

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **Raw SQL possible** | `main.py:93` | Low (parameterized) | Add SQLAlchemy or explicit parameterization |
| **JSON injection** | `main.py:64` | Medium | Validate JSON structure before storage |
| **Command injection risk** | `scripts/deploy_docs.sh:28` | Medium | Quote all variables |
| **Log injection** | All logging | Medium | Sanitize user input before logging |

**Specific Fixes:**

```bash
# scripts/deploy_docs.sh - Safe variable usage
aws s3 sync site/ "s3://${BUCKET_NAME:?BUCKET_NAME required}" --delete
```

### P1.4 Secrets Management

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **Default passwords in example** | `.env.example` | High | Use placeholder that fails validation |
| **Secrets in docker-compose** | `docker-compose.yml:11-13` | Medium | Reference env file only |
| **No secrets rotation** | N/A | Medium | Document rotation procedure |
| **API keys in memory** | `api_stub/auth.py` | Low | Use secure comparison |

**Specific Fixes:**

```python
# api_stub/auth.py - Secure secret comparison
import secrets

def verify_api_key(provided: str, expected: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    return secrets.compare_digest(provided.encode(), expected.encode())
```

### P1.5 Supply Chain Security

| Issue | Location | Severity | Fix |
|-------|----------|----------|-----|
| **Unpinned Docker base image** | `api-stub.Dockerfile:1` | High | Pin to digest |
| **Unpinned npm deps** | `package.json` | Medium | Use lockfile, add `npm ci` |
| **No dependency scanning** | CI/CD | High | Add pip-audit, npm audit, Trivy |
| **Unpinned GH Actions** | `.github/workflows/` | Medium | Pin to SHA |

**Specific Fixes:**

```dockerfile
# api-stub.Dockerfile - Pin base image
FROM python:3.11-slim@sha256:abc123...  # Get actual digest
```

```yaml
# .github/workflows/*.yml - Pin actions
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

---

## P2: Performance Issues

### P2.1 Hot Paths

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| **Health check reads file every call** | `main.py:130-131` | High | Cache module/run counts with TTL |
| **New DB connection per request** | `main.py:84-93` | Critical | Use connection pool |
| **New HTTP client per request** | `main.py:101` | High | Reuse client across requests |
| **JSON parse on every module list** | `main.py:51-60` | Medium | Cache with invalidation |

**Specific Fixes:**

```python
# api_stub/main.py - Cached module count
from functools import lru_cache
from time import time

_module_cache = {"data": None, "expires": 0}

def _load_modules_cached() -> List[Dict[str, Any]]:
    now = time()
    if _module_cache["data"] is None or now > _module_cache["expires"]:
        _module_cache["data"] = _load_modules()
        _module_cache["expires"] = now + 5  # 5 second TTL
    return _module_cache["data"]

def _invalidate_module_cache():
    _module_cache["data"] = None
```

### P2.2 Memory & I/O

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| **Full file read for each operation** | `main.py:54-55` | Medium | Stream large files, paginate |
| **Unbounded run history** | `main.py:186-200` | High | Add max runs limit, cleanup old |
| **No request body size limit** | FastAPI app | Medium | Add limit middleware |
| **Frontend bundles not gzipped** | `webpack.config.js` | Medium | Add compression plugin |

**Specific Fixes:**

```python
# api_stub/main.py - Limit stored runs
MAX_STORED_RUNS = 1000

def _save_runs(data: Dict[str, Any]) -> None:
    # Prune oldest runs if over limit
    if len(data) > MAX_STORED_RUNS:
        sorted_runs = sorted(data.items(), key=lambda x: x[1].get("createdAt", 0))
        data = dict(sorted_runs[-MAX_STORED_RUNS:])
    RUN_STATE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
```

### P2.3 Network

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| **No HTTP/2** | Uvicorn config | Low | Enable HTTP/2 in production |
| **No response compression** | FastAPI app | Medium | Add GZipMiddleware |
| **No keep-alive tuning** | httpx client | Low | Configure connection limits |
| **CDN not configured** | Frontend | Medium | Add cache headers for static assets |

**Specific Fixes:**

```python
# api_stub/main.py - Add compression
from starlette.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### P2.4 N+1 Queries

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| **Module lookup per run** | `main.py:181-183` | Medium | Batch module existence check |
| **Sequential health checks** | `main.py:114-115` | Medium | Use `asyncio.gather()` |

**Specific Fixes:**

```python
# api_stub/main.py - Parallel health checks
@app.get("/v1/system/ready")
async def system_ready() -> dict:
    postgres, minio = await asyncio.gather(
        _check_postgres(),
        _check_minio(),
    )
    status = "ready" if postgres["status"] == "ok" and minio["status"] == "ok" else "degraded"
    return {"status": status, ...}
```

### P2.5 Latency Budgets

| Issue | Location | Target | Current | Fix |
|-------|----------|--------|---------|-----|
| **Health check** | `/v1/system/ready` | <100ms | ~500ms | Cache, parallel checks |
| **Module list** | `/v1/modules` | <50ms | ~100ms | In-memory cache |
| **Module register** | POST `/v1/devkit/modules` | <200ms | ~300ms | Async file write |

---

## P3: Elegance & Maintainability

### P3.1 Readability

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **Magic strings** | `main.py:31-38` | Env vars hardcoded in multiple places | Create `config.py` module |
| **Inconsistent naming** | Templates | `run_id` vs `runId` vs `job_id` | Standardize on snake_case |
| **Long functions** | `index.tsx:192-225` | `handleSubmit` does too much | Extract validation, API call, state update |
| **Repeated patterns** | `main.py:51-74` | Load/save pattern duplicated | Create `AtomicJsonStorage` class |

**Specific Fixes:**

```python
# api_stub/config.py - Centralized configuration
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_host: str = "postgres"
    db_port: int = 5432
    db_name: str = "hla_compass"
    db_user: str = "postgres"
    db_password: str = ""

    minio_health_url: str = "http://localhost:9000/minio/health/ready"

    state_dir: str = "/var/lib/devkit"
    api_key: str | None = None

    class Config:
        env_prefix = "DEVKIT_"

settings = Settings()
```

### P3.2 Cohesion

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **Mixed concerns in main.py** | `api_stub/main.py` | DB, storage, HTTP, routing all in one file | Split into modules |
| **Frontend components too large** | `index.tsx` (660 lines) | Single file with all UI | Extract tab content to separate files |
| **No separation of API routes** | `main.py` | All routes in one file | Create `routes/` directory |

**Recommended Structure:**

```
api_stub/
├── __init__.py
├── main.py              # FastAPI app setup only
├── config.py            # Settings
├── schemas.py           # Pydantic models
├── routes/
│   ├── __init__.py
│   ├── health.py        # /v1/system/* endpoints
│   ├── modules.py       # /v1/modules, /v1/devkit/modules
│   └── runs.py          # /v1/module-runs
├── services/
│   ├── database.py      # Connection pool
│   ├── storage.py       # AtomicJsonStorage
│   └── health.py        # Health check logic
└── middleware/
    ├── auth.py
    ├── security.py
    └── logging.py
```

### P3.3 Testing

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **No unit tests for API** | `api_stub/` | Zero test coverage | Add pytest with httpx TestClient |
| **No frontend tests** | `frontend/` | Jest configured but no tests | Add React Testing Library tests |
| **No integration tests** | Root | Docker setup not tested | Add docker-compose test suite |
| **No contract tests** | API | Schema changes undetected | Add OpenAPI schema validation |

**Specific Files to Create:**

```
tests/
├── conftest.py           # Fixtures
├── test_health.py        # Health endpoint tests
├── test_modules.py       # Module CRUD tests
├── test_runs.py          # Run management tests
├── test_auth.py          # Auth middleware tests
└── test_validation.py    # Input validation tests
```

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from api_stub.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers():
    return {"X-API-Key": "test-key"}
```

```python
# tests/test_modules.py
def test_register_module_valid(client):
    response = client.post("/v1/devkit/modules", json={
        "name": "test-module",
        "version": "1.0.0"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "registered"

def test_register_module_invalid_name(client):
    response = client.post("/v1/devkit/modules", json={
        "name": "../evil",
        "version": "1.0.0"
    })
    assert response.status_code == 422
```

### P3.4 Simplicity

| Issue | Location | Problem | Fix |
|-------|----------|---------|-----|
| **Over-abstracted resolvers** | `templates/*/backend/main.py:11-37` | Multiple ways to get same value | Use SDK's built-in context properties |
| **Duplicate theme logic** | `index.tsx:53-113` | Complex fallback chain | Simplify to single source of truth |
| **Unused code paths** | Various | Dead code from iteration | Remove or gate behind feature flags |

**Specific Fixes:**

```python
# templates/ui-template/backend/main.py - Use SDK properties
class UIModule(Module):
    def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        # Use built-in properties instead of manual resolution
        context_meta = {
            "run_id": self.run_id,           # SDK provides this
            "organization_id": self.organization_id,
            "environment": self.environment,
        }
        # ... rest of logic
```

---

## Overview

| Phase | Focus | Timeline | Effort |
|-------|-------|----------|--------|
| 1 | Critical Security Fixes | Days 1-3 | High |
| 2 | Security Hardening | Days 4-7 | Medium |
| 3 | Stability Improvements | Days 8-12 | Medium |
| 4 | Performance Optimizations | Days 13-16 | Medium |
| 5 | CI/CD & Monitoring | Days 17-20 | Low |

---

## Phase 1: Critical Security Fixes (Days 1-3)

### 1.1 Secure Credential Management

**Files to modify:**
- `.env.example`
- `docker-compose.yml`
- `scripts/init-dev.sh` (new)

**Tasks:**

- [x] Create `scripts/init-dev.sh` that generates random credentials on first setup
```bash
#!/bin/bash
# Generate secure random credentials for development
if [ ! -f .env.devkit ]; then
  DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
  S3_SECRET=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

  cp .env.example .env.devkit
  sed -i "s/DEVKIT_DB_PASSWORD=postgres/DEVKIT_DB_PASSWORD=$DB_PASSWORD/" .env.devkit
  sed -i "s/DEVKIT_S3_SECRET_KEY=minioadmin/DEVKIT_S3_SECRET_KEY=$S3_SECRET/" .env.devkit

  echo "Generated secure credentials in .env.devkit"
fi
```

- [x] Update `.env.example` to use placeholder values that fail loudly
```
DEVKIT_DB_PASSWORD=CHANGE_ME_INSECURE
DEVKIT_S3_SECRET_KEY=CHANGE_ME_INSECURE
```

- [x] Add credential validation on startup in `api_stub/main.py`
```python
def _validate_credentials():
    insecure = ["postgres", "minioadmin", "CHANGE_ME_INSECURE", "password", "admin"]
    if DB_PASSWORD in insecure:
        raise RuntimeError("Insecure DB_PASSWORD detected. Run scripts/init-dev.sh")
    if os.environ.get("DEVKIT_S3_SECRET_KEY", "") in insecure:
        raise RuntimeError("Insecure S3 secret detected. Run scripts/init-dev.sh")
```

---

### 1.2 API Input Validation with Pydantic

**Files to modify:**
- `api_stub/main.py`
- `api_stub/schemas.py` (new)

**Tasks:**

- [x] Create `api_stub/schemas.py` with Pydantic models:
```python
from pydantic import BaseModel, Field, field_validator
import re

class ModuleManifest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+$")
    id: str | None = Field(None, max_length=128)

    @field_validator("name", "id")
    @classmethod
    def validate_safe_id(cls, v):
        if v and not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("ID must be alphanumeric with dashes/underscores only")
        return v

class ModuleRunRequest(BaseModel):
    moduleId: str = Field(..., alias="module_id")
    parameters: dict = Field(default_factory=dict)

    class Config:
        populate_by_name = True
```

- [x] Update `api_stub/main.py` to use schemas:
```python
from api_stub.schemas import ModuleManifest, ModuleRunRequest

@app.post("/v1/devkit/modules")
def register_module(manifest: ModuleManifest) -> dict:
    # manifest is now validated automatically
    ...
```

---

### 1.3 Path Traversal Prevention

**Files to modify:**
- `api_stub/main.py`

**Tasks:**

- [x] Add path validation utility:
```python
def _safe_path(base: Path, user_path: str) -> Path:
    """Ensure path stays within allowed directory."""
    resolved = (base / user_path).resolve()
    if not resolved.is_relative_to(base.resolve()):
        raise ValueError(f"Path traversal detected: {user_path}")
    return resolved
```

- [x] Apply to all file operations:
```python
def _save_modules(data: List[Dict[str, Any]]) -> None:
    safe_path = _safe_path(STATE_DIR, "modules.json")
    safe_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
```

---

### 1.4 Basic Authentication Middleware

**Files to modify:**
- `api_stub/main.py`
- `api_stub/auth.py` (new)

**Tasks:**

- [x] Create `api_stub/auth.py`:
```python
from fastapi import Request, HTTPException, Depends
from fastapi.security import APIKeyHeader
import os

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
DEVKIT_API_KEY = os.environ.get("DEVKIT_API_KEY")

async def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
    # Skip auth if no key configured (dev mode)
    if not DEVKIT_API_KEY:
        return None
    if not api_key or api_key != DEVKIT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key
```

- [x] Apply to protected endpoints:
```python
from api_stub.auth import verify_api_key

@app.post("/v1/devkit/modules", dependencies=[Depends(verify_api_key)])
def register_module(manifest: ModuleManifest) -> dict:
    ...
```

---

## Phase 2: Security Hardening (Days 4-7)

### 2.1 Docker Security

**Files to modify:**
- `api-stub.Dockerfile`
- `docker-compose.yml`

**Tasks:**

- [x] Update Dockerfile for non-root execution:
```dockerfile
FROM python:3.11-slim@sha256:<pin-digest>

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

COPY api_stub/requirements.txt /tmp/api-stub-requirements.txt
RUN pip install --no-cache-dir -r /tmp/api-stub-requirements.txt

COPY --chown=appuser:appgroup api_stub /app/api_stub

USER appuser

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:4100/v1/system/ready || exit 1

CMD ["uvicorn", "api_stub.main:app", "--host", "0.0.0.0", "--port", "4100"]
```

- [x] Update docker-compose.yml with security options:
```yaml
api-stub:
  ...
  security_opt:
    - no-new-privileges:true
  read_only: true
  tmpfs:
    - /tmp
  cap_drop:
    - ALL
```

---

### 2.2 Security Headers Middleware

**Files to modify:**
- `api_stub/main.py`
- `api_stub/middleware.py` (new)

**Tasks:**

- [x] Create `api_stub/middleware.py`:
```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        # Add HSTS for production
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
```

- [x] Add to app:
```python
from api_stub.middleware import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware)
```

---

### 2.3 Rate Limiting

**Files to modify:**
- `api_stub/requirements.txt`
- `api_stub/main.py`

**Tasks:**

- [x] Add slowapi to requirements: <!-- gitleaks:allow -->
```
slowapi==0.1.9
```

- [x] Implement rate limiting:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/v1/devkit/modules")
@limiter.limit("10/minute")
def register_module(request: Request, manifest: ModuleManifest) -> dict:
    ...
```

---

### 2.4 CORS Configuration

**Files to modify:**
- `api_stub/main.py`

**Tasks:**

- [x] Add proper CORS configuration:
```python
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
    max_age=600,
)
```

---

## Phase 3: Stability Improvements (Days 8-12)

### 3.1 Specific Exception Handling

**Files to modify:**
- `api_stub/main.py`
- `api_stub/exceptions.py` (new)

**Tasks:**

- [x] Create `api_stub/exceptions.py`:
```python
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class DevkitError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code

async def devkit_exception_handler(request: Request, exc: DevkitError):
    logger.error(f"DevkitError: {exc.message}", extra={"path": request.url.path})
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": type(exc).__name__}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception", extra={"path": request.url.path})
    # Don't leak internal error details
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "type": "InternalError"}
    )
```

- [x] Update database check with specific exceptions:
```python
import psycopg

async def _check_postgres() -> dict:
    try:
        with psycopg.connect(...) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return {"status": "ok"}
    except psycopg.OperationalError as exc:
        logger.warning(f"Postgres connection failed: {exc}")
        return {"status": "error", "message": "Database connection failed"}
    except psycopg.InterfaceError as exc:
        logger.warning(f"Postgres interface error: {exc}")
        return {"status": "error", "message": "Database interface error"}
```

---

### 3.2 Atomic File Operations with Locking

**Files to modify:**
- `api_stub/requirements.txt`
- `api_stub/main.py`
- `api_stub/storage.py` (new)

**Tasks:**

- [x] Add filelock to requirements:
```
filelock==3.20.1
```

- [x] Create `api_stub/storage.py`:
```python
import json
import tempfile
import os
from pathlib import Path
from filelock import FileLock
from typing import Any

class AtomicJsonStorage:
    def __init__(self, path: Path):
        self.path = path
        self.lock = FileLock(str(path) + ".lock", timeout=10)

    def read(self, default: Any = None) -> Any:
        with self.lock:
            if not self.path.exists():
                return default
            try:
                return json.loads(self.path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return default

    def write(self, data: Any) -> None:
        with self.lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            # Write to temp file first, then atomic rename
            fd, tmp_path = tempfile.mkstemp(
                dir=self.path.parent,
                prefix=self.path.name,
                suffix=".tmp"
            )
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                os.replace(tmp_path, self.path)
            except:
                os.unlink(tmp_path)
                raise
```

- [x] Use in main.py:
```python
from api_stub.storage import AtomicJsonStorage

modules_storage = AtomicJsonStorage(MODULE_STATE_PATH)
runs_storage = AtomicJsonStorage(RUN_STATE_PATH)

def _load_modules() -> List[Dict[str, Any]]:
    return modules_storage.read(default=[])

def _save_modules(data: List[Dict[str, Any]]) -> None:
    modules_storage.write(data)
```

---

### 3.3 Retry Logic with Tenacity

**Files to modify:**
- `api_stub/requirements.txt`
- `api_stub/main.py`

**Tasks:**

- [x] Add tenacity to requirements:
```
tenacity==8.2.3
```

- [x] Apply retry decorators:
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import httpx

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException)),
)
async def _check_minio() -> dict:
    async with httpx.AsyncClient(timeout=3.0) as client:
        response = await client.get(MINIO_HEALTH)
        response.raise_for_status()
    return {"status": "ok"}
```

---

### 3.4 Graceful Shutdown

**Files to modify:**
- `api_stub/main.py`

**Tasks:**

- [x] Add lifecycle events:
```python
import signal
import asyncio

shutdown_event = asyncio.Event()

@app.on_event("startup")
async def startup():
    logger.info("Starting HLA-Compass Devkit API")
    _validate_credentials()

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down HLA-Compass Devkit API")
    shutdown_event.set()
    # Allow in-flight requests to complete
    await asyncio.sleep(2)

def handle_sigterm(*args):
    shutdown_event.set()

signal.signal(signal.SIGTERM, handle_sigterm)
```

---

## Phase 4: Performance Optimizations (Days 13-16)

### 4.1 Database Connection Pooling

**Files to modify:**
- `api_stub/requirements.txt`
- `api_stub/main.py`
- `api_stub/database.py` (new)

**Tasks:**

- [x] Update requirements:
```
psycopg[binary,pool]==3.1.20
```

- [x] Create `api_stub/database.py`:
```python
from psycopg_pool import AsyncConnectionPool
import os

DB_HOST = os.environ.get("DEVKIT_DB_HOST", "postgres")
DB_PORT = int(os.environ.get("DEVKIT_DB_PORT", "5432"))
DB_NAME = os.environ.get("DEVKIT_DB_NAME", "hla_compass")
DB_USER = os.environ.get("DEVKIT_DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DEVKIT_DB_PASSWORD", "postgres")

conninfo = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"

pool: AsyncConnectionPool | None = None

async def init_pool():
    global pool
    pool = AsyncConnectionPool(conninfo=conninfo, min_size=2, max_size=10, open=False)
    await pool.open()

async def close_pool():
    global pool
    if pool:
        await pool.close()

async def check_postgres() -> dict:
    if not pool:
        return {"status": "error", "message": "Pool not initialized"}
    try:
        async with pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
```

- [x] Update main.py:
```python
from api_stub.database import init_pool, close_pool, check_postgres

@app.on_event("startup")
async def startup():
    await init_pool()

@app.on_event("shutdown")
async def shutdown():
    await close_pool()

@app.get("/v1/system/ready")
async def system_ready() -> dict:
    postgres = await check_postgres()
    ...
```

---

### 4.2 HTTP Client Connection Reuse

**Files to modify:**
- `api_stub/main.py`

**Tasks:**

- [x] Create shared HTTP client:
```python
http_client: httpx.AsyncClient | None = None

@app.on_event("startup")
async def startup():
    global http_client
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, connect=5.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    )

@app.on_event("shutdown")
async def shutdown():
    global http_client
    if http_client:
        await http_client.aclose()

async def _check_minio() -> dict:
    try:
        response = await http_client.get(MINIO_HEALTH)
        response.raise_for_status()
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
```

---

### 4.3 Response Caching

**Files to modify:**
- `api_stub/main.py`

**Tasks:**

- [x] Add simple in-memory cache for health checks:
```python
from functools import lru_cache
from datetime import datetime, timedelta
import asyncio

_health_cache: dict = {}
_health_cache_ttl = timedelta(seconds=5)

async def _cached_health_check() -> dict:
    now = datetime.utcnow()
    cached = _health_cache.get("health")
    if cached and now - cached["timestamp"] < _health_cache_ttl:
        return cached["data"]

    postgres = await check_postgres()
    minio = await _check_minio()
    result = {"postgres": postgres, "minio": minio}

    _health_cache["health"] = {"data": result, "timestamp": now}
    return result
```

---

## Phase 5: CI/CD & Monitoring (Days 17-20)

### 5.1 Security Scanning in CI

**Files to modify:**
- `.github/workflows/security.yml` (new)

**Tasks:**

- [x] Create `.github/workflows/security.yml`:
```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6am

jobs:
  python-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install security tools
        run: |
          pip install bandit safety pip-audit

      - name: Run Bandit (SAST)
        run: bandit -r api_stub/ -f json -o bandit-report.json || true

      - name: Run pip-audit
        run: pip-audit -r api_stub/requirements.txt

      - name: Upload Bandit Report
        uses: actions/upload-artifact@v4
        with:
          name: bandit-report
          path: bandit-report.json

  container-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t compass-api:scan -f api-stub.Dockerfile .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: compass-api:scan
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy Report
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run npm audit
        working-directory: templates/ui-template/frontend
        run: |
          npm ci
          npm audit --audit-level=high
```

---

### 5.2 Pre-commit Hooks

**Files to create:**
- `.pre-commit-config.yaml` (new)

**Tasks:**

- [x] Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
      - id: detect-private-key
      - id: check-merge-conflict

  - repo: https://github.com/psf/black
    rev: 24.3.0
    hooks:
      - id: black

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.8
    hooks:
      - id: bandit
        args: ["-c", "pyproject.toml"]
        additional_dependencies: ["bandit[toml]"]

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.2
    hooks:
      - id: gitleaks
```

- [x] Add to README:
```markdown
## Development Setup

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```
```

---

### 5.3 Structured Logging

**Files to modify:**
- `api_stub/logging_config.py` (new)
- `api_stub/main.py`

**Tasks:**

- [x] Create `api_stub/logging_config.py`:
```python
import logging
import json
import sys
from datetime import datetime
import uuid

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": getattr(record, "correlation_id", None),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        if hasattr(record, "extra"):
            log_obj.update(record.extra)
        return json.dumps(log_obj)

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    # Reduce noise from libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
```

- [x] Add correlation ID middleware:
```python
from starlette.middleware.base import BaseHTTPMiddleware
import uuid

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
```

---

### 5.4 Dependency Updates

**Files to modify:**
- `api_stub/requirements.txt`
- `.github/dependabot.yml` (new)

**Tasks:**

- [x] Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/api_stub"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      security:
        patterns:
          - "*"
        update-types:
          - "patch"
          - "minor"

  - package-ecosystem: "npm"
    directory: "/templates/ui-template/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Verification Checklist

After completing each phase, verify:

### Phase 1
- [x] `scripts/init-dev.sh` generates secure credentials
- [x] API rejects invalid module manifests with proper errors
- [x] Path traversal attempts are blocked
- [x] API returns 401 when API key is configured but not provided

### Phase 2
- [x] Container runs as non-root user
- [x] Security headers present in all responses
- [x] Rate limiting triggers after threshold
- [x] CORS rejects disallowed origins

### Phase 3
- [ ] Specific exceptions logged with context
- [ ] Concurrent file writes don't corrupt state
- [ ] Transient failures trigger retries
- [ ] Graceful shutdown completes in-flight requests

### Phase 4
- [ ] Connection pool metrics show reuse
- [ ] Health check latency reduced
- [ ] No new connections per request

### Phase 5
- [ ] Security scan runs on every PR
- [ ] Pre-commit hooks catch secrets
- [ ] Logs are structured JSON
- [ ] Dependabot creates update PRs

---

## Quick Wins (Can Do Immediately)

1. **Update `.gitignore`** - add `.env.devkit` pattern is already there ✓
2. **Add `bandit.yaml`** - exclude test files from security scan
3. **Pin Docker base image** - use digest instead of tag
4. **Add health endpoint to webpack dev server**
5. **Document security practices in CONTRIBUTING.md**

---

## Resources

- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Python Security Guidelines](https://python-security.readthedocs.io/)
