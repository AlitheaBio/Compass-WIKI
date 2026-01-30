# Data Access

## Overview

Modules access scientific data and persist results through three helpers, each initialized automatically before `execute()` runs:

| Helper | Type | Purpose |
|--------|------|---------|
| `self.data` | `DataClient` | Query the catalog database and read catalog storage (Parquet, S3 objects) |
| `self.storage` | `Storage` | Save and retrieve module result files (JSON, CSV, Excel, figures) |
| `self.db` | `ScientificQuery` | Direct read-only access to the database via the AWS RDS Data API |

`self.data` is always available when an API client or database client is present.
`self.storage` requires either an injected storage client or the `HLA_COMPASS_RESULTS_BUCKET` environment variable.
`self.db` is available when both `DB_CLUSTER_ARN` and `DB_SECRET_ARN` environment variables are set (typically in deployed runtimes).

---

## Security Model

All data access is scoped to the caller's **organization**.

- **Org-scoped API keys** — Module runtimes authenticate with API keys (not user JWTs). The SDK detects an `x-api-key` header and routes requests through the `/v1/api/data/` surface automatically.
- **Row-Level Security (RLS)** — When using direct database access (`self.db`), the SDK opens a transaction and sets `SET LOCAL app.organization_id = :org_id` before every query. PostgreSQL RLS policies then filter rows automatically.
- **Read-only enforcement** — `self.db.execute_readonly()` validates that queries contain only `SELECT` or `WITH` statements. Mutations are rejected before reaching the database.
- **Per-organization isolation** — There is no way for a module to read another organization's data. The platform enforces this at both the API gateway and the database level.

---

## Available Tables

The default `immunopeptidomics` catalog exposes the following tables:

| Table | Description |
|-------|-------------|
| `peptides` | Peptide sequences with mass, length, and annotations |
| `proteins` | Protein sequences and metadata |
| `samples` | Sample information and experimental conditions |
| `hla_alleles` | HLA allele reference data |

> For complete schema documentation, see the [Data API Reference](../reference/data.md).

---

## SQL Access (`self.data.sql`)

Execute SQL queries against the catalog's schema. The platform automatically enforces Row-Level Security so modules only see data their organization is authorized to access.

### Basic query

```python
result = self.data.sql.query("SELECT sequence, mass FROM peptides LIMIT 5")

# result structure: {"columns": [...], "data": [...], "count": N}
for row in result["data"]:
    print(row["sequence"], row["mass"])
```

### Parameterized queries

Always use the `params` list for dynamic values. Never concatenate strings into SQL.

```python
min_len = input_data.get("min_length", 8)
result = self.data.sql.query(
    "SELECT * FROM peptides WHERE length >= %s",
    params=[min_len],
)
```

### Method signature

```python
def query(
    self,
    sql: str,
    params: Optional[List[Any]] = None,
) -> Dict[str, Any]:
    """
    Returns: {"columns": [...], "data": [...], "count": N}
    """
```

### Best practices

- **Read-only** — Queries are strictly read-only.
- **Scoping** — You do not need to filter by `organization_id`; the database does it for you.
- **Parameters** — Never concatenate strings into SQL. Use the `params` list to prevent injection.

---

## Direct Database Access (`self.db`)

When `DB_CLUSTER_ARN` and `DB_SECRET_ARN` environment variables are set (typically in deployed Lambda/ECS runtimes), the SDK initializes a `ScientificQuery` instance on `self.db`. This talks directly to the Aurora database through the AWS RDS Data API, bypassing the HTTP API layer.

### `execute_readonly`

Run arbitrary read-only SQL. Only `SELECT` and `WITH` statements are allowed; anything else raises `QuerySecurityError`. An automatic `LIMIT` is appended if none is present (default max: 1000).

```python
rows = self.db.execute_readonly(
    "SELECT sequence, mass FROM peptides WHERE length >= :min_len",
    params={"min_len": 9},
    auto_limit=True,  # default
)
# rows: [{"sequence": "AAA...", "mass": 800.4}, ...]
```

**Signature:**

```python
def execute_readonly(
    self,
    sql: str,
    params: Optional[Union[Dict[str, Any], List[Any]]] = None,
    auto_limit: bool = True,
) -> List[Dict[str, Any]]:
```

### `execute_function`

Call a predefined PostgreSQL function from the `scientific` schema.

