/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A202C',
        surface: '#F7F7F5',
        panel: '#FFFFFF',
        border: '#E4E1DA',
        navy: {
          50: '#EEF2F7',
          100: '#D7E1EC',
          300: '#7C97B4',
          500: '#3A5A80',
          700: '#1F3A5F',
          900: '#122238',
        },
        amber: {
          100: '#FBEAD0',
          300: '#F0C583',
          500: '#E8A33D',
          700: '#B87A22',
        },
        success: '#2F855A',
        danger: '#C53030',
        warning: '#B87A22',
      },
      fontFamily: {
        display: ['"Sora"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 34, 56, 0.06), 0 8px 24px -12px rgba(18, 34, 56, 0.12)',
      },
    },
  },
  plugins: [],
};
