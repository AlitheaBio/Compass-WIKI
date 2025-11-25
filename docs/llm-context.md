# HLA-Compass SDK - LLM Context Reference

> **Purpose**: This file contains consolidated patterns and examples optimized for AI coding assistants. Copy relevant sections into your LLM context when building HLA-Compass modules.

---

## Module Structure

```python
# backend/main.py - Standard module structure
from pydantic import BaseModel, Field
from typing import List, Optional
from hla_compass import Module, ValidationError, ModuleError

class Input(BaseModel):
    """Pydantic model defines inputs. Auto-generates manifest.json schema."""
    # Required field
    sequence: str = Field(description="Peptide sequence")
    # Optional with default
    threshold: float = Field(default=0.5, ge=0.0, le=1.0, description="Score threshold")
    # List field
    samples: List[str] = Field(default_factory=list, description="Sample IDs")
    # Optional field
    comment: Optional[str] = Field(default=None, description="Optional note")

class MyModule(Module):
    Input = Input
    
    def execute(self, input_data: Input, context) -> dict:
        # input_data is validated Pydantic model with type hints
        sequence = input_data.sequence
        threshold = input_data.threshold
        
        # Your analysis logic here
        results = {"analyzed": True}
        
        return self.success(
            results=results,
            summary={"status": "complete"}
        )

if __name__ == "__main__":
    MyModule().serve()
```

---

## Data Access Patterns

### Schema Discovery (Start Here!)

Before writing queries, discover what's available:

```python
def execute(self, input_data: Input, context):
    # List all tables you can access
    tables = self.data.sql.tables()
    # ['peptides', 'proteins', 'samples', ...]
    
    # Get columns for a specific table
    cols = self.data.sql.columns("peptides")
    # [{"name": "id", "type": "uuid"}, {"name": "sequence", "type": "text"}, ...]
    
    # Human-readable description (great for debugging)
    print(self.data.sql.describe("peptides"))
    # Table: peptides
    # Columns:
    #   - id (uuid)
    #   - sequence (text)
    #   ...
```

CLI commands:
```bash
hla-compass data tables                    # List tables
hla-compass data schema                    # Full schema
hla-compass data schema --table peptides   # Single table
hla-compass data schema --format json      # JSON for LLM context
```

### SQL Queries (Row-Level Security Applied Automatically)

```python
def execute(self, input_data: Input, context):
    # Simple query
    result = self.data.sql.query("SELECT * FROM peptides LIMIT 10")
    peptides = result["data"]  # List of dicts
    
    # Parameterized query (ALWAYS use params for user input)
    result = self.data.sql.query(
        "SELECT sequence, mass FROM peptides WHERE length >= %s AND mass < %s",
        params=[input_data.min_length, input_data.max_mass]
    )
    
    # Pattern matching
    result = self.data.sql.query(
        "SELECT * FROM peptides WHERE sequence LIKE %s",
        params=[f"%{input_data.pattern}%"]
    )
```

### Storage Access (Read Large Files)

```python
def execute(self, input_data: Input, context):
    # Read Parquet with Polars (recommended for large files)
    df = self.data.storage.read_parquet("runs/experiment/results.parquet", engine="polars")
    
    # Read with Pandas
    df = self.data.storage.read_parquet("data/samples.parquet", engine="pandas")
    
    # Low-level S3 access
    s3 = self.data.storage.get_s3_client()
    response = s3.get_object(Bucket="bucket", Key="path/to/file")
```

### Save Output Files

```python
def execute(self, input_data: Input, context):
    results = [{"id": 1, "value": 42}]
    
    # JSON output
    url = self.storage.save_json("results/analysis.json", results)
    
    # CSV from DataFrame
    import pandas as pd
    df = pd.DataFrame(results)
    url = self.storage.save_csv("results/data.csv", df)
    
    # Compressed CSV
    url = self.storage.save_csv("results/large.csv.gz", df, compress=True)
    
    # Excel workbook
    url = self.storage.save_excel("results/report.xlsx", df)
    
    # Raw file with custom content type
    url = self.storage.save_file(
        "results/custom.bin",
        content=binary_data,
        content_type="application/octet-stream"
    )
```

