# HLA-Compass Developer Kit

Welcome to the official developer resources for the HLA-Compass platform. This repository contains examples, templates, and guides to help you build, test, and publish modules.

## 📂 Structure

*   **`examples/`**: Complete, working examples of modules and workflows.
    *   `modules/`: Python and Hybrid (UI+Python) module examples.
    *   `flows/`: Workflow definition examples (`.json`).
*   **`templates/`**: Starter code used by the `hla-compass init` CLI command.
*   **`style-guides/`**: UI/UX best practices for building module interfaces.

## 🚀 Getting Started

1.  **Install the SDK:**
    ```bash
    pip install hla-compass
    ```

2.  **Use a Template:**
    ```bash
    hla-compass init my-module --template ui
    ```

3.  **Run an Example:**
    Clone this repo and navigate to an example:
    ```bash
    cd examples/modules/hello-world
    hla-compass dev
    ```

## 📚 Documentation

Full documentation is available at [docs.alithea.bio](https://docs.alithea.bio).
