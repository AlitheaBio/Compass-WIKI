/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#b3d1ff',
          200: '#80b1ff',
          300: '#4d91ff',
          400: '#1a71ff',
          500: '#0052cc',
          600: '#0041a3',
          700: '#00317a',
          800: '#002052',
          900: '#001029',
        },
        // Scientific data colors - optimized for accessibility
        data: {
          primary: '#0052cc',    // Deep blue for primary data
          secondary: '#17a2b8',  // Teal for secondary data
          accent: '#28a745',     // Green for positive/confirmation
          warning: '#ffc107',    // Amber for warnings
          danger: '#dc3545',     // Red for errors/danger
          info: '#007bff',       // Blue for information
          neutral: '#6c757d',    // Gray for neutral states
        },
        // Chart colors - scientifically chosen for distinguishability
        chart: {
          blue: '#0052cc',
          teal: '#17a2b8',
          green: '#28a745',
          orange: '#fd7e14',
          purple: '#6f42c1',
          pink: '#e83e8c',
          indigo: '#6610f2',
          cyan: '#20c997',
          lime: '#7cc84d',
          gray: '#6c757d',
        },
        // Surface colors for scientific interfaces
        surface: {
          primary: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#e9ecef',
          elevated: '#ffffff',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'chart': '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  // Important for Ant Design compatibility
  corePlugins: {
    preflight: false,
  },
  // Performance optimizations
  future: {
    hoverOnlyWhenSupported: true,
  },
}