# HLA-Compass Modules — Developer & Contribution Handbook

> **Who is this for?** Module authors, UI engineers, and platform developers contributing modules to the Module-as-App runtime.
> **When to use this doc:** Start here when you scaffold, test, publish, or operate modules (including UI bundles) and need canonical guidance on the runtime contract, workflows, credits, or CI/CD.
>
> Single, canonical guide for developing, publishing, and operating modules on HLA-Compass. This consolidates and replaces:
> - docs/MODULE_DEVELOPMENT_GUIDE.md (development deep-dive)
> - docs/MODULE_CONTRIBUTION_PLAYBOOK.md (contribution & security playbook)
> - docs/SDK_WIKI.md (CLI cheat sheet for developers/admins)

If you arrived here from one of the old docs, you are in the right place. Use the table of contents below.

---

## Table of Contents

1. Audience & Scope
2. Quick Start (5 minutes)
3. CLI Cheatsheet (Developers)
4. Development Workflow
   - Module Scaffold Layouts
   - UI Module Contract
   - Manifest Essentials
   - Runtime Context (execute(input, context))
   - Workflow Run History UX
5. Testing & Validation
6. Build, Push, Publish
7. Registry Onboarding (Org Admins)
8. Security & Intake Guardrails
9. CI/CD Template
10. Admin Tasks (Org-level)
11. Troubleshooting
12. References
13. Support

---

## 1) Audience & Scope
- Developers: build/test modules with or without UI using the Python SDK + CLI
- Verified partners and community contributors: publish via your own container registry (e.g., GHCR), mirrored by the platform
- Administrators: onboard registries, manage access, and verify security posture

All contributors use the same lifecycle:

```
scaffold → develop → test (local+docker) → build image → push to registry → publish → automated validation → enable
```

---

## 2) Quick Start (5 minutes)

```bash
# 1) Install SDK
pip install hla-compass

# 1b) Authenticate against your target environment
hla-compass auth login --env dev

# Optional: bring up the local Devkit stack (Postgres + MinIO + API stub)
hla-compass devkit up --build
hla-compass devkit status

# 2) Create module (backend only or with UI)
hla-compass init my-analyzer --template no-ui

# 3) Enter module & run quick checks
cd my-analyzer
hla-compass validate-module --with-devkit
hla-compass test --input examples/sample_input.json

# 4) Iterate in Docker parity mode
hla-compass dev

# 5) Serve the baked container (UI + API)
hla-compass serve --port 8090
```

---

## 3) CLI Cheatsheet (Developers)

- Setup
  - `hla-compass doctor` — diagnose environment issues
  - `hla-compass configure --env <env>` — generate signing keys and set defaults
  - `hla-compass auth login --env <env>` — authenticate; see also `auth status`, `auth logout`
- Create & Develop
  - `hla-compass init <name> [--template ui|no-ui]` — scaffold from template
  - `hla-compass dev` — run in Docker with hot-reload
  - `hla-compass serve --port 8090` — run baked image, serve UI and /api
  - `hla-compass validate-module [--strict] [--with-devkit]` — schema + structure + security + OpenAPI checks
  - `hla-compass validate` / `preflight` — lighter schema/entrypoint checks (legacy)
  - `hla-compass test [--docker] --input examples/sample_input.json` — run tests
- Build & Publish
  - `hla-compass build --tag <registry>/<name>:<version>` — build Docker image
  - `hla-compass publish --env <env> [--registry ...] [--ui-bucket ...] [--dry-run]` — build/push, upload UI bundle, sign, register
  - `hla-compass list --env <env>` — list deployed modules
- Context helpers
  - `hla-compass context-template --output dist/context.json`
  - `hla-compass dev --context dist/context.json`
- Local platform slice
  - `hla-compass devkit up|status|logs|down` — docker-compose Postgres + MinIO + API stub

Removed legacy commands: `sign` and `deploy` (signing happens during `publish`).

---

## 4) Development Workflow

1. Scaffold
   ```bash
   hla-compass init my-module --template ui   # or no-ui
   cd my-module
   ```
2. Iterate
   - Backend: edit `backend/main.py` (implement your `Module` subclass)
   - UI (optional): edit `frontend/index.tsx`; `window.ModuleUI` must mount from `bundle.js`
3. Feedback loops
   ```bash
   hla-compass dev                # fast, hot-reload in Docker
   hla-compass serve --port 8090  # baked image; serves UI + /api
   ```
