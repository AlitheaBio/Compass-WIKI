# Testing

Reliable modules require robust testing. The SDK provides multiple testing approaches.

## Container Test

The primary way to test your module. Builds your module container and runs the test, ensuring your `Dockerfile`, `requirements.txt`, and system dependencies are correct.

```bash
hla-compass test --input examples/sample_input.json
```

*   **Pros:** High fidelity; matches production environment.
*   **Cons:** Requires Docker; slower than local Python tests.

**Additional options:**

```bash
# Output results to a file
hla-compass test --input examples/sample_input.json --output results.json

# JSON output format
hla-compass test --input examples/sample_input.json --json
```

## Dev Loop

Best for UI preview in the real container. Builds the image and runs it in a loop (press Enter to re-run). Re-run `hla-compass dev` to pick up code changes.

```bash
hla-compass dev
```

*   **Pros:** Close to production behavior, full UI interaction.
*   **Cons:** Rebuild required to pick up code changes.

For live UI iteration, run `npm run dev` inside `frontend/` (Webpack dev server), and use `hla-compass serve` to preview the built bundle.

## Unit Testing

You can also use standard `pytest`.

```bash
cd backend
pytest
```

The SDK provides `MockContext` and `MockAPI` to help you test without connecting to the real platform.

### Mocking Data Access

Since modules use the generic `DataClient`, you can easily mock SQL queries and API responses:

```python
from hla_compass.testing import ModuleTester, MockContext

def test_with_mock_data():
    # 1. Setup Mock Context
    context = MockContext.create()

    # 2. Register a mock response for a SQL query
    # Matches any POST request to a path containing "query"
    context["api"].add_response(
        method="POST",
        path_pattern="query",
        response={
            "columns": ["sequence", "mass"],
            "data": [
                {"sequence": "MOCKED_SEQ", "mass": 1000.0}
            ],
            "count": 1
        }
    )

    # 3. Run Module
    tester = ModuleTester()
    # The module will receive our mock data when it calls self.data.sql.query()
    result = tester.test_local("backend/main.py", {"input": "val"}, context)

    assert result["status"] == "success"
    assert result["results"][0]["sequence"] == "MOCKED_SEQ"
```

### Additional helpers

* `ModuleTester.quickstart(...)` runs a module class using defaults derived from the manifest.
* `ModuleTester.create_test_suite(...)` executes multiple cases and summarizes pass/fail counts.
* `ModuleTester.benchmark(...)` captures timing stats for repeated runs.
