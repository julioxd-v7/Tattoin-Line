import type { Metadata } from 'next';
import { PortfolioBrowser } from '@/components/PortfolioBrowser';
import { getPublishedWorks, getStyles, publicImageUrl } from '@/lib/data';
import { artFor } from '@/lib/art';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Tatuagens', description: 'Portfólio de tatuagens realizadas: fine line, blackwork, minimalista e mais.', alternates: { canonical: '/tatuagens' } };

export default async function Tatuagens({ searchParams }: { searchParams: { estilo?: string } }) {
  const [works, styles] = await Promise.all([getPublishedWorks(), getStyles()]);
  const used = styles.filter((s) => works.some((w) => w.style_id === s.id)).map((s) => s.name);
  return (
    <div className="wrap">
      <div className="page-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><p className="eyebrow">Portfólio</p><h1>Tatuagens realizadas</h1></div>
        <p className="lead" style={{ justifySelf: 'end' }}>Trabalhos publicados com autorização de cada cliente. Toque em uma peça para ver as fotos e os detalhes.</p>
      </div>
      <PortfolioBrowser
        styles={used}
        initialStyle={searchParams.estilo}
        works={works.map((w) => ({
          slug: w.slug, title: w.title, style: w.style?.name ?? null, region: w.body_region, year: w.year,
          art: artFor(w.slug), cover: publicImageUrl(w.images[0]?.storage_path), coverAlt: w.images[0]?.alt ?? null, photos: w.images.length
        }))}
      />
    </div>
  );
}
