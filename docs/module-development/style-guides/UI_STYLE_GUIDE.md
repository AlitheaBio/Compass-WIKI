# UI Style Guide

**Version:** 1.0  
**Last Updated:** 2025-10-08

This guide defines the visual design system, component usage patterns, theming model, and development guidelines for the HLA-Compass platform frontend.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Design System Wrappers](#design-system-wrappers)
3. [Theming Model](#theming-model)
4. [Component Guidelines](#component-guidelines)
5. [Plotly Variant Policy](#plotly-variant-policy)
6. [Module Loader Allowlist & CSP](#module-loader-allowlist--csp)
7. [Accessibility Standards](#accessibility-standards)
8. [Code Quality Rules](#code-quality-rules)

---

## Design Tokens

Design tokens are the foundational design values used throughout the application. All tokens are defined in `frontend/src/design-system/tokens/index.ts`.

### Color Tokens

#### Brand Colors
```typescript
colors.primary[500]  // Primary brand color: #827DD3
colors.primary[600]  // Darker shade
colors.primary[400]  // Lighter shade
```

Available shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

#### Semantic Colors
- **Success:** `colors.success[500]` - #0ea5e9 (blue-based success)
- **Error:** `colors.error[500]` - #ef4444 (red)
- **Warning:** `colors.warning[500]` - #f59e0b (amber)

#### Neutral Colors
```typescript
colors.neutral[0]    // White: #ffffff
colors.neutral[50]   // Off-white: #fafafa
colors.neutral[500]  // Mid-gray: #737373
colors.neutral[900]  // Near-black: #171717
colors.neutral[1000] // Black: #000000
```

### Typography Tokens

#### Font Families
```typescript
typography.fontFamily.sans  // System font stack
typography.fontFamily.mono  // Monospace for code
```

#### Font Sizes (Major Third Scale - 1.25 ratio)
```typescript
typography.fontSize.xs      // 12px
typography.fontSize.sm      // 14px
typography.fontSize.base    // 16px
typography.fontSize.lg      // 18px
typography.fontSize.xl      // 20px
typography.fontSize['2xl']  // 24px
typography.fontSize['3xl']  // 30px
typography.fontSize['4xl']  // 36px
typography.fontSize['5xl']  // 48px
typography.fontSize['6xl']  // 60px
```

#### Font Weights
```typescript
typography.fontWeight.light     // 300
typography.fontWeight.normal    // 400
typography.fontWeight.medium    // 500
typography.fontWeight.semibold  // 600
typography.fontWeight.bold      // 700
```

### Spacing Tokens

Spacing values follow an 8 px rhythm expressed with Tailwind-style units:
```typescript
spacing[0]   // 0px
spacing[1]   // 4px
spacing[2]   // 8px   ← base unit
spacing[3]   // 12px
spacing[4]   // 16px
spacing[5]   // 20px
spacing[6]   // 24px
spacing[8]   // 32px
spacing[10]  // 40px
spacing[12]  // 48px
spacing[16]  // 64px
spacing[20]  // 80px
spacing[24]  // 96px
spacing[32]  // 128px
```
> Use multiples of `spacing[2]` for 8 px rhythm (e.g., `spacing[4]` = 16px gap between cards).

### Using Tokens

**Preferred:** Use Tailwind utilities and design-system components (tokens are already synced):
```tsx
// Tailwind utility example
<div className="text-primary-500 text-sm p-2">Tokens via Tailwind</div>

// Design-system component example
import { Card, Text } from '@/design-system';

<Card className="p-2">
  <Text className="text-neutral-600">Consistent text role</Text>
</Card>
```

**Inline style:** Only for dynamic geometry (height/width) inside design-system components.

---

## Design System Wrappers

All Ant Design (antd) components must be accessed through design system wrappers located in `frontend/src/design-system/`.

### Why Wrappers?

1. **Centralized Theming:** Ensures consistent application of tokens
2. **Future-Proofing:** Easy to swap underlying library
3. **Customization:** Single place to extend or override behavior
4. **Type Safety:** Enhanced TypeScript types

### Available Wrappers

| Component | Import Path | Wraps |
|-----------|-------------|-------|
| Button | `@/design-system` → `Button` | antd Button |
| Input | `@/design-system` → `Input` | antd Input |
| Select | `@/design-system` → `Select` | antd Select |
| Table | `@/design-system` → `Table` | antd Table |
| Card | `@/design-system` → `Card` | antd Card |
| Modal | `@/design-system` → `Modal` | antd Modal |
| Form | `@/design-system` → `Form` | antd Form |
| SearchInput | `@/design-system` → `Search` | Custom component |
| Badge | `@/design-system` → `Badge` | antd Badge |
| Tabs | `@/design-system` → `Tabs` | antd Tabs |
| Typography | `@/design-system` → `Typography` | antd Typography |
> Import UI primitives from the aggregate index: `import { Button, Card, Table } from '@/design-system';`

### Usage Examples

**✅ Correct:**
```tsx
import { Button, Card, Table } from '@/design-system';

function MyComponent() {
  return (
    <Card>
      <Table dataSource={data} columns={columns} />
      <Button type="primary">Submit</Button>
    </Card>
  );
}
```

**❌ Incorrect:**
```tsx
import { Button } from 'antd'; // Direct antd import forbidden
```

### ESLint Enforcement

ESLint is configured to prevent direct antd imports outside of:
- `src/design-system/**`
- `src/app/providers.tsx`

Violating this rule will result in a build error.

---

## Theming Model

The platform supports **light** and **dark** themes with dynamic switching.

### Theme Provider

Themes are configured in `frontend/src/app/providers.tsx` using Ant Design's `ConfigProvider` with design-system tokens:

```tsx
import { colors, getCSSVariables } from '@/design-system/tokens';

const themeConfig = {
  token: {
    colorPrimary: colors.primary[500],
    colorSuccess: colors.success[500],
    colorWarning: colors.warning[500],
    colorError: colors.error[500],
    borderRadius: 8,
  },
  components: {
    // component overrides...
  },
};

<ConfigProvider theme={themeConfig} componentSize="small">
  {children}
</ConfigProvider>
```

### Theme Structure

Themes are objects containing:
- **Token:** Color, typography, spacing overrides
- **Components:** Per-component style overrides

### Theme Switching

Users can toggle theme via the UI store:
```typescript
import { useUIStore } from '@/app/store';

const { theme, toggleTheme } = useUIStore();
```

Theme preference is stored in the UI Zustand slice (without persisting auth tokens). `Providers` also apply CSS variables from `getCSSVariables(theme)` to `document.documentElement`, keeping Tailwind utilities and AntD tokens aligned.

### Custom Component Theming

When creating custom components, use tokens and respect theme:

```tsx
import { colors } from '@/design-system/tokens';
import { useUIStore } from '@/app/store';

function MyComponent() {
  const { theme } = useUIStore();
  
  const bgColor = theme === 'light' ? colors.neutral[50] : colors.neutral[900];
  
  return <div style={{ backgroundColor: bgColor }}>...</div>;
}
```

**Preferred:** Use Tailwind's dark mode utilities:
```tsx
<div className="bg-neutral-50 dark:bg-neutral-900">...</div>
```

---

## Component Guidelines

### Layout Components

Use semantic HTML and ARIA landmarks:
```tsx
<main role="main">
  <section aria-label="Dashboard Overview">
    <h1>Dashboard</h1>
    {/* Content */}
  </section>
</main>
```

### Forms

Always associate labels with inputs:
```tsx
<Form.Item label="Email" name="email">
  <Input type="email" aria-label="Email address" />
</Form.Item>
```

### Data Tables

- Use `<Table>` from design system
- Provide column headers with proper `title` props
- Support keyboard navigation
- Include export functionality with formula injection protection

### Buttons

- Always provide accessible text or `aria-label`
- Use semantic button types: `primary`, `default`, `link`, `text`
- Include loading states for async actions

---

## Plotly Variant Policy

The platform uses a shared Plot wrapper (`frontend/src/components/plotly/Plot.tsx`) that loads Plotly lazily and enforces a single distribution per surface. Two variants are available:

- `'basic'` → `plotly.js-basic-dist-min` (bar, line, scatter, pie, etc.)
- `'full'` → `plotly.js-dist-min` (advanced charts: heatmaps, maps, 3D)

### Rules
1. Choose one variant per route / page. Use `'basic'` unless advanced traces are required.
2. Document any `'full'` usage in code review (why basic was insufficient).
3. Always import Plot via the shared wrapper to benefit from lazy-loading and consistent styling.

### Implementation
```tsx
import { Suspense } from 'react';
import { Plot } from '@/components/plotly/Plot';
import { Skeleton } from '@/design-system';

<Suspense fallback={<Skeleton />}>
  <Plot variant="basic" data={data} layout={layout} config={config} />
</Suspense>
```

### Adding New Charts
1. Evaluate whether `'basic'` supports the chart type.
2. If `'full'` is required, justify in the PR description.
3. Use the shared Plot wrapper; never import Plotly bundles directly.

---

## Module Loader Allowlist & CSP

Remote modules are loaded via the Module Federation runtime (`frontend/src/services/dynamicModuleLoaderFederation.ts`). Security is enforced through an allowlist, signature verification, and optional integrity checks.

### Allowlist
- Allowed hosts are defined in `frontend/module-federation.config.ts` (`allowedModuleSources`).
- Only manifests and remote entries from these hosts are loaded.
- Module policies (blocked APIs, resource limits, permissions) are configured in `DEFAULT_SECURITY_POLICY`.

### Frontend Responsibilities
- Fetch remote modules exclusively through the runtime loader.
- Surface module provenance, signature status, and requested permissions in the UI.
- Never execute code from untrusted or user-supplied URLs.

### CSP Guidance
Enforce a strict CSP at the API gateway / CDN layer:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  connect-src 'self' https://<allowed-module-hosts>;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
```

Plotly and other visualization libraries are bundled via npm and lazy-loaded, so no external script CDs are required.

---

## Accessibility Standards

The platform targets **WCAG 2.1 Level AA** compliance.

### Automated Checks

**ESLint Plugin:** `eslint-plugin-jsx-a11y` enforces accessibility rules:
- Alt text for images
- ARIA properties validation
- Keyboard event handlers
- Label associations
- Role requirements

**Axe Tests:** Unit tests with `vitest-axe` validate:
- Dashboard
- Modules (catalog & execution)
- Data Explorer

### Manual Testing

Perform periodic manual audits:
- Keyboard-only navigation
- Screen reader testing (NVDA, VoiceOver)
- Color contrast validation
- Focus management

### Key Requirements

1. **Semantic HTML:** Use correct elements (`button`, `nav`, `main`, `section`)
2. **Keyboard Navigation:** All interactive elements accessible via keyboard
3. **Focus Indicators:** Visible focus states (no `outline: none` without replacement)
4. **Color Contrast:** 4.5:1 for normal text, 3:1 for large text
5. **ARIA Labels:** Provide labels for icon-only buttons and complex widgets

---

## Code Quality Rules

### ESLint Configuration

**Enforced Rules:**
- No inline styles (use Tailwind + design-system). Inline styles are permitted only for dynamic geometry (height/width) inside design-system components.
- No hex color literals (use design tokens; add `@audit-allow-hex` comment if unavoidable)
- No Tailwind `gray-*` classes (use `neutral-*`)
- No direct antd imports outside design-system/
- Accessibility rules from jsx-a11y

### Import Guidelines

**Preferred Order:**
1. React imports
2. Third-party libraries
3. Internal absolute imports (`@/...`)
4. Relative imports
5. Styles/assets

**Design-System Boundary:**
- Import UI components from `@/design-system`; never from `'antd'` in feature code.

**Alias Paths:**
```typescript
@/          → src/
@/design-system → src/design-system
@/components    → src/components
@/features      → src/features
@/services      → src/services
@/utils         → src/utils
```

### File Naming Conventions

- **Components:** PascalCase (`Button.tsx`, `DataTable.tsx`)
- **Utilities:** camelCase (`formatDate.ts`, `apiClient.ts`)
- **Tests:** `.test.tsx` or `.spec.tsx`
- **Types:** `.types.ts` or inline in component file

### Component Structure

```tsx
// 1. Imports
import React from 'react';
import { Button } from '@/design-system';

// 2. Types
interface MyComponentProps {
  title: string;
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}

// 4. Default export (if needed)
export default MyComponent;
```

---

## Development Workflow

### Starting Development

1. **Run dev server:** `npm run dev`
2. **Run tests:** `npm run test`
3. **Lint:** `npm run lint`
4. **Type check:** `npm run type-check`

### Before Committing

1. Fix ESLint errors: `npm run lint -- --fix`
2. Run tests: `npm run test`
3. Verify build: `npm run build`

### Kitchen Sink Page

View all design system components: `/kitchen-sink`

Use this page for:
- Visual regression testing
- Component exploration
- Theme validation
- Screenshot generation

---

## Resources

- **Ant Design Docs:** https://ant.design/components/overview/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **React Plotly.js:** https://plotly.com/javascript/react/

---

## Questions & Support

For questions about:
- **Design tokens:** Review `frontend/src/design-system/tokens/index.ts`
- **Component wrappers:** Check `frontend/src/design-system/`
- **Theme configuration:** See `frontend/src/app/providers.tsx`
- **ESLint rules:** Review `frontend/eslint.config.js`

---

**Document Owner:** Frontend Team  
**Review Cycle:** Quarterly or as needed
