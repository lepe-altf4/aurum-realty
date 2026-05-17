import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: '#FFFFFF',
        surface: '#F8F6F2',
        's2': '#F2EEE6',
        ink: {
          DEFAULT: '#241911',
          2: '#4A3B2F',
          3: '#7A6A5B',
          4: '#A8998A',
        },
        border: {
          DEFAULT: '#EAE5DC',
          strong: '#D9D1C2',
        },
        accent: '#1A1A1A',
        gold: {
          DEFAULT: '#B3925A',
          soft: '#EFE6D4',
        },
        success: {
          DEFAULT: '#1E4620',
          soft: '#E1EBDF',
        },
        danger: {
          DEFAULT: '#7A1F1F',
          soft: '#F2E3E1',
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
      },
      width: {
        sidebar: '248px',
        drawer: '480px',
      },
    },
  },
  plugins: [],
}
export default config
