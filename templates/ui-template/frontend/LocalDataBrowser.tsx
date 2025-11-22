import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Spin, Space, Button, message } from '@hla-compass/design-system';
import { devGet } from './api';

const { Text, Title } = Typography;

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  modified: string;
}

const LocalDataBrowser: React.FC = () => {
  const [roots, setRoots] = useState<string[]>([]);
  const [root, setRoot] = useState<string>('');
  const [subdir, setSubdir] = useState<string>('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await devGet<{ roots: string[] }>(`/data/roots`);
        setRoots(data.roots || []);
        if (data.roots && data.roots.length > 0) {
          setRoot(data.roots[0]);
        }
      } catch (e: any) {
        message.error(e.message || 'Failed to load roots');
      }
    })();
  }, []);

  const loadList = async (r = root, sd = subdir) => {
    if (!r) return;
    setLoading(true);
    try {
      const data = await devGet<{ root: string; items: FileItem[] }>(`/data/list?root=${encodeURIComponent(r)}&subdir=${encodeURIComponent(sd)}`);
      setItems(data.items || []);
    } catch (e: any) {
      message.error(e.message || 'Failed to list files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, subdir]);

  const enterDir = (name: string) => {
    setSubdir(prev => prev ? `${prev.replace(/\/$/, '')}/${name}` : name);
  };

  const goUp = () => {
    if (!subdir) return;
    const parts = subdir.split('/');
    parts.pop();
    setSubdir(parts.join('/'));
  };

  return (
    <Card title="Local Data Browser" subtitle="Browse local files" style={{ marginTop: 20 }}>
      <Space style={{ marginBottom: 10 }}>
        <Text strong>Root:</Text>
        <select value={root} onChange={(e) => setRoot(e.target.value)}>
          {roots.map(r => (<option key={r} value={r}>{r}</option>))}
        </select>
        <Text strong>Path:</Text>
        <Text code style={{ userSelect: 'all' }}>{subdir || '/'}</Text>
        <Button size="small" onClick={goUp} disabled={!subdir}>Up</Button>
        <Button size="small" onClick={() => loadList()}>Refresh</Button>
      </Space>

      {loading ? <Spin /> : (
        <List
          size="small"
          bordered
          dataSource={items}
          renderItem={(item: FileItem) => (
            <List.Item style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {item.type === 'dir' ? (
                  <Button type="link" onClick={() => enterDir(item.name)}>[{item.name}]</Button>
                ) : (
                  <Text>{item.name}</Text>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Text type="secondary">{item.type}</Text>
                <Text type="secondary">{new Date(item.modified).toLocaleString()}</Text>
                {item.type === 'file' && (
                  <a href={`/dev/data/file?root=${encodeURIComponent(root)}&path=${encodeURIComponent(item.path)}`} target="_blank" rel="noreferrer">Open</a>
                )}
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default LocalDataBrowser;

