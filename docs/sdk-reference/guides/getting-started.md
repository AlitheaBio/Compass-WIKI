# Getting Started

This is the **golden workflow** for developing and publishing HLA-Compass modules.

## Prerequisites

- Python 3.8+
- Docker Desktop (running)
- An HLA-Compass Platform account

---

## The Golden Workflow

```
Install SDK → Login → Init → Validate → Test → Build → Push → Publish
```

### Step 1: Install the SDK

```bash
pip install hla-compass
```

### Step 2: Authenticate

```bash
hla-compass auth login --env dev
```

Opens a browser for SSO authentication. Credentials are stored securely.

### Step 3: Create a Module

```bash
hla-compass init my-module --template no-ui
cd my-module
```

Use `--template ui` for modules with a React frontend, or `--template no-ui` for backend-only modules.

### Step 4: Validate

```bash
hla-compass validate --strict
```

Checks manifest schema, project structure, dependencies, and security.

### Step 5: Test

```bash
hla-compass test --input examples/sample_input.json
```

Builds a Docker container and runs your module with the test input.

### Step 6: Build & Push

```bash
# Build and push to GHCR (recommended)
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0 --push
```

> **Note:** You must be logged into GHCR first: `echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin`

### Step 7: Publish

```bash
hla-compass publish --env dev --scope org --image-ref ghcr.io/your-org/my-module:1.0.0
```

Registers your module with the platform. Use `--generate-keys` on first publish.

### Step 8: Verify (Optional)

```bash
hla-compass publish-status --env dev --watch <publish-id>
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `hla-compass auth login --env dev` | Authenticate with platform |
| `hla-compass auth status` | Check login status |
| `hla-compass init <name> --template ui\|no-ui` | Create new module |
| `hla-compass validate --strict` | Validate module |
| `hla-compass test --input <file>` | Test in Docker |
| `hla-compass dev` | Development loop (press Enter to re-run) |
| `hla-compass build --tag <tag> --push` | Build and push image |
| `hla-compass publish --env dev --scope org` | Register with platform |
| `hla-compass keys init` | Generate signing keys |

---

## Development Tips

### Dev Loop

For iterative development, use the dev loop:

```bash
hla-compass dev --payload examples/sample_input.json
```

Press Enter to re-run. Exit and re-run to rebuild after code changes.

### UI Modules

For UI modules, build the frontend first:

```bash
cd frontend
npm install
npm run build    # Production build → frontend/dist/
npm run dev      # Development server for live iteration
cd ..
hla-compass serve --port 8080  # Preview built bundle
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 / expired auth` | Run `hla-compass auth login --env <env>` |
| `REGISTRY_UNAUTHORIZED` | Ask org admin to add your registry namespace |
| Validation failures | Ensure `requirements.txt` uses pinned versions (`==`) |
| UI not loading | Run `npm install && npm run build` in `frontend/` |

---

## Next Steps

- [CLI Reference](../reference/cli.md) - Complete command documentation
- [Module Development](module-development.md) - In-depth guide
- [Publishing](publishing.md) - Registry setup and CI/CD