```python
results = self.db.execute_function(
    "search_peptides_by_sequence",
    {"pattern": "GILGFVFTL", "max_results": 50},
)
```

**Signature:**

```python
def execute_function(
    self,
    function_name: str,
    params: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
```

### `list_available_functions`

Discover which `scientific.*` functions are available in the database.

```python
functions = self.db.list_available_functions()
# ["get_sample_statistics", "search_peptides_by_hla", ...]
```

### When to use `self.db` vs `self.data.sql`

| | `self.data.sql` | `self.db` |
|---|---|---|
| Transport | HTTP API (`/v1/data/…`) | AWS RDS Data API (direct) |
| Availability | Always (needs API client) | Only when `DB_CLUSTER_ARN` + `DB_SECRET_ARN` are set |
| Return format | `{"columns", "data", "count"}` | `List[Dict]` |
| Supports functions | No | Yes (`execute_function`) |

---

## Catalog Storage (`self.data.storage`)

Access large files (Parquet, BAM, etc.) stored in the catalog's S3 bucket. The platform vends temporary, scoped AWS STS credentials so the module reads directly from cloud storage.

### `get_credentials`

```python
creds = self.data.storage.get_credentials(mode="read")
# creds: {"accessKeyId", "secretAccessKey", "sessionToken", "region", "bucket", "prefix"}
```

**Signature:**

```python
def get_credentials(self, mode: str = "read") -> Dict[str, Any]:
```

### `get_s3_client`

Returns a pre-configured `boto3` S3 client using scoped credentials.

```python
s3 = self.data.storage.get_s3_client(mode="read")
obj = s3.get_object(Bucket=creds["bucket"], Key="path/to/file.csv")
```

**Signature:**

```python
def get_s3_client(self, mode: str = "read"):
```

### `read_parquet`

Read a Parquet file directly from catalog storage into a DataFrame.

```python
# Polars (default)
df = self.data.storage.read_parquet("runs/experiment_1/results.parquet")

# Pandas
df = self.data.storage.read_parquet("runs/experiment_1/results.parquet", engine="pandas")
```

**Signature:**

```python
def read_parquet(self, key: str, engine: str = "polars"):
```

### Shared catalog rules

Shared catalogs (e.g. `alithea-bio/immunopeptidomics`) are **read-only** for all organizations except the platform owner. If you request `mode="write"`, the platform silently downgrades to `"read"` for shared catalogs.

```python
creds = self.data.storage.get_credentials(mode="write")
# For shared catalogs, this returns read-only credentials
```

---

## Result Storage (`self.storage`)

`self.storage` is a `Storage` instance scoped to the current run. All files are saved under the prefix `files/<run_id>/` with automatic metadata tagging (`run_id`, `module_id`, `organization_id`).

### Saving files

#### `save_json`

```python
url = self.storage.save_json("analysis.json", {"peptides": 42, "status": "ok"})
```

**Signature:**

```python
def save_json(
    self,
    filename: str,
    data: Any,
    indent: int = 2,
    compress: bool = False,
) -> str:
```

Set `compress=True` to emit a gzipped `.json.gz` file.

#### `save_csv`

```python
import pandas as pd

df = pd.DataFrame(result["data"])
url = self.storage.save_csv("peptides.csv", df)
```

**Signature:**

```python
def save_csv(
    self,
    filename: str,
    dataframe,
    index: bool = False,
    compress: bool = False,
) -> str:
```

CSV and Excel exports automatically sanitize cell values to neutralize spreadsheet formula injection.

#### `save_excel`

```python
url = self.storage.save_excel("report.xlsx", df, sheet_name="Peptides")

# Multiple sheets
url = self.storage.save_excel("report.xlsx", {
    "Peptides": peptide_df,
    "Proteins": protein_df,
})
```

**Signature:**

```python
def save_excel(
    self,
    filename: str,
    dataframe,
    sheet_name: str = "Sheet1",
    index: bool = False,
) -> str:
```

Requires the `hla-compass[data]` extra (`pandas` + `xlsxwriter`).

