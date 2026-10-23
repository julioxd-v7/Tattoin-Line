'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Revelação ao rolar (IntersectionObserver) e parallax leve das caveiras.
 * Só esconde o que está abaixo da tela no carregamento: a primeira tela aparece completa.
 */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io: IntersectionObserver | null = null;
    const watch = () => {
      if (!io) return;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>('[data-rv]:not(.rv-seen)').forEach((el) => {
        el.classList.add('rv-seen');
        if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('rv-wait'); io!.observe(el); }
      });
    };
    if (typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          el.classList.add('rv-go');
          requestAnimationFrame(() => el.classList.remove('rv-wait'));
          io!.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      watch();
    }
    // conteúdo que aparece depois (filtros, etapas) também entra animado
    const mo = new MutationObserver(() => watch());
    mo.observe(document.body, { childList: true, subtree: true });

    let ticking = false;
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    const update = () => {
      const vh = window.innerHeight;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate3d(0,${((r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax)).toFixed(1)}px,0)`;
      });
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    if (!reduce && items.length) { window.addEventListener('scroll', onScroll, { passive: true }); update(); }
    return () => { io?.disconnect(); mo.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, [path]);
  return null;
}
