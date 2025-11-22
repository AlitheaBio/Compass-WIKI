import React, { useState } from 'react';
import { Button, Tooltip, message } from '@hla-compass/design-system';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

interface CopyButtonProps {
  code: string;
  size?: 'small' | 'middle' | 'large';
}

const CopyButton: React.FC<CopyButtonProps> = ({ code, size = 'small' }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const fallbackCopy = () => {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      };

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
        } catch (err) {
          // Fallback if Clipboard API is denied or fails
          fallbackCopy();
        }
      } else {
        fallbackCopy();
      }
      setCopied(true);
      message.success('Copied');
      setTimeout(() => setCopied(false), 1000);
    } catch (e) {
      message.error('Copy failed');
    }
  };

  return (
    <Tooltip title={copied ? 'Copied' : 'Copy code'}>
      <Button size={size} icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy} />
    </Tooltip>
  );
};

export default CopyButton;
