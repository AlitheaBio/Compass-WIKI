# Publishing

Once your module is tested, you can publish it to the HLA-Compass platform using the container-based workflow.

## Prerequisites

- Authenticated via `hla-compass auth login --env dev|staging|prod`
- Docker Desktop running
- `manifest.json` version is bumped (modules are immutable)
- Organization registry configured (contact your platform admin)

## Workflow Overview

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Build       │      │  Push to     │      │  Register    │
│  Container   │─────▶│  GHCR        │─────▶│  with        │
│  Image       │      │              │      │  Platform    │
└──────────────┘      └──────────────┘      └──────────────┘
```

HLA-Compass uses a **container-first** workflow:

1. Build your module as a Docker image
2. Push to an approved container registry (GHCR recommended)
3. Register the module with the platform

## Quick Start

```bash
# Build the container image
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0

# Push to registry (requires docker login)
docker push ghcr.io/your-org/my-module:1.0.0

# Register with platform
hla-compass publish --env dev
```

## Step-by-Step

### 1. Build Your Module

```bash
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0
```

This creates a Docker image with:
- Your module code (`backend/`)
- Dependencies from `requirements.txt`
- The HLA-Compass runtime
- Your `manifest.json`

### 2. Push to Container Registry

We recommend **GitHub Container Registry (GHCR)** for most use cases:

```bash
# Login to GHCR (first time only)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Push your image
docker push ghcr.io/your-org/my-module:1.0.0
```

**Supported Registries:**

| Registry | Use Case | Setup |
|----------|----------|-------|
| **GHCR** (recommended) | Organization modules | `docker login ghcr.io` |
| **ECR** | AWS-integrated workflows | `aws ecr get-login-password` |
| **Docker Hub** | Public modules | `docker login` |

### 3. Register with Platform

```bash
hla-compass publish --env dev
```

The CLI will:
1. Validate your manifest
2. Sign the module manifest (recommended; requires signing keys)
3. Register the module version with the platform catalog

**Options:**

```bash
# Specify environment
hla-compass publish --env dev|staging|prod

# Specify scope (approval workflow)
hla-compass publish --scope org|public

# Generate signing keys automatically (first publish)
hla-compass publish --generate-keys

# Specify image explicitly
hla-compass publish --image-ref ghcr.io/your-org/my-module:1.0.0
```

## Registry Configuration

Your organization must have approved registries configured before publishing. Contact your platform administrator to:

1. Add your container registry namespace to the allowlist
2. Configure pull credentials (for private registries)

**Example allowlist entries:**
- `ghcr.io/your-org/*` - All images under your org
- `ghcr.io/your-org/hla-modules/*` - Specific namespace

## Scope

| Scope | Description |
|-------|-------------|
| `org` | Auto-approved; available to your organization |
| `public` | Requires approval before other organizations can use it |

## Version Management

Modules are **immutable** - once published, a version cannot be changed. To update:

1. Bump the version in `manifest.json`
2. Build with new tag: `hla-compass build --tag ghcr.io/org/module:1.0.1`
3. Push and publish

## Troubleshooting

### "Registry not in allowlist"

Your organization's registry configuration doesn't include the image namespace. Contact your platform admin.

### "Image not found" or "Forbidden"

Ensure:
1. The image was pushed successfully: `docker manifest inspect ghcr.io/your-org/module:tag`
2. You're logged into the registry: `docker login ghcr.io`
3. If pushing to GHCR, ensure your token has `write:packages` scope.

### "Module publish requires developer access"

Your platform account needs the `developer` role. Contact your organization admin.

## Next Steps

- [Testing](testing.md) - Test your module before publishing
- [Authentication](authentication.md) - SSO and API keys
- [Data Access](data-access.md) - Database and storage patterns
