declare module 'react-plotly.js';
// If @types/recharts is unavailable in some environments, this fallback avoids TS7016.
// It can be removed when proper types are installed.
declare module 'recharts';

declare global {
  interface Window {
    Plotly?: any;
  }
}

export {};
