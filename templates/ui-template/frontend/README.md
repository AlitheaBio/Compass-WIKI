# Module UI Tutorial Template

This template demonstrates how to build a module UI that looks and behaves like the HLA-Compass platform. It includes:
- Forms & validation (Ant Design + Tailwind spacing)
- Scientific tables and expandable rows
- Loading and error feedback components
- API demos for local dev and real API
- Theming controls (standalone dev only)
- Local data browser (same-origin dev endpoints)

## Quick start

1) Generate your module from this template (see SDK docs)
2) Start the dev server:

```bash
hla-compass dev --module ./path/to/module
```

3) Optional: enable online mode to proxy the real API:

```bash
hla-compass dev --module ./path/to/module --online
```

4) Open the UI and use the Tabs:
- Overview: What the template includes
- Forms & Validation: Fill the form and click Process
- Tables & Data: Demo table with scientific styling
- API Demos: Run devPost, devGet, apiGet (with copy buttons on snippets)
- Charts: Theme-aware Line and Bar charts using Recharts
- Theming: Switch between light/dark/high-contrast (standalone only)
- Local Data Browser: Explore local filesystem roots exposed by dev server

## API usage
The template includes a tiny API client (api.ts) for same-origin calls:
- Real platform endpoints via `/api/...` when online mode is enabled: `apiGet(path)` / `apiPost(path, body)`
- Local-only dev endpoints via `/dev/...` and module actions under `/api/...`: `devGet(path)` / `devPost(path, body)`

Examples:

```ts
import { apiGet, devPost, devGet } from './api';

// Execute module locally (dev server)
const result = await devPost('/execute', { input: { param1: 'demo' } });

// List local data roots (dev server)
const roots = await devGet('/data/roots');

// Fetch real API data (proxied when online mode is enabled)
const samples = await apiGet('/data/alithea-bio/immunopeptidomics/samples?page=1&limit=5&data_source=alithea-hla-db');
```

Notes:
- All calls are same-origin (no CORS issues) because `/api` and `/dev` are served by the dev server.
- Real API proxying requires `hla-compass dev --online` with a valid login.
- TLS verification is enforced; if your local trust store needs a bundle, start dev with `--ca-bundle /path/to/ca.pem`.

## Theming
- When embedded in the platform: the module inherits the platform theme and Ant Design CSS variables.
- When running standalone: the template enables Ant Design CSS variables locally and applies a system theme. Use the Theming tab to switch modes.

## Next steps
- Replace demo form fields with your inputs (map from manifest.json where possible)
- Prefer host-provided `onExecute(params)` when embedded; fallback to `devPost('/execute', ...)` in standalone dev
- Update API calls to your endpoints (enable `--online` to proxy the real API during dev)
- Keep scientific styles (.scientific-*) for coherent visuals
- Add tests if your module has non-trivial logic
- Run `npm run build` to emit a UMD bundle if you are consuming this template outside of the CLI harness

## Performance notes
- The Charts tab loads Plotly on demand from the Plotly CDN; the first time you open the tab a spinner appears while the script is fetched.
- Webpack may warn about the charts chunk exceeding the default asset size. This is expected for the tutorial bundle. Remove `ChartDemo.tsx` (and the tab wiring in `index.tsx`) to silence the warning if you do not need the example.
- If you prefer to keep Plotly offline, swap the CDN loader in `ChartDemo.tsx` for a direct `plotly.js` import and remove the lazy-loading `Suspense` wrapper.