4. Static checks (recommended)
   ```bash
   pip install -r backend/requirements.txt && pytest backend/tests
   npm run lint --prefix frontend && npm test --prefix frontend
   ```

Module types:
- No-UI modules (backend only) — data/analysis tasks
- With-UI modules (backend + frontend) — interactive visualizations; platform loads `bundle.js` and mounts `window.ModuleUI`

See UI contract specifics in docs/frontend/UI_CONTRACT_MVP.md.

### Module Scaffold Layouts

Every template ships the same core pieces; the UI template simply adds a `frontend/` workspace. Treat these as starting points—add packages/tests per your org standards.

**No-UI template**
```
my-analyzer/
├── manifest.json          # Module metadata + permissions
├── backend/
│   ├── main.py            # Your Module subclass
│   ├── requirements.txt   # Backend dependencies
│   └── tests/
├── examples/
│   └── sample_input.json
└── Dockerfile             # Production image entrypoint
```

**UI template (adds React bundle)**
```
my-visualizer/
├── manifest.json
├── backend/
├── frontend/
│   ├── src/index.tsx      # Exports ModuleUI
│   ├── package.json
│   └── vite.config.ts
├── examples/
└── Dockerfile
```

### UI Module Contract

UI bundles expose `ModuleUI` as the default export. Props reference `runId` (not `jobId`) plus the resolved input payload:

```tsx
import type { PlatformProps } from './types'

export function ModuleUI({ runId, inputData, onComplete, onError }: PlatformProps) {
  return (
    <section className="module-container">
      <h2>My Module</h2>
      <p>Run ID: {runId}</p>
      <pre>{JSON.stringify(inputData, null, 2)}</pre>
    </section>
  )
}

export default ModuleUI
```

The runtime injects convenience callbacks (`onComplete`, `onError`, `subscribe`, `emit`) so UI modules can report progress or emit custom events without polling the API.

### Manifest Essentials

The manifest is validated server-side and drives runtime/IAM selection. Minimal example:

```json
{
  "name": "my-analyzer",
  "version": "1.0.0",
  "display_name": "My Analyzer",
  "type": "no-ui",
  "execution": {
    "entrypoint": "backend.main:MyAnalyzer",
    "runtime": "python:3.11"
  },
  "inputs": {
    "sequence": { "type": "string", "required": true }
  },
  "permissions": {
    "data_access": ["peptides"],
    "network": false
  },
  "resources": {
    "cpu": "1",
    "memory": "2Gi",
    "timeout": "300s"
  }
}
```

Use `hla-compass validate-module --strict` plus the schema in `docs/api/MANIFEST_SCHEMA_V1.md` to keep manifests in sync with the control plane.

### Runtime Context (execute(input, context))

Every module receives a canonical context object alongside the validated input. The SDK wraps this payload in `self.context` (see `hla_compass.context.RuntimeContext`) so you can access strongly typed helpers:

```json
{
  "run_id": "run-123",
  "job_id": "run-123",
  "module_id": "example-module",
  "module_version": "1.2.3",
  "organization_id": "org-456",
  "user_id": "user-789",
  "roles": ["developer", "scientist"],
  "environment": "dev",
  "correlation_id": "req-abc",
  "mode": "interactive",
  "runtime_profile": "interactive-small",
  "tier": "foundational",
  "requested_at": "2025-01-15T18:04:11Z",
  "credit": {
    "reservation_id": "credit-resv-98b6",
    "estimated_act": 0.35
  }
}
```

SDK conveniences (`job_id` is provided only for backward compatibility; prefer `run_id` everywhere new code is written):

- `self.context.run_id`, `.module_id`, `.organization_id`, `.environment`, `.credit`, `.workflow` etc.
- **Workflow runs:** when your module is invoked inside a workflow, `self.context.workflow`
  exposes `workflow_id`, `workflow_run_id`, and `workflow_step_id`. The container also
  receives `HLA_COMPASS_WORKFLOW_*` environment variables plus a canonical
  `workflow-files/{workflowId}/{workflowRunId}/{stepId}/` prefix. Use
  `self.storage.save_workflow_file("output.json", step_id=self.context.workflow.workflow_step_id)`
  to persist artifacts next to the ones the platform copies automatically
  (`output.json`/`summary.json`).

### Workflow Run History UX

- The **Workflows → Run History** view (`/workflows/:workflowId/runs`) lists every
  execution for a workflow with status, timestamps, who triggered it, credit
  consumption, and a direct Step Functions link for deeper AWS debugging.
