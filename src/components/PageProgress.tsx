'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** Faixa fina no topo enquanto a próxima página carrega. */
export function PageProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    bar.classList.remove('on');
    bar.classList.add('done');
  }, [path, search]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      const bar = ref.current;
      if (!bar) return;
      bar.classList.remove('done');
      void bar.offsetWidth;
      bar.classList.add('on');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return <div ref={ref} className="page-progress" aria-hidden="true" />;
}
