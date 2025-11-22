# HLA-Compass Python SDK

The **HLA-Compass SDK** provides a comprehensive toolkit for building, testing, and publishing bioinformatics modules on the Alithea Bio platform.

## Key Features

* **Module System**: Simple class-based API for defining logic (`hla_compass.Module`).
* **Data Access**: Strongly-typed access to Peptide, Protein, Sample, and HLA data.
* **Authentication**: Secure, browser-based SSO for developers.
* **CLI**: Powerful command-line tools for scaffolding, local development, and publishing.
* **Hybrid Runtime**: Support for both Batch jobs and Interactive UI sessions.

## Installation

```bash
pip install hla-compass
```

## Quick Start

1.  **Login:**
    ```bash
    hla-compass auth login
    ```

2.  **Create a Module:**
    ```bash
    hla-compass init my-module --template ui
    ```

3.  **Run Locally:**
    ```bash
    cd my-module
    hla-compass dev
    ```

Explore the [User Guide](guides/getting-started.md) for more details.
