# Module Development

For the complete workflow, see **[Getting Started](getting-started.md)**.

---

## Module Structure

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

---

## The Module Class

```python
from pydantic import BaseModel, Field
from hla_compass import Module

class Input(BaseModel):
    sequence: str = Field(description="Peptide sequence")
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)

class MyModule(Module):
    Input = Input

    def execute(self, input_data: Input, context):
        # Your logic here
        result = self.analyze(input_data.sequence)
        return self.success(results=result)
```

---

## Key Methods

| Method | Purpose |
|--------|---------|
| `execute(input_data, context)` | Main entry point |
| `self.success(results=..., summary=...)` | Return success |
| `self.data.sql.query(sql, params=[])` | Query database |
| `self.storage.save_json(path, data)` | Save output file |
| `self.logger.info(msg)` | Log information |

---

## UI Development

For UI modules:

```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build → dist/
cd ..
hla-compass serve --port 8080  # Preview
```

The bundle must export `ModuleUI` as UMD global.

---

## Next Steps

- [Getting Started](getting-started.md) - Complete workflow
- [Data Access](data-access.md) - SQL and storage
- [Publishing](publishing.md) - Registry and CI/CD
