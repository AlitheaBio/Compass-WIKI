from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


_SAFE_ID_RE = re.compile(r"^[a-zA-Z0-9_-]+$")


class ModuleManifest(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: str = Field(..., min_length=1, max_length=128)
    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$")
    id: str | None = Field(None, max_length=128)

    @field_validator("name", "id")
    @classmethod
    def validate_safe_id(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not _SAFE_ID_RE.fullmatch(value):
            raise ValueError("ID must be alphanumeric with dashes/underscores only")
        return value


class ModuleRunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    module_id: str = Field(..., alias="moduleId")
    parameters: dict[str, Any] | None = None

    @field_validator("module_id")
    @classmethod
    def validate_safe_id(cls, value: str) -> str:
        if not _SAFE_ID_RE.fullmatch(value):
            raise ValueError(
                "moduleId must be alphanumeric with dashes/underscores only"
            )
        return value
