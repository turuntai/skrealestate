/** @type {import('tailwindcss').Config} */

/*
 * SK Real Estate — design tokens
 * --------------------------------
 * The palette is drawn from things you actually see in Kathmandu:
 *   crimson   — the Nepali flag / sindoor red. Brand + primary actions.
 *   navy      — the Himalayan night sky. Headers, footer, body copy.
 *   marigold  — sayapatri (marigold) garlands. Accent, highlights, warnings.
 *   jade      — Kathmandu valley terraces. "Verified", "available", success.
 *   brick     — old Newari brick. Warm neutrals instead of cold grey.
 *
 * Every domain concept below (purpose / status / property type) has ONE colour
 * that is used consistently everywhere it appears. See src/lib/taxonomy.ts.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: '#FEF2F4', 100: '#FDE3E8', 200: '#FBC9D3', 300: '#F79FB2',
          400: '#F06B8B', 500: '#E23C66', 600: '#C62244', 700: '#A61837',
          800: '#8A1730', 900: '#74172C', 950: '#410714',
        },
        navy: {
          50: '#F2F6FA', 100: '#E3EBF3', 200: '#C1D5E7', 300: '#8EB3D2',
          400: '#548CB8', 500: '#336F9E', 600: '#245785', 700: '#1D466C',
          800: '#173A5A', 900: '#10243F', 950: '#0A1729',
        },
        marigold: {
          50: '#FEF9EC', 100: '#FCEFC8', 200: '#F9DD8D', 300: '#F5C452',
          400: '#F2AE2C', 500: '#E9A23B', 600: '#C77810', 700: '#A45611',
          800: '#874414', 900: '#733915', 950: '#421C06',
        },
        jade: {
          50: '#EFFAF5', 100: '#D8F3E6', 200: '#B3E6D0', 300: '#81D2B4',
          400: '#4CB894', 500: '#2A9E7B', 600: '#12795E', 700: '#11654F',
          800: '#115041', 900: '#0F4237', 950: '#052620',
        },
        brick: {
          50: '#FAF8F6', 100: '#F3EFEA', 200: '#E7DFD6', 300: '#D6C8B9',
          400: '#BFAA95', 500: '#AB917A', 600: '#9A7D66', 700: '#806655',
          800: '#6A5549', 900: '#57473E', 950: '#2E241F',
        },
      },
      fontFamily: {
        // Figtree is loaded from Google Fonts in index.html. The system stack
        // behind it is what renders until the webfont arrives, and if it never
        // does. `display` is kept as its own key so headings can be changed
        // back to a serif without touching every component.
        sans: ['Figtree', '"Segoe UI"', 'system-ui', '-apple-system', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['Figtree', '"Segoe UI"', 'system-ui', '-apple-system', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        // Figtree has no Devanagari glyphs, so Nepali copy needs its own stack.
        ne: ['"Noto Sans Devanagari"', 'Mangal', 'Kalimati', 'Figtree', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,36,63,.06), 0 4px 16px -4px rgba(16,36,63,.10)',
        lift: '0 4px 8px rgba(16,36,63,.06), 0 16px 40px -12px rgba(16,36,63,.22)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.14)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem' },
      spacing: { '4.5': '1.125rem', '18': '4.5rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.96)' }, '100%': { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .25s ease both',
        'slide-up': 'slide-up .28s cubic-bezier(.22,1,.36,1) both',
        'scale-in': 'scale-in .2s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};
