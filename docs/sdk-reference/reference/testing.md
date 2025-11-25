# Testing Reference

Utilities for testing modules locally.

## MockAPI

Mock API client that intercepts requests from `DataClient` and returns registered responses.

### `add_response(method, path_pattern, response, status_code=200)`

Register a mocked response.

**Arguments:**
*   `method` (str): HTTP method (GET, POST, etc)
*   `path_pattern` (str): Regex pattern to match the request URL path (e.g. `query`, `storage/token`)
*   `response` (dict): JSON serializable response body
*   `status_code` (int): HTTP status code

## MockContext

### `create(...)`

Create a mock `ExecutionContext` populated with a `MockAPI` and `MockStorage`.

## ModuleTester

### `test_local(module_path, input_data, context=None)`

Load and run a module from a file path.

**Arguments:**
*   `module_path` (str): Path to the module's `main.py`
*   `input_data` (dict): Input parameters
*   `context` (ExecutionContext): Optional context (defaults to `MockContext.create()`)

