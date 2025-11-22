"""Backend-only template illustrating the module runtime contract."""

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


class NoUIModule(Module):
    def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        records: List[Dict[str, Any]] = input_data.get("data_source", [])
        options: Dict[str, Any] = input_data.get("options", {})

        org_id = _resolve_org_id(context)
        run_id = _resolve_run_id(context)
        environment = _resolve_environment(context)
        org_name = context.get("organization_name")
        reservation = (context.get("credit") or {}).get("reservation_id")

        self.logger.info(
            "processing payload",
            extra={
                "run_id": run_id,
                "organization_id": org_id,
                "records": len(records),
            },
        )

        artifact_url = None
        if options.get("save_results") and self.storage:
            artifact_payload = {
                "run_id": run_id,
                "organization_id": org_id,
                "records": records,
                "environment": environment,
            }
            artifact_url = self.storage.save_json(
                f"results/{artifact_payload['run_id']}/processed.json",
                artifact_payload,
            )

        processed_count = len(records)
        report = {
            "status": "completed" if records else "empty",
            "input_count": len(records),
            "output_count": processed_count,
            "processing_rate": processed_count / len(records) if records else 0,
        }

        result = {
            "processed_count": processed_count,
            "records_processed": processed_count,
            "preview": records[:3],
            "batch_size": options.get("batch_size", 100),
            "context": {
                "mode": context.get("mode"),
                "organization_id": org_id,
                "organization_name": org_name,
                "reservation_id": reservation,
                "requested_at": context.get("requested_at"),
            },
            "report": report,
            "artifact_url": artifact_url,
        }

        summary = {
            "processed": processed_count,
            "records": processed_count,
            "saved_artifact": bool(artifact_url),
            "credits_reserved": (context.get("credit") or {}).get("estimated_act"),
        }

        return self.success(results=result, summary=summary)
