# CLI Reference

## `hla-compass`

Main entry point for the HLA-Compass SDK CLI.

```bash
hla-compass [OPTIONS] COMMAND [ARGS]...
```

**Global Options:**

- `--version`: Show the version and exit
- `--verbose`: Enable verbose logging
- `--help`: Show help and exit

---

## Authentication

### `auth login`

Login to the HLA-Compass platform via browser SSO.

```bash
hla-compass auth login --env dev
```

**Options:**

- `--env dev|staging|prod`: Target environment
- `--email EMAIL`: Email address for non-browser login
- `--password PASSWORD`: Password (discouraged: leaks into shell history)
- `--password-stdin`: Read password from stdin (recommended for automation)

### `auth logout`

Clear stored credentials.

```bash
hla-compass auth logout
```

### `auth status`

Show current authentication status.

```bash
hla-compass auth status
```

### `auth use-org`

Select a default organization for operations.

```bash
hla-compass auth use-org <org-id>
```

**Options:**

- `--env dev|staging|prod`: Target environment (defaults to current)

---

## Module Development

### `init`

Create a new module from a template.

```bash
hla-compass init <name> [options]
```

**Options:**

- `--template ui|no-ui`: Module template
- `--yes`: Non-interactive mode (accept defaults)
- `--verbose`: Enable verbose logging

**Example:**

```bash
hla-compass init my-analysis --template ui
```

### `validate`

Validate module manifest and project structure.

```bash
hla-compass validate [options]
```

**Options:**

- `--manifest FILE`: Path to manifest file (defaults to `manifest.json`)
- `--format text|json`: Output format
- `--strict`: Fail on warnings
- `--verbose`: Enable verbose logging

### `dev`

Run the module locally in a development loop. Builds the Docker image and re-runs on Enter.

```bash
hla-compass dev [options]
```

**Options:**

- `--mode MODE`: Run mode
- `--image-tag TAG`: Override image tag
- `--payload FILE`: Path to input payload JSON file
- `--platform PLATFORM`: Docker build platform (default: `linux/amd64`)
- `--sdk-path PATH`: Use local SDK path (development only)
- `--verbose`: Enable verbose logging

### `test`

Test module execution locally using Docker.

```bash
hla-compass test [options]
```

**Options:**

- `--input FILE`: Input JSON file
- `--output FILE`: Write output JSON to a file
- `--json`: Output as JSON
- `--platform PLATFORM`: Docker build platform (default: `linux/amd64`)
- `--sdk-path PATH`: Use local SDK path (development only)
- `--verbose`: Enable verbose logging

### `serve`

Serve the module UI locally for development.

```bash
hla-compass serve [options]
```

**Options:**

- `--port PORT`: Port to bind (default: `8080`)
- `--platform PLATFORM`: Docker build platform (default: `linux/amd64`)
- `--sdk-path PATH`: Use local SDK path (development only)
- `--verbose`: Enable verbose logging

### `run`

Run a remote module execution on the platform.

```bash
hla-compass run <module-id> [options]
```

**Options:**

- `--env dev|staging|prod`: Target environment
- `--parameters FILE`: JSON file with module parameters
- `--mode MODE`: Run mode (default: `interactive`)
- `--compute-profile PROFILE`: Compute profile override
- `--version VERSION`: Module version override
- `--verbose`: Enable verbose logging

---

## Build & Publish

### `build`

Build the module Docker image.

```bash
hla-compass build [options]
```

**Options:**

- `--tag TAG`: Docker image tag (e.g., `ghcr.io/org/module:1.0.0`)
- `--registry PREFIX`: Registry prefix
- `--push`: Push image after build
- `--platform PLATFORM`: Docker build platform (default: `linux/amd64`)
- `--sdk-path PATH`: Use local SDK path (development only)
- `--verbose`: Enable verbose logging

**Example:**

```bash
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0 --push
```

### `publish`

Register a built module with the platform.

```bash
hla-compass publish [options]
```

**Options:**

- `--env dev|staging|prod`: Target environment (required)
- `--image-ref IMAGE`: Image reference (if omitted, builds and pushes automatically)
- `--registry REGISTRY`: Registry override
- `--scope org|public`: Module scope (`org` is auto-approved; `public` requires approval)
- `--platform PLATFORM`: Docker build platform (default: `linux/amd64`)
- `--generate-keys`: Auto-generate signing keys if missing
- `--dry-run`: Validate and show what would be published without registering
- `--sdk-path PATH`: Use local SDK path (development only)
- `--verbose`: Enable verbose logging

**Example workflow:**

```bash
# Build and push to GHCR
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0 --push

# Register with platform
hla-compass publish --env dev --scope org
```

### `publish-status`

Check module publish intake status.

```bash
hla-compass publish-status <publish-id> [options]
```

**Options:**

- `--env dev|staging|prod`: Target environment
- `--watch`: Poll until the publish job completes
- `--timeout SECONDS`: Max wait time when `--watch` is set (default: 900)
- `--interval SECONDS`: Poll interval when `--watch` is set (default: 10)
- `--verbose`: Enable verbose logging

---

## Key Management

### `keys init`

Generate a new RSA key pair for signing manifests.

```bash
hla-compass keys init [options]
```

**Options:**

- `--force`: Overwrite existing keys

### `keys show`

Show the public key (base64 DER) for distribution.

```bash
hla-compass keys show
```

---

## Next Steps

- [Getting Started](../guides/getting-started.md) - Step-by-step workflow
- [Publishing](../guides/publishing.md) - Registry and deployment guide
- [CI/CD Recipes](../guides/ci-cd.md) - Automate CLI commands in pipelines
