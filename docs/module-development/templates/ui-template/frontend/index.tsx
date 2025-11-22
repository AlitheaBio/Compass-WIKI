/**
 * HLA-Compass UI Module Template
 * 
 * This template provides a complete React UI for your module.
 * Replace the TODOs with your actual implementation.
 * 
 * This template follows the HLA-Compass platform design system
 * with Tailwind CSS classes and scientific styling patterns.
 */

import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import './styles.css';
import { 
  Button,
  Input,
  Card,
  Alert,
  Space,
  Typography,
  Spin,
  Table,
  Form,
  Row,
  Col,
  Tabs,
  Select,
  DatePicker,
  Upload,
  Slider,
  Switch,
  Radio,
  Checkbox,
  Tag,
  Tooltip,
  Divider,
  Descriptions,
  Collapse,
  Progress,
  Statistic,
  message 
} from '@hla-compass/design-system';

import { apiGet, devPost, devGet } from './api';
import LocalDataBrowser from './LocalDataBrowser';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import CopyButton from './CopyButton';
import { applyTheme } from './theme';
import Providers from './src/app/Providers';

const { Title, Text, Paragraph } = Typography;
const ChartDemo = lazy(() => import('./ChartDemo'));

const DEFAULT_THEME_FALLBACKS = {
  primary: '#827DD3',
  primaryHover: '#6c66b4',
  primaryActive: '#565093',
  text: '#171717',
  background: '#ffffff',
  border: '#e5e5e5',
};

const ensureAntDesignCssVariables = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { hasAntVars: false, fallbackApplied: false };
  }

  const root = document.documentElement;
  const computed = window.getComputedStyle(root);
  const readVar = (name: string) =>
    (root.style.getPropertyValue(name) || computed.getPropertyValue(name) || '').trim();

  const existingPrimary = readVar('--ant-color-primary');

  const fallbackPrimary = existingPrimary || readVar('--color-primary') || DEFAULT_THEME_FALLBACKS.primary;
  const fallbackPrimaryHover =
    readVar('--ant-color-primary-hover') ||
    readVar('--color-primary-hover') ||
    DEFAULT_THEME_FALLBACKS.primaryHover ||
    fallbackPrimary;
  const fallbackPrimaryActive =
    readVar('--ant-color-primary-active') ||
    readVar('--color-primary-active') ||
    DEFAULT_THEME_FALLBACKS.primaryActive ||
    fallbackPrimary;
  const fallbackText = readVar('--ant-color-text') || readVar('--color-text') || DEFAULT_THEME_FALLBACKS.text;
  const fallbackBackground =
    readVar('--ant-color-bg-base') || readVar('--color-background') || DEFAULT_THEME_FALLBACKS.background;
  const fallbackBorder = readVar('--ant-color-border') || readVar('--color-border') || DEFAULT_THEME_FALLBACKS.border;

  const fallbackVars: Record<string, string> = {
    '--ant-color-primary': fallbackPrimary,
    '--ant-color-primary-hover': fallbackPrimaryHover,
    '--ant-color-primary-active': fallbackPrimaryActive,
    '--ant-primary-color': fallbackPrimary,
    '--ant-primary-color-hover': fallbackPrimaryHover,
    '--ant-primary-color-active': fallbackPrimaryActive,
    '--ant-color-text': fallbackText,
    '--ant-color-text-base': fallbackText,
    '--ant-color-bg-base': fallbackBackground,
    '--ant-color-border': fallbackBorder,
  };

  let fallbackApplied = false;

  Object.entries(fallbackVars).forEach(([varName, value]) => {
    if (!readVar(varName) && value) {
      root.style.setProperty(varName, value);
      fallbackApplied = true;
    }
  });

  return { hasAntVars: Boolean(existingPrimary), fallbackApplied };
};

// Module props interface
interface ModuleProps {
  onExecute: (params: any) => Promise<any>;
  initialParams?: any;
}

// Result data interface
interface ResultItem {
  id: string;
  displayValue: string;
  score: number;
  metadata: Record<string, any>;
}

