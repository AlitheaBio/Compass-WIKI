# Testing

Reliable modules require robust testing. The SDK provides three layers of testing.

## 1. Local Python Test

The fastest way to test logic. Runs your code directly in your local Python environment.

```bash
hla-compass test --input examples/sample_input.json
```

*   **Pros:** Fast, easy debugger attachment.
*   **Cons:** Doesn't isolate dependencies; might work locally but fail in Docker.

## 2. Docker Test (Parity)

Builds and runs your module container. This ensures your `Dockerfile`, `requirements.txt`, and system dependencies are correct.

```bash
hla-compass test --docker --input examples/sample_input.json
```

*   **Pros:** High fidelity; matches production environment.
*   **Cons:** Slower (requires build).

## 3. Dev Server (Hot Reload)

Best for UI development. Runs the container but mounts your local code directory, so changes update instantly.

```bash
hla-compass dev
```

*   **Pros:** Instant feedback, full UI interaction.
*   **Cons:** Requires Docker.

## Unit Testing

You can also use standard `pytest`.

```bash
cd backend
pytest
```

The SDK provides `MockContext` and `MockAPI` to help you test without connecting to the real platform.

```python
from hla_compass.testing import ModuleTester, MockContext

def test_my_logic():
    tester = ModuleTester()
    result = tester.test_local("backend/main.py", {"input": "val"}, MockContext.create())
    assert result["status"] == "success"
```
