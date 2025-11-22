# SDK Template Styling Updates

This document summarizes the changes made to align the SDK templates with the HLA-Compass platform frontend styling.

## Changes Made

### 1. Updated UI Template (`ui-template/frontend/`)

#### **index.tsx** - Main Component Updates
- **Replaced inline styles with Tailwind classes**: All `style={{}}` props replaced with `className` using Tailwind utilities
- **Added scientific design system classes**: `scientific-number`, `scientific-input`, `scientific-table`
- **Consistent spacing**: Using `space-y-5`, `mb-4`, `p-5` for consistent spacing matching platform
- **Color system integration**: Using platform color variables like `text-primary-500`, `text-data-accent`
- **Modern layout patterns**: Grid layouts with `grid grid-cols-1 md:grid-cols-2 gap-4`
- **Enhanced accessibility**: Better color contrast and screen reader support
- **Added ExperimentOutlined icon**: For scientific branding consistency
- **Improved table rendering**: Scientific number formatting with proper color coding
- **Enhanced loading states**: More descriptive loading messages and better visual feedback
- **Better error handling**: Styled error messages with proper coloring

#### **New Configuration Files Added**

**package.json** - Updated dependencies:
- Added `tailwindcss`, `autoprefixer`, `postcss`, `postcss-loader`
- Added `clsx` for conditional class names

**tailwind.config.js** - Complete Tailwind configuration:
- Scientific color palette matching platform (`primary`, `data`, `chart`, `surface` colors)
- Typography settings with scientific fonts (`SF Mono` for monospace)
- Custom spacing, shadows, and animations
- Ant Design compatibility settings

**postcss.config.js** - PostCSS configuration for Tailwind processing

**styles.css** - Comprehensive styling system:
- Tailwind imports (`@tailwind base; @tailwind components; @tailwind utilities;`)
- Scientific styling classes matching platform CSS
- Table styling for data display
- Module container styling
- Accessibility improvements
- Dark theme support (CSS variables)

**webpack.config.js** - Updated build configuration:
- PostCSS integration for Tailwind processing
- CSS loader chain with proper configuration
- Development server setup

**tsconfig.json** - TypeScript configuration for modern React development

### 2. Updated Documentation

**README.md** - Enhanced template documentation:
- Added frontend setup instructions
- Explained styling system features
- Build and development workflow
- Platform consistency information

## Key Styling Improvements

### Visual Consistency
- **Colors**: Uses exact same color palette as platform (`#0052cc` primary, scientific data colors)
- **Typography**: Matches platform fonts (SF Mono for scientific data, Inter for text)
- **Spacing**: Consistent padding, margins using Tailwind's spacing system
- **Shadows**: Soft shadows matching platform (`shadow-soft`, `shadow-medium`)
- **Border radius**: Consistent 8px radius for cards and containers

### Scientific UX Patterns
- **Scientific number display**: Monospace fonts with tabular nums for better alignment
- **Data color coding**: Green for good scores, amber for medium, red for poor
- **Table styling**: Sticky headers, proper padding, scientific data formatting
- **Loading states**: Professional loading indicators with progress descriptions
- **Error handling**: Contextual error messages with proper visual hierarchy

### Responsive Design
- **Mobile-first**: Grid layouts that stack on mobile (`grid-cols-1 md:grid-cols-2`)
- **Flexible containers**: Max-width containers with proper centering
- **Touch-friendly**: Proper spacing for touch interactions

### Accessibility
- **Color contrast**: All colors meet WCAG accessibility standards
- **Screen readers**: Semantic HTML and ARIA labels
- **Keyboard navigation**: Focus management and keyboard shortcuts
- **High contrast mode**: Support for users with visual impairments

## Platform Integration

The SDK templates now provide:
- **Visual consistency** with the main HLA-Compass platform
- **Familiar user experience** for platform users
- **Maintainable styling** through shared design system
- **Professional appearance** matching scientific software standards
- **Responsive behavior** across all device sizes
- **Accessibility compliance** for inclusive access

## Card Header Standardization

- All example cards in the UI template now use a standardized header via the design-system Card component.
- Use the Card props title and optional subtitle; do NOT render your own Typography inside the title prop.
- The Card enforces consistent header typography and spacing, and sets default body padding to p-2 (8px).

Usage:

```tsx
import { Card } from '@hla-compass/design-system';

<Card title="My Section" subtitle="Short description">
  {/* content here; body has p-2 by default */}
</Card>
```

Notes:
- Keep headers concise. Put supplementary information in the body or in the extra prop.
- For actions (copy, etc.), use the extra prop instead of composing a custom header node.

## Development Benefits

- **Faster development**: Pre-configured styling system
- **Consistency**: No style drift between modules and platform
- **Maintainability**: Centralized design system updates
- **Performance**: Optimized CSS with Tailwind's purging
- **Developer experience**: Intellisense and tooling support
