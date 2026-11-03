'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Instagram, Menu, X } from 'lucide-react';
import { BrandMark, WhatsAppIcon } from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { NAV } from './nav';

const MOBILE_QUERY = '(max-width: 1100px)';

interface Props {
  brand: string;
  /** links de contato mostrados no rodapé do menu mobile */
  whatsappUrl?: string | null;
  instagramUrl?: string | null;
}

export function SiteHeader({ brand, whatsappUrl, instagramUrl }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrent = (href: string) => (href === '/' ? path === '/' : !href.includes('#') && path.startsWith(href));

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) btnRef.current?.focus();
  }, []);

  // fecha ao trocar de página
  useEffect(() => setOpen(false), [path]);

  // fio inferior só depois de rolar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // menu aberto: trava a rolagem, isola o conteúdo de trás e escuta Esc
  useEffect(() => {
    const root = document.documentElement;
    const behind = [document.getElementById('conteudo'), document.querySelector<HTMLElement>('.site-footer')];
    root.classList.toggle('menu-open', open);
    behind.forEach((el) => { if (el) el.inert = open; });
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const mq = window.matchMedia(MOBILE_QUERY);
    const onResize = () => { if (!mq.matches) close(); };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onResize);
      root.classList.remove('menu-open');
      behind.forEach((el) => { if (el) el.inert = false; });
    };
  }, [open, close]);

  return (
    <header className="site-header" data-scrolled={scrolled} data-open={open}>
      <div className="container site-header-inner">
        <Link className="brand" href="/" aria-label={`${brand} — início`}>
          <BrandMark />
          <span className="brand-name">{brand}</span>
        </Link>

        <nav className="nav" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} className="nav-link" href={n.href} aria-current={isCurrent(n.href) ? 'page' : undefined}>{n.label}</Link>
          ))}
        </nav>

        <div className="header-tools">
          <ThemeToggle />
          <Link className="btn btn-accent-outline btn-sm" href="/agendar" aria-current={path.startsWith('/agendar') ? 'page' : undefined}>
            Agendar <ArrowUpRight size={16} aria-hidden className="icon-up" />
          </Link>
          <button
            ref={btnRef}
            type="button"
            className="icon-btn menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} strokeWidth={1.5} aria-hidden /> : <Menu size={22} strokeWidth={1.5} aria-hidden />}
          </button>
        </div>
      </div>

      <div ref={menuRef} id="site-menu" className="site-menu" data-open={open} aria-hidden={!open}>
        <nav className="container" aria-label="Menu">
          <ul className="site-menu-list">
            {NAV.map((n, i) => (
              <li key={n.href} style={{ ['--i' as string]: i }}>
                <Link href={n.href} aria-current={isCurrent(n.href) ? 'page' : undefined} onClick={() => close()} tabIndex={open ? undefined : -1}>
                  <span className="index">{String(i + 1).padStart(2, '0')}</span>{n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="container site-menu-foot">
          <Link className="btn btn-primary btn-block" href="/agendar" onClick={() => close()} tabIndex={open ? undefined : -1}>
            Agendar sessão <ArrowUpRight size={16} aria-hidden className="icon-up" />
          </Link>
          <div className="site-menu-meta">
            <div className="social">
              {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" tabIndex={open ? undefined : -1}><WhatsAppIcon size={20} /></a> : null}
              {instagramUrl ? <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" tabIndex={open ? undefined : -1}><Instagram size={20} strokeWidth={1.5} aria-hidden /></a> : null}
            </div>
            <span className="label">{brand}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
