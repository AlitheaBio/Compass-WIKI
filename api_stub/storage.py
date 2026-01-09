from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

from filelock import FileLock


class AtomicJsonStorage:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.lock = FileLock(f"{path}.lock", timeout=10)

    def read(self, default: Any = None) -> Any:
        with self.lock:
            if not self.path.exists():
                return default
            try:
                return json.loads(self.path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return default

    def write(self, data: Any) -> None:
        with self.lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            fd, tmp_path = tempfile.mkstemp(
                dir=self.path.parent,
                prefix=self.path.name,
                suffix=".tmp",
            )
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as handle:
                    json.dump(data, handle, indent=2)
                os.replace(tmp_path, self.path)
            except Exception:
                os.unlink(tmp_path)
                raise
