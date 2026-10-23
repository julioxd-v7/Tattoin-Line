'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

function effective(): Theme {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Alterna entre tema claro e escuro; sem escolha salva, segue o sistema. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    setTheme(effective());
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setTheme(effective());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const toggle = () => {
    const next: Theme = effective() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('tl-theme', next); } catch { /* sem armazenamento: vale só nesta visita */ }
    setTheme(next);
  };
  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-label={theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'} aria-pressed={theme === 'light'} title="Tema claro / escuro">
      {theme === 'light' ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
    </button>
  );
}
