# Data Access Guide

The HLA-Compass platform provides a unified "Scoped Vending Machine" model for data access. This ensures security (Row-Level Security) and performance (Direct S3 Access).

## Overview

Modules access data through the `self.data` helper, which is an instance of `DataClient`. This client is scoped to a specific **Provider** and **Catalog** (defaulting to `alithea-bio/immunopeptidomics`).

## Available Tables

The default `immunopeptidomics` catalog provides access to:

| Table | Description |
|-------|-------------|
| `peptides` | Peptide sequences with mass, length, and annotations |
| `proteins` | Protein sequences and metadata |
| `samples` | Sample information and experimental conditions |
| `hla_alleles` | HLA allele reference data |

> For complete schema documentation, see the [Data Catalog Reference](../reference/data-catalog.md).

## SQL Access

Execute raw SQL queries against the catalog's schema. The platform automatically enforces Row-Level Security (RLS) so you only see data your organization is authorized to access. The SDK routes queries to `/v1/data/...` or `/v1/api/data/...` depending on whether a user token or API key is in use.

```python
# Basic Query
result = self.data.sql.query("SELECT sequence, mass FROM peptides LIMIT 5")
print(result["data"])  # [{'sequence': '...', 'mass': 1000.0}, ...]

# Parameterized Query (ALWAYS use this for user input)
min_len = input_data.get("min_length", 8)
result = self.data.sql.query(
    "SELECT * FROM peptides WHERE length >= %s",
    params=[min_len]
)
```

### Best Practices

*   **Read-Only**: Queries are strictly read-only.
*   **Scoping**: You don't need to filter by `organization_id`; the DB does it for you.
*   **Parameters**: Never concatenate strings into SQL. Use the `params` list to prevent injection.

## Storage Access

Access large files (Parquet, BAM, etc.) directly from S3. The platform vends temporary, scoped credentials so your module reads directly from the cloud storage layer.

```python
# Read Parquet (supports 'polars' and 'pandas')
df = self.data.storage.read_parquet("runs/experiment_1/results.parquet", engine="polars")

# Low-level S3 Client (boto3)
s3 = self.data.storage.get_s3_client()
obj = s3.get_object(Bucket="...", Key="...")
```

### Shared Catalog Access

Shared catalogs (`alithea-bio/immunopeptidomics`, `alithea-bio/genetics`) are **read-only** for all organizations except the platform owner (Alithea Bio).

```python
# For non-platform-owner organizations, write requests are silently downgraded
creds = self.data.storage.get_credentials(mode="write")
# mode="write" becomes "read" for shared catalogs
```

This ensures reference data integrity while allowing all organizations to consume shared datasets.

### Working with Other Catalogs

If you need to access data from a different domain (e.g., Genetics), initialize a dedicated client:

```python
from hla_compass.data import DataClient

def execute(self, input_data, context):
    # Access default catalog
    peptides = self.data.sql.query("...")

    # Access Genetics catalog (reuse the API client if available)
    genetics = DataClient(
        provider="alithea-bio",
        catalog="genetics",
        api_client=self.context.get("api"),
    )
    genes = genetics.sql.query("SELECT * FROM gene_expression ...")
```
