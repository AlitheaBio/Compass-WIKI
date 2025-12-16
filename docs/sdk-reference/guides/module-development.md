# Module Development

Modules are the building blocks of the HLA-Compass platform. They encapsulate scientific logic (Python) and optional user interfaces (React) into versioned, reproducible containers.

## Creating a Module

Use the `init` command to scaffold a new module:

```bash
hla-compass init my-module --interactive
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
from hla_compass import Module

class MyAnalyzer(Module):
    def execute(self, input_data, context):
        # Access inputs
        sequence = input_data.get("sequence")
        
        # Access data
        # OLD: peptides = self.peptides.search(sequence=sequence)
        # NEW: Use scoped SQL access
        result = self.data.sql.query(
            "SELECT sequence, mass FROM peptides WHERE sequence = %s",
            params=[sequence]
        )
        peptides = result["data"]
        
        # Return results
        return self.success(results=peptides)

if __name__ == "__main__":
    MyAnalyzer().serve()
```

### `serve()` vs `run()`

*   **`serve()`**: Starts a web server (FastAPI). Required for UI modules and local development.
*   **`run()`**: Executes logic once. Used internally by the platform for batch jobs.

## Manifest Synchronization

The SDK can automatically update your `manifest.json` based on your code.

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

The platform supports two execution modes using the *same* module image:

1.  **Interactive (Session):** Runs `serve()`. The container stays alive, serving the UI and responding to API requests.
2.  **Batch (Job):** Runs the logic once and exits. Optimized for high-throughput pipelines.

Your module supports both automatically if you use the standard `Module` class.
