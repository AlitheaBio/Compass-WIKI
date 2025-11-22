/**
 * Lightweight fallback re-export for the design system.
 *
 * When the full @hla-compass/design-system package is not installed
 * (e.g. when this template is used standalone), we fall back to Ant Design
 * so the example UI remains functional. Consumers embedding the template
 * alongside the real design system can rely on the package name without
 * adjusting imports.
 */
export * from 'antd';

// Ensure the message API remains available regardless of namespace style.
export { message } from 'antd';