---

## Context Properties

```python
def execute(self, input_data: Input, context):
    # Execution identifiers
    run_id = self.run_id              # Unique execution ID
    module_id = self.module_id        # Module identifier
    module_version = self.module_version
    
    # User/Org info
    user_id = self.user_id
    organization_id = self.organization_id
    
    # Environment
    env = self.environment            # "dev", "staging", "prod"
    
    # Credit reservation (if applicable)
    credit = self.credit              # CreditReservation object or None
    
    # Logger with context
    self.logger.info("Processing", extra={"sample_count": len(input_data.samples)})
```

---

## Error Handling

```python
from hla_compass import Module, ValidationError, ModuleError

class MyModule(Module):
    def execute(self, input_data: Input, context):
        # Input validation error (4xx)
        if len(input_data.sequence) < 5:
            raise ValidationError("Sequence must be at least 5 characters")
        
        # Module logic error (5xx, retriable)
        try:
            result = external_api_call()
        except TimeoutError as e:
            raise ModuleError(f"External service timeout: {e}")
        
        # Custom error with details
        error = ModuleError("Analysis failed")
        error.details = {"step": "alignment", "reason": "no matches"}
        raise error
```

---

## Testing

### Quick Test (Recommended)

```python
from hla_compass.testing import ModuleTester
from backend.main import MyModule

# Uses manifest defaults, creates mock context
result = ModuleTester().quickstart(MyModule)
print(result["status"])  # "success" or "error"
print(result["results"])
```

### Custom Input

```python
from hla_compass.testing import ModuleTester, MockContext
from backend.main import MyModule

tester = ModuleTester()
context = MockContext.create(
    organization_id="test-org",
    user_id="test-user",
)
result = tester.test_with_class(
    MyModule,
    {"sequence": "SIINFEKL", "threshold": 0.8},
    context
)
```

### Unit Test Pattern

```python
# tests/test_module.py
import pytest
from hla_compass.testing import ModuleTester, MockContext
from backend.main import MyModule

@pytest.fixture
def tester():
    return ModuleTester()

def test_basic_execution(tester):
    result = tester.quickstart(MyModule, {"sequence": "MLLSVPLLL"})
    assert result["status"] == "success"

def test_validation_error(tester):
    result = tester.quickstart(MyModule, {"sequence": ""})
    assert result["status"] == "error"
    assert "validation" in result["error"]["type"]
```

---

## Pydantic Input Patterns

### Basic Types

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum

class AnalysisType(str, Enum):
    BINDING = "binding"
    EXPRESSION = "expression"

class Input(BaseModel):
    # String with constraints
    sequence: str = Field(min_length=1, max_length=100, description="Peptide sequence")
    
    # Number with range
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    count: int = Field(default=10, ge=1, le=1000)
    
    # Enum/Literal for fixed choices
    analysis_type: AnalysisType = Field(default=AnalysisType.BINDING)
    output_format: Literal["json", "csv", "parquet"] = Field(default="json")
    
    # Lists
    alleles: List[str] = Field(default_factory=list, description="HLA alleles")
    
    # Optional
    notes: Optional[str] = None
    
    # Nested object
    options: Optional["AdvancedOptions"] = None

class AdvancedOptions(BaseModel):
    use_cache: bool = True
    parallel: bool = False
```

### Validation

```python
from pydantic import BaseModel, Field, field_validator

class Input(BaseModel):
    sequence: str
    allele: str
    
    @field_validator("sequence")
    @classmethod
    def validate_sequence(cls, v):
        valid_aa = set("ACDEFGHIKLMNPQRSTVWY")
        if not all(c in valid_aa for c in v.upper()):
            raise ValueError("Sequence contains invalid amino acids")
        return v.upper()
    
    @field_validator("allele")
    @classmethod
    def validate_allele(cls, v):
        if not v.startswith("HLA-"):
            raise ValueError("Allele must start with 'HLA-'")
        return v
