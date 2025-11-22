"""Golden path UI module backend used by CLI tests."""

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


class GoldenWithUIModule(Module):
    def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        param1 = input_data.get("param1")
        if not param1:
            return self.error("param1 is required")

        param2 = input_data.get("param2", "default_value")
        org_id = _resolve_org_id(context)
        run_id = _resolve_run_id(context)
        environment = _resolve_environment(context)

        table: List[Dict[str, Any]] = []
        for idx in range(1, 4):
            table.append(
                {
                    "id": f"{run_id}-{idx}",
                    "value": f"{param1}-{idx}",
                    "score": round(0.85 - idx * 0.1, 3),
                    "metadata": {
                        "organization_id": org_id,
                        "param2": param2,
                        "iteration": idx,
                        "environment": environment,
                    },
                }
            )

        context_meta = {
            "run_id": run_id,
            "organization_id": org_id,
            "organization_name": context.get("organization_name"),
            "mode": context.get("mode", "interactive"),
            "reservation_id": (context.get("credit") or {}).get("reservation_id"),
        }

        summary = {
            "rows": len(table),
            "organization": org_id,
            "param1_length": len(param1),
            "environment": environment,
        }

        return self.success(
            results={
                "table": table,
                "context": context_meta,
                "parameters": {"param1": param1, "param2": param2},
            },
            summary=summary,
        )
