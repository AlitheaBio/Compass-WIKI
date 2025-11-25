# Contributing to HLA-Compass SDK

Thank you for your interest in contributing! This guide covers how to contribute to the SDK and documentation.

## Quick Links

- [SDK Repository](https://github.com/AlitheaBio/HLA-Compass-platform/tree/main/sdk/python)
- [Documentation Repository](https://github.com/AlitheaBio/Compass-WIKI)
- [Issue Tracker](https://github.com/AlitheaBio/Compass-WIKI/issues)

## Ways to Contribute

### Report Bugs

Open an issue with:
- SDK version (`hla-compass --version`)
- Python version
- Minimal reproduction steps
- Expected vs actual behavior

### Suggest Features

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Alternative approaches considered

### Improve Documentation

Documentation lives in this repository (`Compass-WIKI`). We welcome:
- Typo fixes
- Clarifications
- New examples
- Translations

### Contribute Code

Code changes go to the main [HLA-Compass-platform](https://github.com/AlitheaBio/HLA-Compass-platform) repository.

## Development Setup

### SDK Development

```bash
# Clone the main repo
git clone https://github.com/AlitheaBio/HLA-Compass-platform.git
cd HLA-Compass-platform/sdk/python

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install in development mode with dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linting
ruff check .
```

### Documentation Development

```bash
# Clone the wiki repo
git clone https://github.com/AlitheaBio/Compass-WIKI.git
cd Compass-WIKI

# Install MkDocs
pip install mkdocs mkdocs-material mkdocstrings[python]

# Serve locally
mkdocs serve

# View at http://localhost:8000
```

## Code Style

### Python

- Use [Ruff](https://github.com/astral-sh/ruff) for linting and formatting
- Follow PEP 8
- Add type hints to all public functions
- Write docstrings in Google style

```python
def query(self, sql: str, params: list[Any] | None = None) -> dict[str, Any]:
    """Execute a SQL query against the catalog.
    
    Args:
        sql: SQL query string with %s placeholders for params
        params: List of parameter values to bind
        
    Returns:
        Dictionary with 'columns', 'data', and 'count' keys
        
    Raises:
        DataAccessError: If query execution fails
        
    Example:
        >>> result = self.data.sql.query("SELECT * FROM peptides WHERE length > %s", [8])
        >>> print(result["data"])
    """
```

### Documentation

- Use clear, concise language
- Include code examples for every feature
- Test all code examples before submitting
- Keep the [LLM Context](docs/llm-context.md) updated with new patterns

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`pytest`)
6. Ensure linting passes (`ruff check .`)
7. Commit with a clear message
8. Push to your fork
9. Open a Pull Request

### PR Title Format

```
feat(sdk): Add schema discovery API
fix(cli): Remove debug output
docs: Update quickstart guide
```

## Questions?

- Open a [Discussion](https://github.com/AlitheaBio/Compass-WIKI/discussions)
- Email: sdk@alithea.bio

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).