- Opening a run shows the per-step timeline: module names, module-run IDs,
  duration, artifacts (`workflow-files/...` URIs), and quick links to the module
  run history as well as CloudWatch Logs filters (the API now returns the log
  group/stream for each step).
- Selecting any two runs toggles the “Basic comparison” table so you can see
  where statuses or outputs diverged. This diff is intentionally lightweight
  today (duration + artifact URI change indicators) and will expand in later
  phases.
- The UI is read-only; if you need to re-run or drill into a module you can jump
  directly to the module-run drawer and reuse the existing actions there.

- `self.storage` is preconfigured to talk to your organization’s dedicated bucket (`hla-compass-${env}-org-<slug>-<suffix>`) and write under `files/{run_id}/…`. Every object is tagged with `{run_id,module_id,organization_id}` so infra can trace provenance. Use helpers such as `self.storage.save_json("reports/summary", data)` or `self.storage.save_workflow_file("output.json", step_id="alignment")` to land artefacts inside the standardized prefixes:
  - `files/{run_id}/…` – general inputs/outputs produced by a single run
  - `workflows/{workflowId}/…` – workflow definitions and logs
  - `workflow-files/{workflowId}/{runId}/{stepId}/…` – per-step outputs for workflow orchestration
  - `parquet/{datasetId}/…` – columnar datasets destined for data views
  - `database-views/{viewId}/…` – hydrated SQL/materialized views
  - `misc/…` – scratchpad artifacts that don’t fit the buckets above
- Saved views created in the Data Explorer are captured in `platform.data_views` (definition) and `platform.data_view_materializations` (lineage). Each refresh lands a new artifact under `database-views/{viewId}/materialization-<epoch>.parquet` (or `.csv`/`.json`) plus a manifest that records the SQL text, filters, row count, checksum, and preview rows. When a Flow binds `binding: { kind: "view", id: "<viewId>" }`, the runtime injects `views["<viewId>"].s3Uri`, `format`, `rowCount`, and `provenance`, so your module can treat the view like any other immutable dataset with auditable lineage.
- `self.db` lazily instantiates the Aurora Data API client when `DB_CLUSTER_ARN`/`DB_SECRET_ARN` are present; call `self.db.execute_readonly(...)` during module runs in ECS without extra wiring.

Logging helpers route to CloudWatch with run metadata baked in:

```python
class MyAnalyzer(Module):
    def execute(self, input_data, context):
        self.logger.info("Processing run %s", self.context.run_id)
        self.logger.debug("Input: %s", input_data)
        ...
```

Tip: generate a local template with `hla-compass context-template --output dist/example-context.json` and pass it to `hla-compass dev --context dist/example-context.json` whenever you need to seed custom metadata.

---

## 5) Testing & Validation

- `hla-compass preflight` — manifest schema, entrypoint presence, UMD hints
- `hla-compass validate-module` — schema + structure + pricing/security heuristics + OpenAPI alignment (use `--strict` before publishing)
- `hla-compass validate` — schema validation
- `hla-compass test --input examples/sample_input.json` — local run
- `hla-compass test --docker --input ...` — run inside Docker for parity

Before publishing, ensure:
- Tests pass locally and in Docker
- UI builds successfully (`npm run build` in `frontend/`)
- Manifest includes `execution.entrypoint`, `permissions`, and resource limits suited to your tier

---

## 6) Build, Push, Publish

> Need reproducible CI pipelines? See [docs/developer/ci_cd_for_modules.md](developer/ci_cd_for_modules.md) for detailed GitHub Actions + GHCR recipes.

1) Version & manifest
- Bump semantic version in `manifest.json` (e.g., `1.0.1`)
- Ensure `execution.entrypoint` matches your `Module` subclass

2) Build image (optional)
```bash
hla-compass build --tag ghcr.io/<owner>/<module>:1.0.1
```
> `hla-compass publish` automatically builds and pushes when `--image-ref` is omitted. Use `--registry` to override the default `hla-compass-<env>-modules` ECR repository.

3) Push to registry (skip when letting `publish` handle it)
- Internal teams (ECR): `$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/hla-compass-<env>-modules:<name>-<version>`
- External (GHCR): `ghcr.io/<owner>/<module>:<version>`

