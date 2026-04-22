import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-family)', 'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Modern professional color palette - uses CSS variables for dark mode support
        'primary-dark': 'var(--color-primary-dark, #1A1D29)',
        'primary-accent': 'var(--color-primary-accent, #0073EA)',
        'secondary-accent': 'var(--color-secondary-accent, #00C875)',
        'main-bg': 'var(--color-main-bg, #F7F8FA)',
        'primary-text': 'var(--color-primary-text, #1A1D29)',
        'secondary-text': 'var(--color-secondary-text, #6B7280)',
        'muted-text': 'var(--color-muted-text, #9CA3AF)',
        'warning': 'var(--color-warning, #FFB020)',
        'danger': 'var(--color-danger, #F24822)',
        'info': '#579BFC',
        // Additional colors with dark mode support
        'sidebar-bg': 'var(--color-sidebar-bg, #FFFFFF)',
        'sidebar-hover': 'var(--color-hover-bg, #F5F7FA)',
        'card-bg': 'var(--color-card-bg, #FFFFFF)',
        'border-light': 'var(--color-border, #E5E7EB)',
        'border-medium': 'var(--color-border, #D1D5DB)',
        'input-bg': 'var(--color-input-bg, #FFFFFF)',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }], // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      },
      spacing: {
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
        '26': '6.5rem', // 104px
        '30': '7.5rem', // 120px
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
        'modal': '16px',
        'premium': '24px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card': '0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
        'elevated': '0 8px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'hover': '0 12px 28px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)',
        'xl': '0 16px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
        'premium': '0 24px 60px rgba(0, 0, 0, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        '3d': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [
    tailwindcssAnimate,
  ],
}