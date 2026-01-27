# CI/CD Recipes for Publishing Modules

> Companion to [Module developer handbook](../handbook.md). Use this guide when wiring GitHub Actions or other CI systems to build container images, push to your registry, and publish via `/v1/modules/publish`.

## 1. Prerequisites
- Python 3.8+, Docker 20.10+, and the HLA-Compass SDK (`pip install hla-compass`).
- Organization registry entries created under **Org Settings → Registries** (provider, namespace glob, optional read credential). Requests referencing namespaces outside that allow-list fail with `REGISTRY_UNAUTHORIZED`.
- CI secret (`HLA_ACCESS_TOKEN`) scoped to the intended environment. Headless flows export it as `HLA_ACCESS_TOKEN` before running `hla-compass` commands.
- Optional: GitHub Container Registry (GHCR) PAT or machine-user token with `packages:write` (push) and `packages:read` (to test pulls locally).

## 2. Flow A — CI Builds → GHCR (Recommended)
1. Scaffold module repository and commit templates (`hla-compass init`).
2. Add the workflow below to `.github/workflows/module-release.yml`.
3. Tag a release (`git tag v1.0.0 && git push origin v1.0.0`).
4. Workflow builds the module, pushes to GHCR, and (optionally) publishes to HLA-Compass once manual validation passes.

```yaml
name: Module – Build & Push (GHCR)

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      publish:
        description: Publish to HLA-Compass after pushing the image
        required: false
        default: 'false'
        type: choice
        options: ['false', 'true']

permissions:
  contents: read
  packages: write

jobs:
  build-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install SDK
        run: |
          python -m pip install --upgrade pip
          pip install hla-compass

      - name: Validate module
        run: hla-compass validate --strict

      - name: Derive version and image ref
        id: meta
        shell: bash
        run: |
          VERSION="${GITHUB_REF_NAME#v}"
          OWNER="${GITHUB_REPOSITORY_OWNER,,}"
          IMAGE="my-simple-ui-module"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          echo "image=ghcr.io/${OWNER}/${IMAGE}:${VERSION}" >> "$GITHUB_OUTPUT"

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build image with SDK
        run: hla-compass build --tag "${{ steps.meta.outputs.image }}"

      - name: Push image
        run: docker push "${{ steps.meta.outputs.image }}"

      - name: Publish to HLA-Compass (optional)
        if: ${{ inputs.publish == 'true' }}
        env:
          HLA_ACCESS_TOKEN: ${{ secrets.HLA_ACCESS_TOKEN }}
        run: |
          hla-compass publish --env dev --scope org --generate-keys --image-ref "${{ steps.meta.outputs.image }}"
```

Tips:
- Lowercase image names to satisfy GHCR requirements.
- Use workflow inputs to control whether CI automatically publishes or stops after pushing to GHCR.
- For monorepos, compute `IMAGE` dynamically (e.g., from directory name) to avoid collisions.

## 3. Flow B — Local Build → GHCR → Publish
1. Login to GHCR locally: `echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin`.
2. Build via SDK: `hla-compass build --tag ghcr.io/<org>/<module>:1.0.0`.
3. Push with Docker CLI.
4. Publish: `hla-compass publish --env dev --scope org --generate-keys --image-ref ghcr.io/<org>/<module>:1.0.0`.

This flow is useful when experimenting or before CI pipelines exist. Once stabilized, prefer Flow A so reproducible artefacts ship from CI.

## 4. Register Private Pull Access
- Provide platform-ops with the registry host (`ghcr.io`), namespace(s), and read-only credentials (machine user or PAT scoped to `read:packages`). The control plane stores the secret in AWS Secrets Manager and injects it into the intake worker.
- Internal validation ensures the platform can pull-by-digest before accepting publishes.
- Update the registry record whenever you rotate tokens; the CLI never transmits registry secrets.

## 5. Troubleshooting GHCR / CI issues
| Error | Likely cause | Fix |
| --- | --- | --- |
| `403` pushing to GHCR | Missing `packages:write` permission on workflow token | Add `permissions: packages: write` to the workflow or push with a PAT. |
| `REGISTRY_UNAUTHORIZED` from publish | Namespace not allow-listed for the org | Add `ghcr.io/<org>/*` under Org Settings → Registries or adjust the image ref. |
| `manifest.json not found` during publish | Command executed from wrong directory | `cd` into the module root (contains manifest + backend/). |
| `Security scan failed` | Trivy found HIGH/CRITICAL issues | Upgrade base images/dependencies or request a short-lived waiver via security@alithea.bio. |
| CI cannot pull private GHCR image | Platform credential missing | Provide read-only token via registry onboarding; verify with `docker pull` from a clean environment. |

## 6. References
- [Module developer handbook](../handbook.md)
- [Publishing](../../publishing.md)
- [CLI Commands](../../../reference/cli.md)