```

---

## CLI Commands Reference

```bash
# Authentication
hla-compass auth login           # Browser-based SSO login
hla-compass auth logout          # Clear credentials
hla-compass auth status          # Check auth status

# Module scaffolding
hla-compass init my-module --interactive    # Interactive wizard
hla-compass init my-module --template ui    # With React frontend
hla-compass init my-module --template no-ui # Backend only

# Development
hla-compass dev                  # Start local dev server
hla-compass dev --verbose        # With full logging
hla-compass preflight            # Validate + sync manifest

# Testing
hla-compass test                              # Run with defaults
hla-compass test --input examples/input.json  # Custom input
hla-compass validate                          # Validate manifest only

# Building & Publishing
hla-compass build --tag mymodule:1.0.0        # Build Docker image
hla-compass publish --env dev --image-ref mymodule:1.0.0  # Publish

# Utilities
hla-compass doctor               # Check environment
hla-compass list --env dev       # List published modules
```

---

## Manifest Schema (Auto-Generated)

The manifest is auto-generated from your Pydantic `Input` model. You rarely need to edit it manually.

```json
{
  "schemaVersion": "1.0",
  "name": "my-module",
  "version": "0.1.0",
  "type": "no-ui",
  "description": "Module description",
  "execution": {
    "entrypoint": "backend.main:MyModule"
  },
  "inputs": {
    "type": "object",
    "title": "Input",
    "required": ["sequence"],
    "properties": {
      "sequence": {
        "type": "string",
        "description": "Peptide sequence"
      },
      "threshold": {
        "type": "number",
        "default": 0.5,
        "minimum": 0.0,
        "maximum": 1.0
      }
    }
  },
  "resources": {
    "memory": 512,
    "timeout": 300
  }
}
```

---

## Common Bioinformatics Patterns

### Batch Processing Samples

```python
class Input(BaseModel):
    sample_ids: List[str] = Field(description="Sample identifiers to process")
    batch_size: int = Field(default=100, ge=1, le=1000)

class BatchProcessor(Module):
    Input = Input
    
    def execute(self, input_data: Input, context):
        results = []
        for i in range(0, len(input_data.sample_ids), input_data.batch_size):
            batch = input_data.sample_ids[i:i + input_data.batch_size]
            batch_results = self.process_batch(batch)
            results.extend(batch_results)
            self.logger.info(f"Processed {len(results)}/{len(input_data.sample_ids)}")
        
        return self.success(results=results)
    
    def process_batch(self, sample_ids: List[str]):
        placeholders = ",".join(["%s"] * len(sample_ids))
        result = self.data.sql.query(
            f"SELECT * FROM samples WHERE id IN ({placeholders})",
            params=sample_ids
        )
        return result["data"]
```

### Working with DataFrames

```python
def execute(self, input_data: Input, context):
    # Query to DataFrame
    result = self.data.sql.query("SELECT * FROM peptides LIMIT 1000")
    
    import pandas as pd
    df = pd.DataFrame(result["data"])
    
    # Process
    df["length"] = df["sequence"].str.len()
    filtered = df[df["length"] >= input_data.min_length]
    
    # Save and return
    self.storage.save_csv("results/filtered.csv", filtered)
    
    return self.success(
        results=filtered.to_dict(orient="records"),
        summary={"total": len(df), "filtered": len(filtered)}
    )
```

### HLA Allele Analysis

```python
from hla_compass.constants import SUPPORTED_HLA_ALLELES

class Input(BaseModel):
    alleles: List[str] = Field(description="HLA alleles to analyze")
    
    @field_validator("alleles")
    @classmethod
    def validate_alleles(cls, v):
        invalid = [a for a in v if a not in SUPPORTED_HLA_ALLELES]
        if invalid:
            raise ValueError(f"Unsupported alleles: {invalid}")
        return v
```
