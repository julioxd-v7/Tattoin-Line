'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Revelação ao rolar (IntersectionObserver): entrada progressiva e discreta dos elementos com data-rv.
 * Só esconde o que está abaixo da tela no carregamento: a primeira tela aparece completa.
 */
export function Motion() {
  const path = usePathname();
  useEffect(() => {
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

    return () => {
      io?.disconnect(); mo.disconnect();
      // o que ainda esperava a entrada volta ao estado inicial; senão, ao montar de novo
      // (modo estrito do React, troca de página), ninguém mais observa e fica invisível
      document.querySelectorAll<HTMLElement>('.rv-wait').forEach((el) => el.classList.remove('rv-wait', 'rv-seen'));
    };
  }, [path]);
  return null;
}
