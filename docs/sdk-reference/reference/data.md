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

Execute SQL queries against the Catalog's Schema.

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


