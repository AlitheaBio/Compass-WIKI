# CLI Reference

## `hla-compass`

Main entry point for the SDK CLI.

---

## Authentication

### `auth login`

Login to the platform via browser SSO.

```bash
hla-compass auth login
```

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

* `--template ui|no-ui`: Template type (default: prompted)
* `--interactive`: Run the interactive wizard

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

* `--verbose`: Show detailed logs

### `preflight`

Validate module and sync manifest from Pydantic Input model.

```bash
hla-compass preflight
```

### `validate`

Validate module manifest and structure.

```bash
hla-compass validate [--json]
```

### `test`

Test module execution.

```bash
hla-compass test [options]
```

**Options:**

* `--input FILE`: Input JSON file
* `--local`: Run locally without API
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
* `--push`: Push to registry after build (requires docker login)

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
* `--visibility LEVEL`: Module visibility (`private`, `org`, `public`)

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
