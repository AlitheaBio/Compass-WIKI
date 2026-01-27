# Getting Started

Welcome to the HLA-Compass SDK. This guide will walk you through setting up your environment and building your first module.

## Prerequisites

* Python 3.8+
* Docker (for containerized testing and publishing)
* An HLA-Compass Platform account

## 1. Installation

Install the SDK from PyPI:

```bash
pip install hla-compass
```

## 2. Authentication

Login to the platform using your browser:

```bash
hla-compass auth login
```

This will open a browser window to authenticate via SSO. Once complete, your credentials are saved locally.

## 3. Your First Module

Create a new module using a template:

```bash
hla-compass init my-first-module --template ui
```

Use `--template ui` if you want to build a visual tool, or `--template no-ui` for a backend analysis script.

## 4. Run It

Navigate to your module directory and start the dev server:

```bash
cd my-first-module
hla-compass dev
```

This builds the module image and runs it in a local loop. Re-run `hla-compass dev` to pick up code changes.

For UI modules, use `npm run dev` in `frontend/` for live UI iteration, and `hla-compass serve` to preview the built bundle (`frontend/dist`).
