# Quickstart

This page has been consolidated into the **[Getting Started Guide](sdk-reference/guides/getting-started.md)**.

## Quick Commands

```bash
# Install
pip install hla-compass

# Login
hla-compass auth login --env dev

# Create module
hla-compass init my-module --template no-ui
cd my-module

# Validate & Test
hla-compass validate --strict
hla-compass test --input examples/sample_input.json

# Build & Push
hla-compass build --tag ghcr.io/your-org/my-module:1.0.0 --push

# Publish
hla-compass publish --env dev --scope org --image-ref ghcr.io/your-org/my-module:1.0.0
```

**[Full Guide →](sdk-reference/guides/getting-started.md)**
