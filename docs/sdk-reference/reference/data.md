# Data Reference

The `DataClient` provides access to scientific data catalogs via SQL and Object Storage.

## DataClient

Entry point for accessing scientific data from a specific catalog.

```python
client = DataClient(provider="alithea-bio", catalog="immunopeptidomics")
```

### Properties

*   `sql`: Instance of [SQLClient](#sqlclient)
*   `storage`: Instance of [StorageClient](#storageclient)

---

## SQLClient

Execute SQL queries and discover schema for the Catalog.

### `query(sql, params=None)`

Execute a raw SQL query.

**Arguments:**

*   `sql` (str): SQL query string (e.g., `SELECT * FROM peptides WHERE sequence = %s`)
*   `params` (list): List of parameters to safely bind to the query

**Returns:**

*   `dict`: Dictionary with keys:
    *   `columns` (list[str]): Column names
    *   `data` (list[dict]): Rows as dictionaries
    *   `count` (int): Number of rows

### `schema(refresh=False)`

Get the full schema for this catalog (tables and columns you have access to).

**Arguments:**

*   `refresh` (bool): Force refresh the cached schema

**Returns:**

*   `dict`: Schema with `tables` list containing table metadata

```python
schema = self.data.sql.schema()
# {"tables": [{"name": "peptides", "columns": [...], ...}, ...]}
```

### `tables()`

Get list of table names available in this catalog.

**Returns:**

*   `list[str]`: Table names

```python
tables = self.data.sql.tables()
# ['peptides', 'proteins', 'samples']
```

### `columns(table)`

Get column information for a specific table.

**Arguments:**

*   `table` (str): Table name

**Returns:**

*   `list[dict]`: Column definitions with `name`, `type`, `description`

```python
cols = self.data.sql.columns("peptides")
# [{"name": "id", "type": "uuid"}, {"name": "sequence", "type": "text"}, ...]
```

### `describe(table=None)`

Get a human-readable description of the schema or a specific table.

**Arguments:**

*   `table` (str, optional): Table name. If None, describes all tables.

**Returns:**

*   `str`: Formatted description

```python
print(self.data.sql.describe("peptides"))
# Table: peptides
# Columns:
#   - id (uuid)
#   - sequence (text)
#   ...
```

---

## StorageClient

Access the Catalog's Object Storage.

### `read_parquet(key, engine="polars")`

Read a parquet file from the catalog's storage.

**Arguments:**

*   `key` (str): Relative path (e.g. `runs/123.parquet`) or full `s3://` URI
*   `engine` (str): Dataframe engine, either `"polars"` (default) or `"pandas"`

### `get_s3_client(mode="read")`

Get a `boto3` S3 client configured with scoped credentials for the catalog's bucket.

**Arguments:**

*   `mode` (str): `"read"` or `"write"`

