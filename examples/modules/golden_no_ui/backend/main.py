"""Golden path backend module used for SDK smoke tests."""

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


class GoldenNoUIModule(Module):
    """Reference implementation that echoes summary statistics."""

    def execute(self, input_data: Dict[str, Any], context: Any) -> Dict[str, Any]:
        samples: List[str] = input_data.get("samples", [])
        include_peptides = input_data.get("options", {}).get("include_peptides", True)

        run_id = _resolve_run_id(context)
        self.logger.info(
            "golden-no-ui module invoked", extra={"samples": len(samples), "run_id": run_id}
        )

        org_id = _resolve_org_id(context)
        environment = _resolve_environment(context)

        payload = {
            "run_id": run_id,
            "organization_id": org_id,
            "sample_count": len(samples),
            "samples": samples,
            "requested_at": context.get("requested_at"),
            "environment": environment,
        }

        if include_peptides:
            payload["mock_peptides"] = [
                {"id": "pep-001", "sequence": "SIINFEKL"},
                {"id": "pep-002", "sequence": "MLLSVPLLL"},
            ]

        summary = {
            "samples": len(samples),
            "include_peptides": include_peptides,
        }

        return self.success(results=payload, summary=summary)
