# HLA-Compass Developer Portal

Build scientific modules for the HLA-Compass immunopeptidomics platform.

[![PyPI version](https://img.shields.io/pypi/v/hla-compass.svg)](https://pypi.org/project/hla-compass/)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)

---

## Golden Workflow

```bash
pip install hla-compass
hla-compass auth login --env dev
hla-compass init my-module --template no-ui
cd my-module
hla-compass validate --strict
hla-compass test --input examples/sample_input.json
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0 --push
hla-compass publish --env dev --scope org --image-ref ghcr.io/your-org/my-module:1.0.0
```

**[Complete Step-by-Step Guide →](sdk-reference/guides/getting-started.md)**

---

## Documentation

| Guide | Description |
|-------|-------------|
| **[Getting Started](sdk-reference/guides/getting-started.md)** | The golden workflow |
| **[CLI Reference](sdk-reference/reference/cli.md)** | All commands and options |
| **[Data Access](sdk-reference/guides/data-access.md)** | SQL queries, storage |
| **[Publishing](sdk-reference/guides/publishing.md)** | Registry setup and CI/CD |

---

## Quick Example

```python
from pydantic import BaseModel, Field
from hla_compass import Module

class Input(BaseModel):
    sequence: str = Field(description="Peptide sequence")

class MyModule(Module):
    Input = Input

    def execute(self, input_data: Input, context):
        return self.success(results={"length": len(input_data.sequence)})
```

---

## Need Help?

- **[GitHub Issues](https://github.com/AlitheaBio/Compass-WIKI/issues)** - Bug reports
- **[CLI Reference](sdk-reference/reference/cli.md)** - Command documentation
