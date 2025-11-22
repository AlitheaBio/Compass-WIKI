import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider } from '@hla-compass/design-system';
import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

interface ProvidersProps {
  children?: React.ReactNode;
}

// Map host/platform CSS variables (Design System) to AntD tokens
function readAntdTokensFromCSS(): ThemeConfig {
  if (typeof document === 'undefined') {
    return { cssVar: true, token: { colorPrimary: '#0052cc', borderRadius: 8 } } as ThemeConfig;
  }
  const style = getComputedStyle(document.documentElement);

  const colorPrimary = style.getPropertyValue('--color-primary')?.trim() || '#0052cc';
  const colorText = style.getPropertyValue('--color-text')?.trim() || '#1f2937';
  const colorBgBase = style.getPropertyValue('--color-background')?.trim() || '#ffffff';
  const colorBorder = style.getPropertyValue('--color-border')?.trim() || '#e5e7eb';
  const fontFamily = style.getPropertyValue('--font-sans')?.trim() || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  const borderRadiusRaw = style.getPropertyValue('--radius-md')?.trim() || '8px';
  const borderRadius = parseInt(borderRadiusRaw, 10) || 8;

  // Determine algorithm based on contrast of bg/text or explicit theme class
  let isDark = false;
  const body = typeof document !== 'undefined' ? document.body : null;
  if (body) {
    const cls = body.className || '';
    if (cls.includes('dark-theme') || cls.includes('high-contrast-theme')) {
      isDark = true;
    } else if (cls.includes('light-theme')) {
      isDark = false;
    } else {
      // Fallback to media query
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  const token = {
    colorPrimary,
    colorTextBase: colorText,
    colorText,
    colorBgBase,
    colorBorder,
    fontFamily,
    borderRadius,
  } as any;

  return {
    cssVar: true,
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token,
  } as ThemeConfig;
}

export default function Providers({ children }: ProvidersProps) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => readAntdTokensFromCSS());
  const observerRef = useRef<MutationObserver | null>(null);
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    // Apply initial mapping
    setThemeConfig(readAntdTokensFromCSS());

    // Host theme-change event support
    const handleThemeChange = () => setThemeConfig(readAntdTokensFromCSS());
    window.addEventListener('theme-change' as any, handleThemeChange as any);

    // Observe documentElement attribute/style changes (class or inline style)
    observerRef.current = new MutationObserver(() => {
      setThemeConfig(readAntdTokensFromCSS());
    });
    observerRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: false,
    });

    // Also watch prefers-color-scheme changes
    if (window.matchMedia) {
      mqlRef.current = window.matchMedia('(prefers-color-scheme: dark)');
      const mqlListener = () => setThemeConfig(readAntdTokensFromCSS());
      mqlRef.current.addEventListener?.('change', mqlListener);
      // Cleanup media listener in return
      return () => {
        window.removeEventListener('theme-change' as any, handleThemeChange as any);
        observerRef.current?.disconnect();
        mqlRef.current?.removeEventListener?.('change', mqlListener);
      };
    }

    return () => {
      window.removeEventListener('theme-change' as any, handleThemeChange as any);
      observerRef.current?.disconnect();
    };
  }, []);

  // Memoize to avoid unnecessary rerenders of subtree
  const memoTheme = useMemo(() => themeConfig, [themeConfig]);

  return (
    <ConfigProvider componentSize="small" theme={memoTheme}>
      {children}
    </ConfigProvider>
  );
}
