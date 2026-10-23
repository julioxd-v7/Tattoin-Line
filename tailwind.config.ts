import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#121110', surface: '#1c1a18', line: '#2a2724', strong: '#45413b' },
        bone: { DEFAULT: '#ede8e0', muted: '#bdb5a8', dim: '#a8a094' },
        blood: { DEFAULT: 'var(--accent)', ink: '#e0644f' },
        paper: { DEFAULT: '#ede8e0', card: '#fbf9f5', line: '#ddd5c8' }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      maxWidth: { site: '1200px' }
    }
  },
  plugins: []
};

export default config;
