# CLI Reference

## `hla-compass`

Main entry point for the SDK CLI.

---

## Authentication

### `auth login`

Login to the platform via browser SSO.

```bash
hla-compass auth login --env dev
```

**Options:**

* `--env dev|staging|prod`: Target environment (optional; defaults to `dev`, or `HLA_COMPASS_ENV`/`HLA_ENV` if set)
* `--email EMAIL`: Non-browser login (discouraged for interactive use)
* `--password-stdin`: Read password from stdin (recommended for automation)

### `auth logout`

Clear stored credentials.

```bash
hla-compass auth logout
```

### `auth status`

Check current authentication status.

```bash
hla-compass auth status
```

### `auth use-org`

Switch active organization context.

```bash
hla-compass auth use-org <org-id>
```

---

## Module Development

### `init`

Create a new module from a template.

```bash
hla-compass init <name> [options]
```

**Options:**

* `--template ui|no-ui`: Module template
* `--interactive`: Run the interactive wizard
* `--compute-type docker|fargate`: Compute type (docker maps to Fargate in the platform runtime)
* `--yes`: Non-interactive mode (accept defaults)

**Example:**

```bash
hla-compass init my-analysis --interactive
```

### `dev`

Run the module locally in Docker with hot-reloading.

```bash
hla-compass dev [options]
```

**Options:**

* `--mode MODE`: Run mode (e.g., `interactive`)
* `--image-tag TAG`: Override image tag used for the dev loop
* `--payload FILE`: Path to an input payload JSON file

### `preflight`

Run quick preflight checks (schema + structure).

```bash
hla-compass preflight
```

### `validate`

Validate module manifest and structure.

```bash
hla-compass validate [--manifest manifest.json] [--format text|json] [--strict]
```

### `test`

Test module execution.

```bash
hla-compass test [options]
```

**Options:**

* `--input FILE`: Input JSON file
* `--docker`: Run inside Docker (parity with production)
* `--output FILE`: Write output JSON to a file
* `--json`: Output as JSON

---

## Build & Publish

### `build`

Build the module Docker image.

```bash
hla-compass build [options]
```

**Options:**

* `--tag TAG`: Full image tag including registry (e.g., `ghcr.io/org/module:1.0.0`)
* `--registry PREFIX`: Registry prefix override (if you want to derive tags)
* `--push`: Push after build (requires docker login)
* `--platform PLATFORM`: Target platforms (default: `linux/amd64`)
* `--no-cache`: Disable build cache
* `--local-sdk PATH`: Use a local SDK wheel (SDK development only)

**Example:**

```bash
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0
```

### `publish`

Register a built module with the platform.

```bash
hla-compass publish [options]
```

**Options:**

* `--env ENV`: Target environment (`dev`, `staging`, `prod`)
* `--image-ref IMAGE`: Image reference (auto-detected from manifest if not provided)
* `--scope org|public`: Module scope (`org` is auto-approved; `public` requires approval)
* `--platform PLATFORM`: Target platforms (default: `linux/amd64`)
* `--generate-keys`: Auto-generate signing keys if missing
* `--no-sign`: Disable signing (not recommended)

**Example workflow:**

```bash
# 1. Build the image
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0

# 2. Push to registry
docker push ghcr.io/your-org/my-module:1.0.0

# 3. Register with platform
hla-compass publish --env dev
```

> **Note:** Your organization must have the container registry namespace configured in the platform allowlist.

### `publish-status`

Check module publish intake status (and optionally watch until completion).

```bash
hla-compass publish-status --env dev --watch <publish-id>
```

### `keys`

Manage signing keys used for module publishing.

```bash
hla-compass keys init
hla-compass keys show
```

### `serve`

Serve the module UI locally.

```bash
hla-compass serve --port 8090
```

---

## Utilities

### `doctor`

Check environment configuration and dependencies.

```bash
hla-compass doctor
```

**Output example:**

```text
HLA-Compass SDK v2.0.0
Python: 3.11.0
Docker: ✓ Available (Daemon running)
Node:   ✓ Available
Git:    ✓ Available

Doctor check complete
```

### `list`

List published modules.

```bash
hla-compass list [--env ENV]
```

### `completions`

Generate shell completion script for tab-completion.

```bash
hla-compass completions SHELL
```

**Arguments:**

* `SHELL`: One of `bash`, `zsh`, or `fish`

**Installation:**

```bash
# Bash
hla-compass completions bash >> ~/.bashrc
source ~/.bashrc

# Zsh
hla-compass completions zsh >> ~/.zshrc
source ~/.zshrc

# Fish
hla-compass completions fish > ~/.config/fish/completions/hla-compass.fish
```
