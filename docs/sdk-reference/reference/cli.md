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

* `--tag TAG`: Image tag (e.g., `my-module:1.0.0`)
* `--push`: Push to registry after build

### `publish`

Publish module to the platform (builds, signs, and registers).

```bash
hla-compass publish --env ENV --image-ref IMAGE
```

**Example:**

```bash
hla-compass publish --env dev --image-ref my-module:1.0.0
```

---

## Data Commands

### `data tables`

List available tables in a catalog.

```bash
hla-compass data tables [--catalog NAME]
```

**Options:**

* `--catalog`: Catalog name (default: `immunopeptidomics`)

### `data schema`

Show database schema (tables, columns, types).

```bash
hla-compass data schema [options]
```

**Options:**

* `--catalog`: Catalog name (default: `immunopeptidomics`)
* `--table, -t`: Specific table to describe
* `--format text|json`: Output format (default: `text`)

**Examples:**

```bash
# Show all tables
hla-compass data schema

# Describe specific table
hla-compass data schema --table peptides

# JSON output (useful for LLM context)
hla-compass data schema --format json
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
Docker: ✓ Available
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