/**
 * Main UI Component
 */
const ModuleUI: React.FC<ModuleProps> = ({ onExecute, initialParams }) => {
  // State management
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [hostHasAntVars, setHostHasAntVars] = useState<boolean>(false);
  const [themeFallbackApplied, setThemeFallbackApplied] = useState<boolean>(false);

  // Tutorial demo state
  const [apiDemoOutput, setApiDemoOutput] = useState<any>(null);
  const [apiDemoError, setApiDemoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [runIdInput, setRunIdInput] = useState<string>('');
  const [runDetails, setRunDetails] = useState<any>(null);
  const [runStatusError, setRunStatusError] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState<boolean>(false);

  // Detect if host app (platform) provides Ant Design CSS variables
  useEffect(() => {
    const { hasAntVars, fallbackApplied } = ensureAntDesignCssVariables();
    setHostHasAntVars(hasAntVars);
    setThemeFallbackApplied(fallbackApplied);
    if (!hasAntVars) {
      // Apply system theme locally to align with platform color tokens
      applyTheme('system');
    }
  }, []);

  // Load Inter font to match platform design
  useEffect(() => {
    const fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap";
    // Check if font is already loaded
    if (document.querySelector(`link[href="${fontUrl}"]`)) {
      return;
    }

    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.setAttribute('crossorigin', '');

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = fontUrl;

    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(fontLink);
  }, []);


  /**
   * Handle form submission (demo)
   */
  const handleSubmit = useCallback(async (values: any) => {
    // Clear previous state
    setError(null);
    setResults(null);
    setSummary(null);
    setLoading(true);

    try {
      // TODO: Prepare your input parameters
      const params = {
        param1: values.param1,
        param2: values.param2
        // Add more parameters as needed
      };

      // Execute the module via provided host callback when embedded, otherwise via local dev server
      const result = onExecute
        ? await onExecute(params)
        : await devPost('/execute', { input: params });

      // Handle the response
      if (result.status === 'success') {
        setResults(result.results);
        setSummary(result.summary);
        message.success('Processing completed successfully');
      } else {
        setError(result.error?.message || 'Processing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [onExecute]);

  /**
   * Clear form and results
   */
  const handleClear = useCallback(() => {
    form.resetFields();
    setResults(null);
    setSummary(null);
    setError(null);
  }, [form]);

  const fetchRunDetails = useCallback(async () => {
    if (!runIdInput) {
      setRunStatusError('Enter a run ID from /v1/module-runs');
      return;
    }
    setRunLoading(true);
    setRunStatusError(null);
    try {
      const payload = await apiGet<any>(`/v1/module-runs/${runIdInput}`);
      setRunDetails(payload);
    } catch (err: any) {
      setRunStatusError(err.message || 'Failed to fetch run');
      setRunDetails(null);
    } finally {
      setRunLoading(false);
    }
  }, [runIdInput]);

  /**
   * Table columns configuration - Scientific styling
   */
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => (
        <Text className="scientific-number font-mono text-sm">{text}</Text>
      )
    },
    {
      title: 'Result',
      dataIndex: 'displayValue',
      key: 'displayValue',
      render: (text: string) => (
        <Text className="text-base">{text}</Text>
      )
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <Text 
          strong 
          className={`scientific-number font-mono ${
            score > 0.8 
              ? 'text-data-accent' 
              : score > 0.5 
              ? 'text-data-warning' 
              : 'text-data-danger'
          }`}
        >
          {(score * 100).toFixed(1)}%
        </Text>
      )
    }
  ];

  // Demo table data
  const demoTableData: ResultItem[] = Array.from({ length: 8 }).map((_, i) => ({
    id: `DEMO-${1000 + i}`,
    displayValue: `Example value ${i + 1}`,
    score: Math.random(),
    metadata: { example: true, index: i + 1, note: 'Demo metadata' },
  }));

  const devExecuteSnippet = `// Execute module locally (dev server)\nconst res = await devPost('/execute', { input: { param1: 'demo', param2: 'optional' } });`;
  const devRootsSnippet = `// List local data roots (dev server)\nconst roots = await devGet('/data/roots');`;
  const apiSamplesSnippet = `// Fetch real API data (proxy enabled with \'hla-compass dev --online\')\nconst samples = await apiGet('/data/alithea-bio/immunopeptidomics/samples?page=1&limit=5&data_source=alithea-hla-db');`;

  const runDevExecute = async () => {
    try {
      setApiDemoError(null);
      const res = await devPost('/execute', { input: { param1: 'demo', param2: 'optional' } });
      setApiDemoOutput(res);
      message.success('devPost /execute completed');
    } catch (e: any) {
      setApiDemoError(e.message || 'devPost failed');
      setApiDemoOutput(null);
    }
  };

  const runDevRoots = async () => {
    try {
      setApiDemoError(null);
      const roots = await devGet<any>('/data/roots');
      setApiDemoOutput(roots);
      message.success('devGet /data/roots completed');
    } catch (e: any) {
      setApiDemoError(e.message || 'devGet failed');
      setApiDemoOutput(null);
    }
  };

  const runApiSamples = async () => {
    try {
      setApiDemoError(null);
      const samples = await apiGet<any>(`/data/alithea-bio/immunopeptidomics/samples?page=1&limit=5&data_source=alithea-hla-db`);
      setApiDemoOutput(samples);
      message.success('apiGet samples completed');
    } catch (e: any) {
      const tip = " — Tip: enable online mode with 'hla-compass dev --online' and login via 'hla-compass auth login'";
      setApiDemoError((e.message || 'apiGet failed') + tip);
      setApiDemoOutput(null);
    }
  };

  const Overview = (
    <Card title="Module UI Tutorial Template" subtitle="Overview" className="bg-surface-primary shadow-soft border border-gray-200">
      <Paragraph className="text-gray-600 mb-4">
        This template demonstrates common UI patterns, API calls, and styling best practices to help you build a module UI that feels native inside the HLA-Compass platform.
      </Paragraph>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Theme & Styling">Inherits platform theme when embedded; standalone dev uses Ant Design CSS variables + platform-like CSS tokens.</Descriptions.Item>
        <Descriptions.Item label="API Access">Same-origin calls via /api (real) and /dev (local) through a tiny client wrapper.</Descriptions.Item>
        <Descriptions.Item label="What’s included">Forms & validation, tables, feedback, API demos, theming controls, local data browser.</Descriptions.Item>
      </Descriptions>
      <Divider />
      <Space direction="vertical" size="small">
        <Text>Quick Start:</Text>
        <ol className="list-decimal ml-6 space-y-1">
          <li>Fill the form in “Forms & Validation” and click Process (uses devPost /execute)</li>
          <li>Explore “Tables & Data” and expand rows</li>
          <li>Run calls in “API Demos” and inspect JSON output</li>
          <li>Browse local files under “Local Data Browser”</li>
        </ol>
      </Space>
    </Card>
  );

  const FormsAndValidation = (
    <Card title="Forms & Validation" subtitle="Common controls wired to a demo submission." className="bg-surface-primary shadow-soft border border-gray-200">
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialParams}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Parameter 1" name="param1" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Required text input" disabled={loading} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Parameter 2" name="param2">
              <Input placeholder="Optional text input" disabled={loading} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Select" name="select">
              <Select
                placeholder="Choose an option"
                options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Date" name="date">
              <DatePicker className="w-full" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Slider" name="slider">
              <Slider min={0} max={100} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Toggle" name="toggle" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Radio" name="radio">
              <Radio.Group>
                <Radio value="x">X</Radio>
                <Radio value="y">Y</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Checkbox" name="checkbox" valuePropName="checked">
              <Checkbox>Enable option</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Add a note for this run" />
        </Form.Item>
        <Form.Item label="Upload (demo only)">
          <Upload.Dragger beforeUpload={() => false} multiple>
            <p className="ant-upload-drag-icon">📄</p>
            <p className="ant-upload-text">Drag & drop files here, or click to select</p>
            <p className="ant-upload-hint">Files aren’t uploaded; this is a UI demo</p>
          </Upload.Dragger>
        </Form.Item>
        <Divider />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} htmlType="submit" loading={loading}>Process</Button>
          <Button icon={<ClearOutlined />} onClick={handleClear} disabled={loading}>Clear</Button>
          <Button type="dashed" onClick={async () => {
            form.setFieldsValue({
              param1: 'DEMO-PARAM-1',
              param2: 'DEMO-PARAM-2',
              select: 'a',
              slider: 42,
              toggle: true,
              radio: 'x',
              checkbox: true,
              notes: 'Scaffolded example run',
            });
            await form.validateFields();
            form.submit();
          }}>Scaffold me</Button>
          <Tag color="blue">Validation built-in</Tag>
          <Tooltip title="Forms use Ant Design + Tailwind for spacing">
            <Tag>Hint</Tag>
          </Tooltip>
        </Space>
      </Form>
      {error && (
        <Alert message="Analysis Error" description={error} type="error" showIcon closable onClose={() => setError(null)} className="mt-4" />
      )}
      {loading && (
        <div className="text-center py-6"><Spin /></div>
      )}

      {(results || summary) && (
        <>
          <Divider />
          <Title level={4} className="text-gray-800 mb-2">Results</Title>
          {summary && (
            <Card size="small" className="mb-3">
              <pre className="bg-white p-3 rounded border text-sm font-mono overflow-auto max-h-60">{JSON.stringify(summary, null, 2)}</pre>
            </Card>
          )}
          {Array.isArray(results) ? (
            <Table
              dataSource={results as any}
              columns={columns}
              rowKey="id"
              className="scientific-table"
              pagination={{ pageSize: 10, showSizeChanger: true }}
            />
          ) : results ? (
            <pre className="bg-white p-3 rounded border text-sm font-mono overflow-auto max-h-80">{JSON.stringify(results, null, 2)}</pre>
          ) : null}
        </>
      )}
    </Card>
  );

  const TablesAndData = (
    <Card title="Tables & Data" subtitle="Scientific table styles, expandable rows, pagination." className="bg-surface-primary shadow-soft border border-gray-200">
      <Table
        dataSource={demoTableData}
        columns={columns}
        rowKey="id"
        className="scientific-table"
        pagination={{ pageSize: 5, showSizeChanger: true }}
        expandable={{
          expandedRowRender: (record: ResultItem) => (
            <div className="p-4 bg-gray-50 border-l-4 border-primary-300">
              <Text strong className="text-gray-700 block mb-2">Metadata:</Text>
              <pre className="bg-white p-3 rounded border text-sm font-mono overflow-auto max-h-64">{JSON.stringify(record.metadata, null, 2)}</pre>
            </div>
          ),
        }}
      />
      <Divider />
      <Space wrap>
        <Statistic title="Demo Count" value={demoTableData.length} />
        <Progress percent={Math.round(demoTableData.reduce((a, r) => a + r.score, 0) / demoTableData.length * 100)} style={{ width: 200 }} />
      </Space>
    </Card>
  );

  const ApiDemos = (
    <Card title="API Demos" subtitle="Demonstrates devPost, devGet, and apiGet usage." className="bg-surface-primary shadow-soft border border-gray-200">
      <div className="mb-2">
        <Alert type="info" showIcon message="Tip: To call real API endpoints, start dev with --online and login via 'hla-compass auth login'. You can also specify --ca-bundle for custom trust stores." />
      </div>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Space wrap>
            <Button onClick={runDevExecute} type="primary">Run devPost /execute</Button>
            <Button onClick={runDevRoots}>Run devGet /data/roots</Button>
            <Button onClick={runApiSamples}>Run apiGet samples</Button>
          </Space>
        </div>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card size="small" title="devPost /execute (snippet)" extra={<CopyButton code={devExecuteSnippet} />}>
              <pre className="text-xs">{devExecuteSnippet}</pre>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title="devGet /data/roots (snippet)" extra={<CopyButton code={devRootsSnippet} />}>
              <pre className="text-xs">{devRootsSnippet}</pre>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" title="apiGet samples (snippet)" extra={<CopyButton code={apiSamplesSnippet} />}>
              <pre className="text-xs">{apiSamplesSnippet}</pre>
            </Card>
          </Col>
        </Row>
        <Collapse items={[{
          key: 'output',
          label: 'Last response output',
          children: (
            <pre className="bg-white p-3 rounded border text-sm font-mono overflow-auto max-h-80">{apiDemoOutput ? JSON.stringify(apiDemoOutput, null, 2) : 'No output yet'}</pre>
          ),
        }]} />
        {apiDemoError && <Alert type="error" message={apiDemoError} showIcon />}
      </Space>
    </Card>
  );

  const Theming = (
    <Card title="Theming" subtitle="Switch theme in standalone dev; embedded mode inherits platform" className="bg-surface-primary shadow-soft border border-gray-200">
      {!hostHasAntVars && themeFallbackApplied && (
        <Alert
          type="warning"
          showIcon
          message="Using local theme defaults"
          description="Host CSS variables were missing, so the template applied safe defaults to keep styling consistent."
          className="mb-4"
        />
      )}
      {hostHasAntVars ? (
        <Alert type="info" message="Embedded mode" description="The platform controls theme. Theme toggles are disabled here." />
      ) : (
        <Space>
          <Button onClick={() => applyTheme('light')}>Light</Button>
          <Button onClick={() => applyTheme('dark')}>Dark</Button>
          <Button onClick={() => applyTheme('high-contrast')}>High Contrast</Button>
          <Button onClick={() => applyTheme('system')}>System</Button>
        </Space>
      )}
    </Card>
  );

  const DataBrowser = (
    <div>
      <LocalDataBrowser />
    </div>
  );

  const RunInspector = (
    <Card title="Run Viewer" subtitle="Fetch canonical run payloads via /v1/module-runs/{id}." className="bg-surface-primary shadow-soft border border-gray-200">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input.Search
          placeholder="Enter run ID (e.g., 2fbb1e1e-...)"
          value={runIdInput}
          onChange={(e) => setRunIdInput(e.target.value)}
          loading={runLoading}
          enterButton="Fetch run"
          onSearch={fetchRunDetails}
        />
        {runStatusError && <Alert type="error" message={runStatusError} showIcon closable onClose={() => setRunStatusError(null)} />}
        {runLoading && (
          <div className="text-center py-6"><Spin tip="Loading run details" /></div>
        )}
        {runDetails && (
          <Card size="small" title="Run context JSON">
            <pre className="bg-white p-3 rounded border text-sm font-mono overflow-auto max-h-80">{JSON.stringify(runDetails, null, 2)}</pre>
          </Card>
        )}
      </Space>
    </Card>
  );

  const Charts = (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Spin size="large" tip="Loading charts..." />
        </div>
      }
    >
      <ChartDemo />
    </Suspense>
  );

  const content = (
    <div className="module-container max-w-screen-lg mx-auto p-5 space-y-5">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'overview', label: 'Overview', children: Overview },
          { key: 'forms', label: 'Forms & Validation', children: FormsAndValidation },
          { key: 'tables', label: 'Tables & Data', children: TablesAndData },
          { key: 'api', label: 'API Demos', children: ApiDemos },
          { key: 'runs', label: 'Run Viewer', children: RunInspector },
          { key: 'charts', label: 'Charts', children: Charts },
          { key: 'theming', label: 'Theming', children: Theming },
          { key: 'browser', label: 'Local Data Browser', children: DataBrowser },
        ]}
      />
    </div>
  );

  return (
    <Providers>
      {content}
    </Providers>
  );
};

// Expose the component on window for the dev server UMD wrapper fallback
// This ensures /ui can mount the UI even if the bundler doesn't emit the UMD global as expected.
if (typeof window !== 'undefined') {
  // @ts-ignore
  (window as any).ModuleUI = ModuleUI;
}

export default ModuleUI;
