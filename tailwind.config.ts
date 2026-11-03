import type { Config } from 'tailwindcss';

/** Cores, fontes e medidas apontam para os tokens de src/styles/tokens.css. */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: 'var(--color-bg)', alt: 'var(--color-bg-alt)' },
        surface: 'var(--color-surface)',
        line: { DEFAULT: 'var(--color-border)', strong: 'var(--color-border-strong)', input: 'var(--color-border-input)' },
        fg: { DEFAULT: 'var(--color-text)', muted: 'var(--color-text-muted)' },
        accent: { DEFAULT: 'var(--color-accent)', text: 'var(--color-accent-text)', on: 'var(--color-on-accent)' },
        ok: 'var(--color-ok)',
        warn: 'var(--color-warn)',
        danger: 'var(--color-danger)'
      },
      fontFamily: {
        display: ['var(--font-heading)'],
        sans: ['var(--font-text)']
      },
      borderRadius: { DEFAULT: 'var(--radius)' },
      maxWidth: { site: 'var(--container)', narrow: 'var(--container-narrow)' },
      transitionTimingFunction: { brand: 'var(--ease)' }
    }
  },
  // o container do site é a classe .container de src/styles/base.css
  corePlugins: { container: false },
  plugins: []
};

export default config;
