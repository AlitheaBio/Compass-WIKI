# Data Access Guide

The HLA-Compass platform provides a unified "Scoped Vending Machine" model for data access. This ensures security (Row-Level Security) and performance (Direct S3 Access).

## Overview

Modules access data through the `self.data` helper, which is an instance of `DataClient`. This client is scoped to a specific **Provider** and **Catalog** (defaulting to `alithea-bio/immunopeptidomics`).

## Schema Discovery

Before writing queries, discover what tables and columns are available:

### CLI

```bash
# List all tables you have access to
hla-compass data tables

# Describe all tables with columns
hla-compass data schema

# Describe a specific table
hla-compass data schema --table peptides

# Get JSON output (useful for LLM context)
hla-compass data schema --format json
```

### In Code

```python
def execute(self, input_data, context):
    # List available tables
    tables = self.data.sql.tables()
    print(tables)  # ['peptides', 'proteins', 'samples', ...]
    
    # Get column info for a table
    cols = self.data.sql.columns("peptides")
    for col in cols:
        print(f"{col['name']}: {col['type']}")
    
    # Human-readable description (great for debugging)
    print(self.data.sql.describe("peptides"))
```

> **Security Note**: Schema discovery only returns metadata for tables your organization has permission to access. No actual data is exposed.

## SQL Access

Execute raw SQL queries against the catalog's schema. The platform automatically enforces Row-Level Security (RLS) so you only see data your organization is authorized to access.

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
*   **Discovery First**: Use `self.data.sql.tables()` and `self.data.sql.describe()` to explore before writing queries.

## Storage Access

Access large files (Parquet, BAM, etc.) directly from S3. The platform vends temporary, scoped credentials so your module reads directly from the cloud storage layer.

```python
# Read Parquet (supports 'polars' and 'pandas')
df = self.data.storage.read_parquet("runs/experiment_1/results.parquet", engine="polars")

# Low-level S3 Client (boto3)
s3 = self.data.storage.get_s3_client()
obj = s3.get_object(Bucket="...", Key="...")
```

### Working with Other Catalogs

If you need to access data from a different domain (e.g., Genetics), initialize a dedicated client:

```python
from hla_compass.data import DataClient

def execute(self, input_data, context):
    # Access default catalog
    peptides = self.data.sql.query("...")
    
    # Access Genetics catalog
    genetics = DataClient(provider="alithea-bio", catalog="genetics", api_client=self.context.api)
    genes = genetics.sql.query("SELECT * FROM gene_expression ...")
```
