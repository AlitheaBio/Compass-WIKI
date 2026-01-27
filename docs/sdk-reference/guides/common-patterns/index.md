# Common Patterns

Quick references that apply across module roles.

## Authentication (SSO + CI)

- Use browser SSO for local development: `hla-compass auth login --env dev`.
- For headless CI, export `HLA_ACCESS_TOKEN` or `HLA_API_KEY` and skip interactive login.
- See the [Authentication guide](../authentication.md) for credential storage details.

## Validation

- `hla-compass validate` runs schema, structure, entrypoint, UI, security, pricing, and OpenAPI checks.
- Add `--strict` to treat warnings as failures.
- Use `--format json` for machine-readable output.

## Testing

- `hla-compass test --input examples/sample_input.json` - builds and tests in Docker container.
- `hla-compass dev` - dev loop (press Enter to re-run; exit + re-run to rebuild).
