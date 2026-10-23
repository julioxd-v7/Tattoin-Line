'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SkullIcon } from './Icons';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/tatuagens', label: 'Tatuagens' },
  { href: '/projetos', label: 'Projetos disponíveis' },
  { href: '/estilos', label: 'Estilos' },
  { href: '/simulador', label: 'Simulador' },
  { href: '/precos', label: 'Preços' },
  { href: '/#sobre', label: 'Sobre mim' },
  { href: '/cadastro', label: 'Cadastro' }
];

export function SiteHeader({ brand }: { brand: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const isCurrent = (href: string) => (href === '/' ? path === '/' : !href.includes('#') && path.startsWith(href));
  return (
    <header className="site-header">
      <div className="wrap" style={{ position: 'relative' }}>
        <Link className="brand" href="/"><SkullIcon /><span>{brand}</span></Link>
        <nav className={`nav${open ? ' open' : ''}`} id="nav" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isCurrent(n.href) ? 'page' : undefined}>{n.label}</Link>
          ))}
          <Link className="btn btn-accent btn-sm" href="/agendar" aria-current={path.startsWith('/agendar') ? 'page' : undefined}>Agendar</Link>
        </nav>
        <div className="header-tools">
          <ThemeToggle />
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="nav" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>
    </header>
  );
}
