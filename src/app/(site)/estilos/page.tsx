import type { Metadata } from 'next';
import Link from 'next/link';
import { WorkCard } from '@/components/Cards';
import { getPublishedWorks, getStyles, publicImageUrl } from '@/lib/data';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Estilos', description: 'Os estilos de tatuagem trabalhados no estúdio, com exemplos.', alternates: { canonical: '/estilos' } };

export default async function Estilos() {
  const [styles, works] = await Promise.all([getStyles(), getPublishedWorks()]);
  return (
    <div className="wrap" style={{ paddingBottom: 96 }}>
      <div className="page-head"><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><p className="eyebrow">O que eu faço</p><h1>Estilos</h1></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>
        {styles.map((s) => {
          const items = works.filter((w) => w.style_id === s.id).slice(0, 4);
          return (
            <section key={s.id} id={s.slug} aria-labelledby={`st-${s.slug}`} style={{ borderTop: '1px solid var(--line)', paddingTop: 32 }}>
              <div className="section-head">
                <div data-rv="left"><h2 className="h2" id={`st-${s.slug}`}>{s.name}</h2>{s.description ? <p className="lead">{s.description}</p> : null}</div>
                <Link data-rv="right" href={`/tatuagens?estilo=${encodeURIComponent(s.name)}`} className="muted">Ver todos em {s.name}</Link>
              </div>
              {items.length ? <div className="grid">{items.map((w, i) => <WorkCard key={w.id} work={w} index={i} imageUrl={publicImageUrl(w.images[0]?.storage_path)} />)}</div> : <p className="muted">Em breve, trabalhos neste estilo.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
