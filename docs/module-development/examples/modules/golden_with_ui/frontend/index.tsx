import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type ModuleProps = {
  onExecute?: (params: Record<string, unknown>) => Promise<any>;
  initialParams?: Record<string, unknown>;
};

const ModuleUI: React.FC<ModuleProps> = ({ onExecute, initialParams }) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({
    param1: String(initialParams?.param1 || ""),
    param2: String(initialParams?.param2 || ""),
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const payload = {
        param1: formValues.param1,
        param2: formValues.param2 || undefined,
      };

      const response = onExecute
        ? await onExecute(payload)
        : {
            status: "success",
            results: {
              table: [
                {
                  id: "local-1",
                  value: `${payload.param1}-1`,
                  score: 0.75,
                },
              ],
              parameters: payload,
            },
            summary: { rows: 1 },
          };

      if (response.status === "success") {
        setResult(response);
        setStatus("success");
      } else {
        throw new Error(response.error?.message || "Execution failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  return (
    <div className="card">
      <h1>Golden Module UI</h1>
      <p>Echo backend inputs and show summary metrics.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="param1">Parameter 1</label>
          <input
            id="param1"
            name="param1"
            value={formValues.param1}
            onChange={handleChange}
            required
            placeholder="Required"
          />
        </div>
        <div className="field">
          <label htmlFor="param2">Parameter 2</label>
          <input
            id="param2"
            name="param2"
            value={formValues.param2}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
        <button disabled={status === "loading"} type="submit">
          {status === "loading" ? "Running" : "Run Module"}
        </button>
      </form>

      {error && <p style={{ color: "#d14343" }}>{error}</p>}

      {result && result.results && (
        <div className="results">
          <strong>Summary</strong>
          <ul className="summary-list">
            <li>
              <span>Rows</span>
              <span>{result.summary?.rows ?? result.results?.table?.length ?? 0}</span>
            </li>
            <li>
              <span>Param1</span>
              <span>{result.results?.parameters?.param1}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModuleUI;

declare global {
  interface Window {
    ModuleUI?: typeof ModuleUI;
  }
}

if (typeof window !== "undefined") {
  window.ModuleUI = ModuleUI;
}

if (typeof document !== "undefined") {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(<ModuleUI />);
  }
}
