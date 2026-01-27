# Module Developer Handbook

Detailed reference for module development. For the step-by-step workflow, see **[Getting Started](../getting-started.md)**.

---

## Module Templates

### No-UI (Backend Only)

```text
my-module/
├── manifest.json
├── backend/
│   ├── main.py
│   └── requirements.txt
└── examples/
    └── sample_input.json
```

Best for: batch processing, data pipelines, API integrations.

### UI (Full-Stack)

```text
my-module/
├── manifest.json
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── index.tsx
│   ├── webpack.config.js
│   ├── package.json
│   └── dist/           # npm run build output
└── examples/
```

Best for: interactive tools, data exploration, visual results.

---

## Backend Contract

Implement a `hla_compass.Module` subclass:

```python
from pydantic import BaseModel, Field
from hla_compass import Module

class Input(BaseModel):
    sequence: str = Field(..., description="Peptide sequence")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)

class MyModule(Module):
    Input = Input

    def execute(self, input_data: Input, context):
        # Your logic here
        result = analyze(input_data.sequence)
        return self.success(results=result)
```

### Key Methods

| Method | Purpose |
|--------|---------|
| `execute(input_data, context)` | Main entry point |
| `self.success(results=..., summary=...)` | Return success |
| `self.error(message, details=...)` | Return error |
| `self.data.sql.query(sql, params=[])` | Query database |
| `self.storage.save_json(path, data)` | Save output file |
| `self.logger.info(msg)` | Log information |

---

## UI Contract

The frontend bundle must:

1. Build to `frontend/dist/bundle.js`
2. Export `ModuleUI` as UMD global
3. Accept `{ onSubmit, onComplete, results }` props

The template's `webpack.config.js` handles this automatically.

---

## CLI Commands

### Development

```bash
hla-compass validate --strict          # Validate module
hla-compass test --input <file>        # Test in container
hla-compass dev --payload <file>       # Dev loop
hla-compass serve --port 8080          # Serve UI locally
```

### Publishing

```bash
hla-compass build --tag <tag> --push   # Build + push image
hla-compass publish --env dev --scope org --image-ref <tag>
hla-compass publish-status --env dev --watch <id>
```

### Keys

```bash
hla-compass keys init                  # Generate keys
hla-compass keys show                  # Show public key
```

---

## Version Management

Modules are **immutable**. To update:

1. Bump `version` in `manifest.json`
2. Build with new tag
3. Publish new version

---

## Registry Setup

Your organization must approve container registry namespaces before publishing.

**To request access:**
1. Contact your org admin
2. Provide your namespace: `ghcr.io/your-org/*`

**Error: REGISTRY_UNAUTHORIZED**
→ Your namespace is not in the allowlist.

---

## CI/CD

See [CI/CD Recipes](ci_cd/ci_cd_for_modules.md) for GitHub Actions workflows.

---

## Support

- Developer onboarding: integrations@alithea.bio
- Registry / infrastructure: platform-infra@alithea.bio
- Security: security@alithea.bio
