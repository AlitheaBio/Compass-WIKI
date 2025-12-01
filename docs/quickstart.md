# Quickstart: Your First Module in 5 Minutes

This guide gets you from zero to a working module as fast as possible.

## Prerequisites

- Python 3.9+ 
- Docker Desktop running
- Platform account (sign up at [compass.alithea.bio](https://compass.alithea.bio))

## 1. Install & Login

```bash
pip install hla-compass
hla-compass auth login
```

A browser window opens for authentication. Once complete, you're ready to build.

## 2. Create a Module

```bash
hla-compass init my-analysis --interactive
cd my-analysis
```

> **Note:** Module names must use **kebab-case** (lowercase alphanumeric with hyphens, e.g., `my-analysis`). Underscores (`my_analysis`) are not allowed.

The wizard asks a few questions and scaffolds your project.

## 3. Write Your Logic

Open `backend/main.py`. Here's the simplest possible module:

```python
from pydantic import BaseModel, Field
from hla_compass import Module

class Input(BaseModel):
    """Define your inputs here. This becomes your manifest schema."""
    sequence: str = Field(description="Peptide sequence to analyze")
    min_length: int = Field(default=8, ge=1, le=50, description="Minimum length filter")

class PeptideAnalyzer(Module):
    Input = Input  # Link your Pydantic model
    
    def execute(self, input_data: Input, context):
        # input_data is already validated and typed!
        seq = input_data.sequence
        
        # Query the platform database (SQL with Row-Level Security)
        result = self.data.sql.query(
            "SELECT sequence, mass FROM peptides WHERE length >= %s LIMIT 10",
            params=[input_data.min_length]
        )
        
        return self.success(
            results={"peptides": result["data"], "query_sequence": seq},
            summary={"count": len(result["data"])}
        )
```

**Key points:**
- `Input` Pydantic model defines your inputs with validation and descriptions
- `execute()` receives a validated `Input` instance (not a dict!)
- `self.data.sql.query()` runs SQL against the platform database
- `self.success()` formats your output

## 4. Generate Manifest

Your `manifest.json` is auto-generated from your Pydantic model:

```bash
hla-compass preflight
```

This validates your module and updates `manifest.json` with the schema from your `Input` class.

## 5. Run Locally

```bash
hla-compass dev
```

This starts a local Docker container that:
- Hot-reloads your Python code
- Connects to the platform APIs (using your auth)
- Serves any UI at `http://localhost:8080`

## 6. Test It

```bash
hla-compass test --input examples/sample_input.json
```

Or programmatically:

```python
from hla_compass.testing import ModuleTester
from backend.main import PeptideAnalyzer

result = ModuleTester().quickstart(PeptideAnalyzer)
print(result)
```

## 7. Publish

When ready to share your module:

1. **Login to your registry** (e.g., GHCR):
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

2. **Build and Push**:
   ```bash
   # Build the container image
   hla-compass build --tag ghcr.io/your-org/my-analysis:1.0.0
   
   # Push to GitHub Container Registry
   docker push ghcr.io/your-org/my-analysis:1.0.0
   ```

3. **Register with the platform**:
   ```bash
   hla-compass publish --env dev
   ```

> **Note:** Your organization must have GHCR configured in the platform. See the [Publishing Guide](sdk-reference/guides/publishing.md) for details.

---

## Next Steps

| Guide | Description |
|-------|-------------|
| [Data Access](sdk-reference/guides/data-access.md) | SQL queries, storage, working with large files |
| [Testing](sdk-reference/guides/testing.md) | Unit tests, mocking, CI/CD integration |
| [UI Modules](sdk-reference/guides/module-development.md) | Adding a React frontend |
| [Publishing](sdk-reference/guides/publishing.md) | Versioning, pricing, permissions |

---

## Common Patterns

### Access Context Information

```python
def execute(self, input_data: Input, context):
    # Available context properties
    run_id = self.run_id
    org_id = self.organization_id
    user_id = self.user_id
    env = self.environment  # "dev", "staging", "prod"
```

### Save Output Files

```python
def execute(self, input_data: Input, context):
    results = self.compute_something()
    
    # Save as JSON
    self.storage.save_json("results/output.json", results)
    
    # Save DataFrame as CSV
    import pandas as pd
    df = pd.DataFrame(results)
    self.storage.save_csv("results/data.csv", df)
    
    return self.success(results=results)
```

### Handle Errors Gracefully

```python
from hla_compass import Module, ValidationError, ModuleError

class MyModule(Module):
    def execute(self, input_data, context):
        if not input_data.sequence:
            raise ValidationError("Sequence cannot be empty")
        
        try:
            result = self.risky_operation()
        except SomeError as e:
            raise ModuleError(f"Analysis failed: {e}")
        
        return self.success(results=result)
```