4) Publish to platform (builds/pushes the backend, uploads the UI, signs, and calls `/v1/modules/publish`)
```bash
# Dry run (preview)
hla-compass publish --env dev --dry-run

# Full release (auto-build + UI upload)
hla-compass publish --env dev

# Use an existing image/UI bucket
hla-compass publish --env dev --image-ref ghcr.io/<owner>/<module>:1.0.1 --ui-bucket my-ui-bucket
```
Flags of note:
- `--registry` – override the modules ECR repo when building locally.
- `--ui-bucket` / `--skip-ui-upload` – control how `frontend/` bundles are uploaded.
- `--context-template`, `dev --context` – seed local context JSONs for reproducible runs.

**Registry guardrails**

- Your organization must onboard each external namespace (GHCR/Docker Hub/ECR) via **Org Settings → Registries**. Publish requests that reference unlisted namespaces fail with `REGISTRY_UNAUTHORIZED`.
- When a registry credential is provided during onboarding, the control plane decrypts it server-side and injects it into the intake worker; client machines never send registry secrets.
- If you do not pass `--org-id`, the CLI uses your primary organization. Admin/developer roles can only publish for orgs they belong to; superusers must specify `--org-id`.

What happens during publish (Phase 2):
- `hla-compass publish` builds the Docker image (unless `--image-ref` provided), logs into the env’s ECR, and pushes `hla-compass-<env>-modules:<name>-<version>`.
- The same command builds `frontend/` and uploads `/app/ui/dist` to `s3://hla-compass-ui-<env>/modules/<name>/<version>/`.
- The CLI signs the manifest and calls `/v1/modules/publish`, which still runs intake validations (digest capture, security scan, policy checks) before activating the module.

---

## 7) Registry Onboarding

If you publish from an external registry (GHCR, Docker Hub), your organization must authorize that namespace first.

**How to onboard:**
1.  Ask your Platform Admin to navigate to **Control Tower** → **Organizations**.
2.  Open your organization's detail drawer and select the **Registries** tab.
3.  Click **Add Registry** and follow the prompts:
    -   **Provider**: Select GHCR, Docker Hub, or ECR.
    -   **Namespaces**: Add patterns like `ghcr.io/my-org/*`.
    -   **Credentials**: Provide a read-only PAT or token if the registry is private.

For detailed instructions, refer to the [Registry Management Guide](../../../wiki/guides/platform-admin/registry-management.md).

**Developer workflow:**
Once onboarded, developers simply run:
```bash
hla-compass publish --env dev --image-ref ghcr.io/my-org/module:1.0.0
```
The platform will match the image reference against the allowed patterns and use the configured credentials to mirror the image.

---

## 8) Security & Intake Guardrails

Trust tiers

| Tier | Default privileges | Review path |
|------|---------------------|-------------|
| Community | Sandbox account, limited datasets | Automated scan + human moderation |
| Verified partner | Broader API surface, network allow-list | Automated scan + fast-track review |
| Internal | Full platform APIs within declared permissions | Automated scan + policy-as-code gating |

Validation pipeline (triggered on publish)
1. Immutable digest capture
2. Mirror to internal ECR
3. Security scanning (Syft SBOM + Trivy vuln scan; hard gate on high/critical findings)
4. Manifest review (schema, entrypoint, permissions/resources sanity)
5. UI validation (`/app/ui/dist/bundle.js` exists when `type: with-ui`)
6. Policy enforcement (network allowlists, quotas, secrets detection)

Security policy:
- The central rules live in `security/vulnerability-policy.yml` with waivers tracked in `security/allowlist.toml` (Python) and `security/audit-ci.json` (Node).
- Failing severities (`HIGH`, `CRITICAL`) keep the version in `REJECTED` state and return `SECURITY_SCAN_FAILED` to the caller. Medium findings warn via CI summaries but do not block.

Local pre-checks before `hla-compass publish`:
```bash
trivy image --severity HIGH,CRITICAL YOUR_IMAGE
syft packages YOUR_IMAGE -o json > sbom.json
pip-audit -r requirements.txt
npm audit --json > audit.json
```
Review reports and request temporary waivers only with justification and expiry (≤30 days).

Signing & provenance
- `hla-compass configure` generates RSA keys used for manifest signing
- `publish` inserts signature metadata
- Optional: `cosign` attestations with OIDC for container provenance (recommended for verified partners)

---

## 9) CI/CD Template (GitHub Actions)

A reusable workflow for module repos (simplified):

