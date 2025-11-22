#!/usr/bin/env python3
"""Quick readiness probe for the devkit API stub."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


def _fetch(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=3) as response:  # noqa: S310
        payload = response.read().decode("utf-8")
    return json.loads(payload)


def main() -> int:
    port = os.environ.get("HLA_DEVKIT_API_PORT", "4100")
    base = os.environ.get("HLA_DEVKIT_API_BASE", f"http://localhost:{port}")
    try:
        ready = _fetch(f"{base}/v1/system/ready")
        modules = _fetch(f"{base}/v1/modules")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"Devkit API probe failed: {exc}")
        return 1
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive
        print(f"Invalid JSON in readiness response: {exc}")
        return 1

    print("Devkit API status:")
    print(json.dumps(ready, indent=2))
    print("\nRegistered modules:")
    print(json.dumps(modules, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover - script entry
    raise SystemExit(main())
