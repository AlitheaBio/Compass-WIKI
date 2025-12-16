"""
Golden Path Module - Reference implementation for SDK smoke tests.

This module demonstrates the recommended Pydantic-first pattern for defining
module inputs. Keep the `manifest.json` inputs schema in sync with the `Input`
model; the CLI validates the manifest but does not auto-generate it today.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field

from hla_compass import Module


class Options(BaseModel):
    """Nested options for the analysis."""
    include_peptides: bool = Field(
        default=True,
        description="Include mock peptide annotations in output"
    )


class Input(BaseModel):
    """
    Input schema for the Golden No-UI Module.
    
    This Pydantic model defines all inputs for runtime validation and typing.
    Keep the `manifest.json` inputs schema aligned with this class.
    """
    samples: List[str] = Field(
        description="List of sample identifiers to summarize",
        min_length=1
    )
    options: Optional[Options] = Field(
        default_factory=Options,
        description="Optional analysis settings"
    )


class GoldenNoUIModule(Module):
    """
    Reference implementation demonstrating Pydantic-first module development.
    
    Key features demonstrated:
    - Pydantic Input model for typed, validated inputs
    - Context properties (self.run_id, self.organization_id, etc.)
    - Structured logging with self.logger
    - Standard success() response format
    """
    
    Input = Input

    def execute(self, input_data: Input, context) -> dict:
        # input_data is a validated Pydantic model with full type hints
        samples = input_data.samples
        include_peptides = input_data.options.include_peptides if input_data.options else True

        # Use built-in context properties (no manual resolution needed)
        self.logger.info(
            "golden-no-ui module invoked",
            extra={"sample_count": len(samples), "run_id": self.run_id}
        )

        payload = {
            "run_id": self.run_id,
            "organization_id": self.organization_id,
            "environment": self.environment,
            "sample_count": len(samples),
            "samples": samples,
        }

        if include_peptides:
            payload["mock_peptides"] = [
                {"id": "pep-001", "sequence": "SIINFEKL"},
                {"id": "pep-002", "sequence": "MLLSVPLLL"},
            ]

        return self.success(
            results=payload,
            summary={
                "samples": len(samples),
                "include_peptides": include_peptides,
            }
        )


if __name__ == "__main__":
    # Quick local test
    from hla_compass.testing import ModuleTester
    result = ModuleTester().quickstart(GoldenNoUIModule)
    print(result)
