/**
 * Theme utilities for SDK UI template
 * Mirrors platform frontend/src/design-system/theme.ts (simplified)
 */

import { theme as antdTheme } from 'antd';

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'system';

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const actualMode = mode === 'system' ? getSystemTheme() : mode;
  // set class on body to leverage variables.css theme sections
  document.body.classList.remove('light-theme', 'dark-theme', 'high-contrast-theme');
  document.body.classList.add(`${actualMode}-theme`);
  // Smooth transition helper
  document.body.classList.add('theme-transition');
  setTimeout(() => document.body.classList.remove('theme-transition'), 300);
  // Notify listeners (e.g., ConfigProvider) that theme variables may have changed
  try {
    // Dispatch a custom event so providers/watchers can update tokens/algorithms
    const ev = new CustomEvent('theme-change', { detail: { mode: actualMode } });
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(ev);
    }
  } catch {
    // no-op if CustomEvent not available
  }
};

export const createAntdTheme = (mode: ThemeMode) => {
  const actualMode = mode === 'system' ? getSystemTheme() : mode;
  const isDark = actualMode === 'dark' || actualMode === 'high-contrast';

  let colorPrimary = '#0052cc';
  let fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  let borderRadius = 8 as number;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      const getVar = (name: string) => (root.style.getPropertyValue(name) || computed.getPropertyValue(name) || '').trim();
      colorPrimary = getVar('--color-primary') || getVar('--ant-color-primary') || colorPrimary;
      fontFamily = getVar('--font-sans') || fontFamily;
      const radiusRaw = getVar('--radius-md');
      const parsed = parseInt(radiusRaw || '', 10);
      if (!Number.isNaN(parsed) && parsed > 0) borderRadius = parsed;
    } catch {
      // ignore and keep defaults
    }
  }

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    cssVar: true,
    token: {
      colorPrimary,
      borderRadius,
      fontFamily,
    },
  } as any;
};
