# Compass-WIKI

Documentation site for the HLA-Compass SDK.

**Live site:** [docs.alithea.bio](https://docs.alithea.bio)

## Structure

```
docs/                   # MkDocs documentation source
terraform/              # Infrastructure as Code
scripts/                # Local development scripts
```

## Local Development

```bash
# Install dependencies
pip install mkdocs-material mkdocstrings[python] hla-compass

# Serve locally with hot reload
mkdocs serve

# Build static site
mkdocs build
```

## Deployment

Documentation is automatically deployed to [docs.alithea.bio](https://docs.alithea.bio) on every push to `main`.

For manual deployment:

```bash
./scripts/deploy.sh
```

## Infrastructure

AWS infrastructure is managed with Terraform. See [terraform/README.md](terraform/README.md) for details.

## Contributing

1. Edit documentation in `docs/`
2. Preview with `mkdocs serve`
3. Submit a pull request
