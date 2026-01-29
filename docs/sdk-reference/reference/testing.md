# Testing Reference

Testing utilities for local module development.

## CLI Testing Commands

```bash
# Test module with default input from manifest
hla-compass test

# Test with custom input file
hla-compass test --input examples/sample_input.json

# Development mode (rebuild on change)
hla-compass dev --payload examples/sample_input.json
```

## Unit Testing Pattern

```python
import pytest
from backend.main import MyModule

def test_module_success():
    """Test module with valid input."""
    module = MyModule()
    result = module.execute(
        module.Input(sequence="SIINFEKL", threshold=0.5),
        context={}
    )
    assert result["status"] == "success"

def test_module_validation():
    """Test input validation."""
    module = MyModule()
    with pytest.raises(ValueError):
        module.Input(sequence="", threshold=0.5)
```

## Integration Testing

Use `hla-compass test` to run your module in a container environment that mirrors production:

```bash
# Build and test in container
hla-compass test --input examples/sample_input.json

# Verbose output for debugging
hla-compass test --input examples/sample_input.json --verbose
```
