# Data Catalog Reference

HLA-Compass data access is scoped by **provider** and **catalog** (see `hla_compass.data.DataClient`). This page documents the default catalog used by modules and how to discover available columns safely.

## Default catalog

- Provider: `alithea-bio`
- Catalog: `immunopeptidomics`

## Common tables

| Table | Description |
|------|-------------|
| `peptides` | Peptide sequences with mass/length and associated annotations |
| `proteins` | Protein sequences and metadata |
| `samples` | Sample metadata and experimental conditions |
| `hla_alleles` | HLA allele reference data |

## Discover columns

To see the exact columns available in your environment, query Postgres `information_schema` from a module using `self.data.sql.query(...)`:

```python
result = self.data.sql.query(
    """
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = %s
    ORDER BY ordinal_position
    """,
    params=["peptides"],
)
print(result["data"])
```

## Notes

- Row-Level Security (RLS) is enforced by the platform; do not filter by organization identifiers in SQL.
- Use parameterized queries (`params=[...]`) for any user input to avoid injection.
