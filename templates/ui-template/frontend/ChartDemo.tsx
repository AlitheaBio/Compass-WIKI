import React, { useEffect, useMemo, useState } from 'react';
import { Card, Divider, Typography, Spin } from 'antd';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

type PlotComponent = any;

const { Text } = Typography;
const PLOTLY_CDN = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
let plotlyLoadPromise: Promise<void> | null = null;

function ensurePlotlyLoaded(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Plotly requires a browser environment'));
  }

  if (window.Plotly) {
    return Promise.resolve();
  }

  if (plotlyLoadPromise) {
    return plotlyLoadPromise;
  }

  plotlyLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-hla-plotly="true"]');

    const attachListeners = (script: HTMLScriptElement) => {
      script.addEventListener(
        'load',
        () => {
          if (window.Plotly) {
            resolve();
          } else {
            plotlyLoadPromise = null;
            reject(new Error('Plotly global unavailable after script load'));
          }
        },
        { once: true },
      );
      script.addEventListener(
        'error',
        () => {
          plotlyLoadPromise = null;
          reject(new Error('Failed to load Plotly from CDN'));
        },
        { once: true },
      );
    };

    if (existing) {
      attachListeners(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = PLOTLY_CDN;
    script.async = true;
    script.dataset.hlaPlotly = 'true';
    attachListeners(script);
    document.body.appendChild(script);
  });

  return plotlyLoadPromise;
}

const ChartDemo: React.FC = () => {
  const [PlotComponent, setPlotComponent] = useState<PlotComponent | null>(null);
  const [plotlyError, setPlotlyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlotly() {
      try {
        await ensurePlotlyLoaded();
        const factoryModule = await import('react-plotly.js/factory');
        const createPlotlyComponent = (factoryModule.default ?? factoryModule) as unknown as (
          plotly: any,
        ) => PlotComponent;
        const plotly = window.Plotly;
        if (!plotly) {
          throw new Error('Plotly global undefined');
        }
        if (!cancelled) {
          setPlotComponent(() => createPlotlyComponent(plotly));
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unable to load Plotly';
          setPlotlyError(message);
        }
      }
    }

    loadPlotly();

    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        name: `P${i + 1}`,
        score: Math.round((Math.sin(i / 2) * 0.5 + 0.5) * 100),
        value: Math.round((Math.cos(i / 3) * 0.5 + 0.5) * 100),
      })),
    [],
  );

  // Theme-aware colors from CSS variables
  const css = getComputedStyle(document.documentElement);
  const primary = (css.getPropertyValue('--color-primary') || '#0052cc').trim();
  const text = (css.getPropertyValue('--color-text') || '#171717').trim();
  const grid = (css.getPropertyValue('--color-border') || '#e5e5e5').trim();
  const bgContainer = (css.getPropertyValue('--ant-color-bg-container') || '#ffffff').trim();
  const bgPlot = (css.getPropertyValue('--ant-color-bg-elevated') || bgContainer).trim();

  return (
    <Card title="Charts" className="bg-surface-primary shadow-soft border border-gray-200">
      <Text strong className="block mb-2">Recharts (theme-aware)</Text>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={text} />
            <YAxis stroke={text} />
            <ReTooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke={primary} dot={false} />
            <Line type="monotone" dataKey="value" stroke="#17a2b8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ height: 260, marginTop: 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={text} />
            <YAxis stroke={text} />
            <ReTooltip />
            <Legend />
            <Bar dataKey="score" fill={primary} />
            <Bar dataKey="value" fill="#17a2b8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Divider />
      <Text strong className="block mb-2">Plotly (theme-aware)</Text>
      <div className="plotly-container" style={{ height: 340 }}>
        {PlotComponent ? (
          <PlotComponent
            data={[
              {
                x: data.map(d => d.name),
                y: data.map(d => d.score),
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: primary },
                marker: { color: primary },
                name: 'Score',
              },
              {
                x: data.map(d => d.name),
                y: data.map(d => d.value),
                type: 'bar',
                marker: { color: '#17a2b8' },
                name: 'Value',
              },
            ] as any}
            layout={{
              paper_bgcolor: bgContainer,
              plot_bgcolor: bgPlot,
              font: { color: text },
              margin: { l: 50, r: 20, t: 20, b: 40 },
              legend: { orientation: 'h' },
              xaxis: { gridcolor: grid },
              yaxis: { gridcolor: grid },
            } as any}
            config={{ displaylogo: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {plotlyError ? <Text type="danger">{plotlyError}</Text> : <Spin tip="Loading Plotly demo..." />}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChartDemo;
