# Module Development

Modules are the building blocks of the HLA-Compass platform. They encapsulate scientific logic (Python) and optional user interfaces (React) into versioned, reproducible containers.

## Creating a Module

Use the `init` command to scaffold a new module:

```bash
hla-compass init my-module --template ui
```

### Templates

*   **No-UI**: Backend-only module. Best for batch analysis, data transformation, or pipelines.
*   **UI**: Full-stack module. Includes a React frontend that runs alongside your Python code.

## Directory Structure

```text
my-module/
├── manifest.json        # Module metadata (name, inputs, outputs)
├── backend/
│   ├── main.py          # Entry point (Module class)
│   └── requirements.txt # Python dependencies
├── frontend/            # (UI modules only)
│   ├── index.tsx        # UI entrypoint (exports ModuleUI)
│   ├── webpack.config.js
│   ├── package.json
│   └── src/             # Shared UI helpers (optional)
└── examples/
    └── sample_input.json # Test payload
```

## The `Module` Class

Your logic lives in `backend/main.py`. Inherit from `hla_compass.Module` and implement `execute()`.

```python
from pydantic import BaseModel, Field
from hla_compass import Module

class Input(BaseModel):
    sequence: str = Field(..., description="Peptide sequence")

class MyAnalyzer(Module):
    Input = Input

    def execute(self, input_data: Input, context):
        # Access inputs (typed)
        sequence = input_data.sequence

        # Access data via scoped SQL
        result = self.data.sql.query(
            "SELECT sequence, mass FROM peptides WHERE sequence = %s",
            params=[sequence]
        )
        peptides = result["data"]

        # Return results (or return raw data and let the SDK summarize)
        return self.success(results=peptides)
```

### `serve()` vs `run()`

*   **`serve()`**: Starts a FastAPI server with `/execute` for interactive/session runs. If you call this directly, add `fastapi`, `uvicorn`, and `python-multipart` to your backend requirements. In non-local environments, `/execute` requires `HLA_COMPASS_EXECUTE_TOKEN` (send `X-HLA-Execute-Token` or `Authorization: Bearer <token>`). For local dev, the SDK allows unauthenticated calls unless you override with `HLA_COMPASS_ENV`.
*   **`run()`**: Executes logic once. Used by the `module-runner` entrypoint for async/batch jobs.

For local UI preview, use the CLI: `hla-compass serve` (runs the container helper) or `npm run dev` inside `frontend/` for live UI iteration.

## Manifest Synchronization

The SDK can update your `manifest.json` when you call `sync_manifest()` locally.

```python
# In your code
class Inputs(BaseModel):
    sequence: str
    threshold: float = 0.5

class MyModule(Module):
    Input = Inputs
    # ...
```

Run `MyModule().sync_manifest()` locally (Python API) to update the `manifest.json` `inputs` schema.

## Hybrid Runtime

The platform supports multiple execution modes using the *same* module image (controlled by `HLA_COMPASS_RUN_MODE`):

1.  **Interactive (Session):** Runs `serve()`. The container stays alive, serving the UI and responding to API requests (set `HLA_COMPASS_RUN_MODE=serve` or `interactive`).
2.  **Batch (Job):** Runs the logic once and exits (default `HLA_COMPASS_RUN_MODE=async`). Optimized for high-throughput pipelines.

Your module supports both automatically if you use the standard `Module` class.