#### `save_figure`

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
ax.bar(["A", "B", "C"], [10, 20, 15])
url = self.storage.save_figure("chart.png", fig, format="png", dpi=150)
```

**Signature:**

```python
def save_figure(
    self,
    filename: str,
    figure,
    format: str = "png",
    dpi: int = 150,
) -> str:
```

Supported formats: `png`, `svg`, `pdf`, `jpg`.

#### `save_file`

Low-level method — accepts `bytes`, `str`, or any file-like object with `read()`.

```python
url = self.storage.save_file(
    "raw_output.bin",
    b"\x00\x01\x02",
    content_type="application/octet-stream",
    metadata={"step": "preprocessing"},
)
```

**Signature:**

```python
def save_file(
    self,
    filename: str,
    content: Union[bytes, str, BinaryIO],
    content_type: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
```

#### `save_workflow_file`

Persist an artifact under `workflow-files/{workflowId}/{runId}/{stepId}/`. Workflow identifiers default to the current execution context.

```python
url = self.storage.save_workflow_file("step_output.json", json.dumps(data))
```

**Signature:**

```python
def save_workflow_file(
    self,
    filename: str,
    content: Union[bytes, str, BinaryIO],
    *,
    workflow_id: Optional[str] = None,
    workflow_run_id: Optional[str] = None,
    step_id: Optional[str] = None,
    content_type: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> str:
```

### Reading and managing files

#### `load`

```python
raw_bytes = self.storage.load("analysis.json")
data = json.loads(raw_bytes)
```

#### `list_files`

```python
files = self.storage.list_files(prefix="results/")
# [{"key": "...", "size": 1024, "last_modified": ...}, ...]
```

#### `delete_file`

```python
self.storage.delete_file("old_output.json")
```

#### `create_download_url`

Generate a pre-signed URL for end-user downloads.

```python
url = self.storage.create_download_url("report.xlsx", expires_in=3600)
```

**Signature:**

```python
def create_download_url(self, filename: str, expires_in: int = 3600) -> str:
```

### `ResultBundle` helper

Bundle multiple result files together with a manifest.

```python
from hla_compass.storage import ResultBundle

bundle = ResultBundle(self.storage, prefix="results")
bundle.add_json("summary", {"total": 100})
bundle.add_csv("peptides", peptide_df)
bundle.add_figure("distribution", fig)
bundle.save_manifest()
```

The manifest is saved at `results/manifest.json` and contains a list of all added files with their types and URLs.

---

## Manifest Permissions

Declare the data capabilities your module needs in `manifest.json`:

```json
{
  "name": "my-analysis-module",
  "version": "1.0.0",
  "permissions": {
    "database": ["read"],
    "storage": true
  },
  "dependencies": {
    "python": ["polars", "matplotlib"]
  }
}
```

| Field | Description |
|-------|-------------|
| `permissions.database` | `["read"]` — grants SQL access via `self.data` and `self.db` |
| `permissions.storage` | `true` — grants result storage access via `self.storage` |
| `dependencies` | Lists runtime dependencies the platform should provision |

---

## Complete Example

A full module that queries peptides from the database and saves the results:

```python
from hla_compass import Module


class PeptideAnalysis(Module):
    """Analyse peptides by minimum length and save results."""

    def execute(self, input_data, context):
        min_length = input_data.get("min_length", 8)

        # Query the catalog database
        result = self.data.sql.query(
            "SELECT sequence, mass, length FROM peptides WHERE length >= %s LIMIT 100",
            params=[min_length],
        )
        peptides = result["data"]

        # Save results as JSON
        self.storage.save_json("peptides.json", peptides)

        # Save results as CSV (if pandas is available)
        try:
            import pandas as pd

            df = pd.DataFrame(peptides)
            self.storage.save_csv("peptides.csv", df)
        except ImportError:
            pass

        return self.success(
            results=peptides,
            summary={"total": len(peptides), "min_length": min_length},
        )
```

---

## Working with Other Catalogs

If you need to access data from a different domain (e.g., Genetics), instantiate a separate `DataClient`:

```python
from hla_compass.data import DataClient


def execute(self, input_data, context):
    # Default catalog (immunopeptidomics)
    peptides = self.data.sql.query("SELECT * FROM peptides LIMIT 10")

    # Access a different catalog
    genetics = DataClient(
        provider="alithea-bio",
        catalog="genetics",
        api_client=self.context.get("api"),
    )
    genes = genetics.sql.query("SELECT * FROM gene_expression LIMIT 10")
```

---

## Next Steps

- [Storage API Reference](../reference/storage.md) — Full `Storage` class reference
- [Data API Reference](../reference/data.md) — Full `DataClient` class reference
- [Module Development](module-development.md) — Building and structuring modules
- [Testing](testing.md) — Test your data access code locally
