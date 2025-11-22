"""UI module backend stub aligned with the manifest schema."""

from __future__ import annotations

import os
from typing import Any, Dict, List

from hla_compass import Module


def _resolve_org_id(context: Dict[str, Any]) -> str:
    org_block = context.get("organization")
    return (
        context.get("organization_id")
        or context.get("organizationId")
        or (org_block or {}).get("id")
        or "org-unknown"
    )


def _resolve_run_id(context: Dict[str, Any]) -> str:
    return (
        context.get("run_id")
        or context.get("job_id")
        or context.get("runId")
        or "local-run"
    )


def _resolve_environment(context: Dict[str, Any]) -> str:
    return (
        context.get("environment")
        or context.get("env")
        or os.getenv("HLA_COMPASS_ENV")
        or os.getenv("HLA_ENV")
        or "unknown"
    )


class UIModule(Module):
    def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        param1 = input_data.get("param1")
        if not param1:
            return self.error("param1 is required")

        param2 = input_data.get("param2", "default_value")
        run_id = _resolve_run_id(context)
        environment = _resolve_environment(context)

        context_meta = {
            "run_id": run_id,
            "mode": context.get("mode"),
            "organization_id": _resolve_org_id(context),
            "organization_name": context.get("organization_name"),
            "reservation_id": (context.get("credit") or {}).get("reservation_id"),
        }

        rows: List[Dict[str, Any]] = []
        for idx in range(1, 4):
            rows.append(
                {
                    "id": f"{run_id}-{idx}",
                    "display": f"{param1}-{idx}",
                    "score": round(0.9 - idx * 0.1, 3),
                    "metadata": {
                        "param2": param2,
                        "iteration": idx,
                        "environment": environment,
                    },
                }
            )

        insights = {
            "param1_length": len(str(param1)),
            "param2_provided": param2 is not None,
            "roles": context.get("roles", []),
        }

        summary = {
            "rows": len(rows),
            "organization": context_meta["organization_id"],
            "mode": context_meta["mode"],
        }

        return self.success(
            results={
                "table": rows,
                "insights": insights,
                "context": context_meta,
            },
            summary=summary,
        )

if __name__ == "__main__":
    # This entrypoint is used for local development and interactive session mode.
    # For batch/async execution, the platform uses 'hla-compass module-runner' which also supports serve()
    # but this explicit block is useful for 'python backend/main.py' workflows.
    UIModule().serve()
