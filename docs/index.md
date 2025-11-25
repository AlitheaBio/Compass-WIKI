# HLA-Compass Developer Portal

Build scientific modules for the HLA-Compass immunopeptidomics platform.

[![PyPI version](https://img.shields.io/pypi/v/hla-compass.svg)](https://pypi.org/project/hla-compass/)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

---

## Get Started in 5 Minutes

```bash
pip install hla-compass
hla-compass auth login
hla-compass init my-module --interactive
cd my-module && hla-compass dev
```

**[Read the full Quickstart Guide](quickstart.md)**

---

## Documentation

| Guide | Description |
|-------|-------------|
| **[Quickstart](quickstart.md)** | Zero to working module in 5 minutes |
| **[Data Access](sdk-reference/guides/data-access.md)** | SQL queries, storage, working with large files |
| **[Testing](sdk-reference/guides/testing.md)** | Unit tests, mocking, local development |
| **[Publishing](sdk-reference/guides/publishing.md)** | Build, version, and publish your module |
| **[Authentication](sdk-reference/guides/authentication.md)** | SSO login, API keys, organization access |

## Reference

| Reference | Description |
|-----------|-------------|
| **[CLI Commands](sdk-reference/reference/cli.md)** | Full command-line reference |
| **[Module API](sdk-reference/reference/module.md)** | `Module` class, context, helpers |
| **[Data API](sdk-reference/reference/data.md)** | `DataClient`, SQL, storage |
| **[LLM Context](llm-context.md)** | Copy-paste patterns for AI assistants |

## Examples

| Example | Description |
|---------|-------------|
| **[Golden No-UI](https://github.com/AlitheaBio/Compass-WIKI/tree/main/examples/modules/golden_no_ui)** | Backend-only reference module |
| **[Golden With-UI](https://github.com/AlitheaBio/Compass-WIKI/tree/main/examples/modules/golden_with_ui)** | Full-stack module with React frontend |

---

## Key Concepts

### Pydantic-First Development

Define your inputs with Pydantic models. The manifest is auto-generated:

```python
from pydantic import BaseModel, Field
from hla_compass import Module

class Input(BaseModel):
    sequence: str = Field(description="Peptide sequence")
    threshold: float = Field(default=0.5, ge=0, le=1)

class MyModule(Module):
    Input = Input  # This generates your manifest schema
    
    def execute(self, input_data: Input, context):
        # input_data is validated and typed!
        return self.success(results={"length": len(input_data.sequence)})
```

### Secure Data Access

Query the platform database with automatic Row-Level Security:

```python
result = self.data.sql.query(
    "SELECT * FROM peptides WHERE length >= %s",
    params=[8]
)
```

### Local Development

Run locally with Docker, connecting to platform APIs:

```bash
hla-compass dev
```

---

## Need Help?

- **[GitHub Issues](https://github.com/AlitheaBio/Compass-WIKI/issues)** - Bug reports and feature requests
- **[Examples Repository](https://github.com/AlitheaBio/Compass-WIKI/tree/main/examples)** - Working code samples
