# Publishing

Once your module is tested, you can publish it to the HLA-Compass platform.

## Prerequisites

*   Authenticated via `hla-compass auth login`.
*   `manifest.json` version is bumped (modules are immutable).

## Command

```bash
hla-compass publish --env dev
```

## What Happens?

1.  **Build:** The CLI builds your Docker image.
2.  **Sign:** The image and manifest are cryptographically signed using your local keys.
3.  **Push:** The image is pushed to the platform's container registry (ECR or GHCR).
4.  **Register:** The module version is registered in the Platform Catalog.

## Registries

You can publish to:

*   **ECR (Default):** The platform's internal registry. Secure and private.
*   **GHCR:** GitHub Container Registry. Good for public or organization-wide modules.
*   **Docker Hub:** Supported for public images.

To specify a registry:

```bash
hla-compass publish --registry ghcr.io/my-org/repo
```

## Visibility

*   **Private:** Only visible to you (default).
*   **Org:** Visible to your organization.
*   **Public:** Visible to everyone (requires approval).

```bash
hla-compass publish --visibility org
```