```yaml
name: Module Release
on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install SDK & extras
        run: |
          pip install --upgrade pip
          pip install 'hla-compass[dev]' syft trivy
          npm install --prefix frontend
      - name: Tests
        run: |
          hla-compass test --input examples/sample_input.json
          hla-compass test --docker --input examples/sample_input.json
          npm test --prefix frontend
      - name: Build
        run: hla-compass build --tag ${{ env.IMAGE_TAG }}
        env:
          IMAGE_TAG: ${{ github.repository_owner }}/my-module:${{ github.ref_name }}
      - name: Push (GHCR or ECR)
        run: docker push ${{ env.IMAGE_TAG }}
      - name: Publish to HLA-Compass
        env:
          HLA_ACCESS_TOKEN: ${{ secrets.HLA_ACCESS_TOKEN }}
        run: hla-compass publish --env dev --image-ref ${{ env.IMAGE_TAG }}
```

Store secrets in GitHub Secrets. Adjust registry login for GHCR/ECR as needed.

---

## 10) Admin Tasks (Org-level)

- Enable programmatic access
  - Preferred: developers authenticate via CLI: `hla-compass auth login --env <env>`
  - Headless/CI: set `HLA_ACCESS_TOKEN` before invoking the SDK
- Access model
  - Organization-scoped JWT auth
  - Data access grants govern dataset visibility; module access grants control visibility and execution
- Common tasks
  - List modules for your org: `hla-compass list --env <env>`
  - Approve data access requests: see platform admin documentation
  - Verify role-based access: see tests/tests/test_modules_access.py

---

## 11) Troubleshooting

### Authentication & permissions
- `401` / expired tokens → `hla-compass auth login --env <env>` then rerun the command. `hla-compass auth status` shows active org + expiry.
- `403` on `list`/`run` → confirm the module is granted to your organization (`Org Settings → Modules`) and that your role includes developer or admin privileges.

### Build or Docker failures
- Verify Docker Desktop is running and you can `docker ps`.
- Ensure the Dockerfile exists at the repo root. Re-run `hla-compass build --tag ...` with `--no-cache` if the base image changed significantly.
- When targeting GHCR/ECR, log in first (`echo "$TOKEN" | docker login ghcr.io -u <user> --password-stdin`).

### Validation errors
- Pretty print the manifest: `python -m json.tool manifest.json`.
- Run `hla-compass validate-module --strict --with-devkit` to surface schema + policy findings locally.
- Address input schema mismatches (missing `inputs.<field>` definitions, wrong types) before publishing—the API enforces the same schema.

### Publish failures
- `REGISTRY_UNAUTHORIZED` → add the source namespace under Org Settings → Registries and supply a read credential if the image is private.
- `SECURITY_SCAN_FAILED` → run `trivy image` locally, upgrade base images (`FROM python:3.11-slim`), and reissue the publish.
- `manifest.json not found` → run commands from the module root; `hla-compass publish` walks the local tree.

### Data access denied (403 in module code)
- Confirm the org has an approved data grant (Admin UI → Data Access tab).
- Ensure the manifest declares the dataset under `permissions.data_access`—the runtime injects grants based on that list.

### UI not loading inside the platform
- `frontend/dist/bundle.js` missing → run `npm install && npm run build` inside `frontend/` before publishing.
- Confirm `ModuleUI` is the default export and references `runId` (the shell will not populate `jobId`).
- Use `hla-compass serve --port 8090` to verify the baked bundle before pushing.

### General tips
- Tail logs straight from the API: `hla-compass run ... --watch` or `GET /v1/module-runs/{id}/logs`.
- Compare local vs hosted runs by saving the context template: `hla-compass context-template --output dist/context.json` and feeding it to `hla-compass dev --context ...`.

## 12) References
- Marketplace MVP: docs/MARKETPLACE_MVP.md
- UI contract: docs/frontend/UI_CONTRACT_MVP.md
- API contract: docs/api/MODULES_PUBLISH_BY_IMAGE.md
- Manifest schema: docs/api/MANIFEST_SCHEMA_V1.md
- SDK README: sdk/python/README.md

---

## 13) Support
- Developer portal & onboarding: integrations@alithea.bio
- Infrastructure/registry issues: platform-infra@alithea.bio
- Security reviews: security@alithea.bio
- SDK bugs or feature requests: open an issue in AlitheaBio/HLA-Compass-platform

> Keep this handbook close to the code. Update it whenever SDK commands, security policies, or registry configurations change.
