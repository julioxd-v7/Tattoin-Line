'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface BrowserWork {
  slug: string; title: string; style: string | null; region: string | null; year: number | null;
  art: string; cover: string | null; coverAlt: string | null; photos: number;
}

const DIRS = ['left', 'up', 'up', 'right'];

export function PortfolioBrowser({ works, styles, initialStyle }: { works: BrowserWork[]; styles: string[]; initialStyle?: string }) {
  const [style, setStyle] = useState(initialStyle && styles.includes(initialStyle) ? initialStyle : 'Todos');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return works.filter((w) => (style === 'Todos' || w.style === style) && (!t || `${w.title} ${w.style ?? ''} ${w.region ?? ''}`.toLowerCase().includes(t)));
  }, [works, style, q]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <p className="small" aria-live="polite" style={{ margin: 0 }}>{list.length} {list.length === 1 ? 'trabalho' : 'trabalhos'}</p>
        <label className="field" style={{ width: '100%', maxWidth: 380 }}>
          <span>Pesquisar</span>
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="serpente, costela, flor…" style={{ borderRadius: 999 }} />
        </label>
      </div>
      <div className="filters" role="group" aria-label="Filtrar por estilo">
        {['Todos', ...styles].map((s) => (
          <button key={s} type="button" className="filter" aria-pressed={style === s} onClick={() => setStyle(s)}>{s}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <p className="h3">Nenhum trabalho encontrado.</p>
          <p className="muted" style={{ margin: 0 }}>Tente outro estilo ou limpe a pesquisa.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setStyle('Todos'); setQ(''); }}>Limpar filtros</button>
        </div>
      ) : (
        <div className="grid" style={{ paddingBottom: 96 }}>
          {list.map((w, i) => (
            <Link key={w.slug} href={`/tatuagens/${w.slug}`} className="work" data-rv={DIRS[i % 4]} style={{ ['--d' as string]: `${(i % 4) * 90}ms` }}>
              <div className="ph">
                {w.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.cover} alt={w.coverAlt ?? w.title} loading="lazy" decoding="async" />
                ) : null}
                {w.style ? <span className="num">{w.style}</span> : null}
                {w.photos > 1 ? <span className="count">{w.photos} fotos</span> : null}
              </div>
              <div className="meta"><span className="title">{w.title}</span><span className="style">{w.region ?? ''}</span></div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
