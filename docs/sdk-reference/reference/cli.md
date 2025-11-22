# CLI Reference

## `hla-compass`

Main entry point for the SDK CLI.

### `auth`

Authentication commands.

* `login`: Login to the platform.
    * `--browser` (default): Opens system browser for SSO.
    * `--interactive`: Prompts for credentials in terminal.
* `logout`: Clear credentials.
* `status`: Check current auth status.
* `use-org`: Switch active organization context.

### `doctor`

Diagnose environment and dependencies.

```bash
hla-compass doctor
```

Output example:
```text
HLA-Compass SDK v2.0.0
Python: ✓ 3.11.0
Docker: ✓ Available
Node:   ✓ Available
Git:    ✓ Available

Doctor check complete
```

### `init`

Create a new module.

```bash
hla-compass init <name> [--template ui|no-ui] [--interactive]
```

### `dev`

Run the module in a local Docker container with hot-reloading (if UI).

```bash
hla-compass dev
```

### `test`

Run tests.

```bash
hla-compass test [--docker]
```

### `build`

Build the module container image.

```bash
hla-compass build [--tag <tag>]
```

### `publish`

Publish the module to the platform.

```bash
hla-compass publish --env dev
```
