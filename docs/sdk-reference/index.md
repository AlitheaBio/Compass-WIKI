# HLA-Compass Python SDK

The SDK provides tools for building, testing, and publishing bioinformatics modules.

## Golden Workflow

```
Install → Login → Init → Validate → Test → Build → Push → Publish
```

**[Complete Guide →](guides/getting-started.md)**

## Quick Start

```bash
pip install hla-compass
hla-compass auth login --env dev
hla-compass init my-module --template no-ui
cd my-module
hla-compass dev
```

## Documentation

- **[Getting Started](guides/getting-started.md)** - Step-by-step workflow
- **[CLI Reference](reference/cli.md)** - All commands
- **[Module API](reference/module.md)** - Python API
