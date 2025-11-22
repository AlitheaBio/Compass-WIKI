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

Create a new module using the interactive wizard:

```bash
hla-compass init my-first-module --interactive
```

Select the "UI" template if you want to build a visual tool, or "No-UI" for a backend analysis script.

## 4. Run It

Navigate to your module directory and start the dev server:

```bash
cd my-first-module
hla-compass dev
```

This starts a local Docker container that mirrors the production environment. Any changes you make to `backend/main.py` or `frontend/` will be hot-reloaded.
