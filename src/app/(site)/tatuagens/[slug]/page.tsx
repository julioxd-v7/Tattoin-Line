import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Gallery, ShareButton } from '@/components/Gallery';
import { WorkCard } from '@/components/Cards';
import { getArtist, getPublishedWork, getPublishedWorks, publicImageUrl } from '@/lib/data';
import { artFor } from '@/lib/art';

export const revalidate = 300;

export async function generateStaticParams() {
  try { return (await getPublishedWorks()).map((w) => ({ slug: w.slug })); } catch { return []; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const w = await getPublishedWork(params.slug);
  if (!w) return { title: 'Trabalho não encontrado' };
  const img = publicImageUrl(w.images[0]?.storage_path);
  return {
    title: w.title,
    description: w.description || `${w.title} — ${w.style?.name ?? 'tatuagem autoral'}`,
    alternates: { canonical: `/tatuagens/${w.slug}` },
    openGraph: { title: w.title, images: img ? [{ url: img, alt: w.images[0].alt }] : undefined }
  };
}

export default async function Trabalho({ params }: { params: { slug: string } }) {
  const [w, all, artist] = await Promise.all([getPublishedWork(params.slug), getPublishedWorks(), getArtist()]);
  if (!w) notFound();
  const related = all.filter((x) => x.id !== w.id && x.style_id === w.style_id).concat(all.filter((x) => x.id !== w.id && x.style_id !== w.style_id)).slice(0, 4);
  return (
    <div className="wrap">
      <nav aria-label="Trilha" className="small" style={{ paddingTop: 32 }}><Link href="/tatuagens">Tatuagens</Link> / {w.title}</nav>
      <div className="lb-body">
        <Gallery title={w.title} art={artFor(w.slug)} images={w.images.map((im) => ({ url: publicImageUrl(im.storage_path)!, alt: im.alt }))} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <h1 className="h2">{w.title}</h1>
          <dl className="dl">
            <div><dt>Estilo</dt><dd>{w.style?.name ?? '—'}</dd></div>
            <div><dt>Região</dt><dd>{w.body_region ?? 'Não informada'}</dd></div>
            <div><dt>Ano</dt><dd>{w.year ?? '—'}</dd></div>
            <div><dt>Artista</dt><dd>{artist.name}</dd></div>
          </dl>
          {w.description ? <p className="muted" style={{ margin: 0 }}>{w.description}</p> : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link className="btn btn-accent" href={`/agendar?estilo=${encodeURIComponent(w.style?.name ?? '')}`}>Quero algo neste estilo</Link>
            <ShareButton />
          </div>
        </div>
      </div>
      {related.length ? (
        <section className="section" style={{ paddingTop: 24 }} aria-labelledby="rel">
          <h2 className="h3" id="rel" style={{ marginBottom: 24 }}>Trabalhos relacionados</h2>
          <div className="grid">{related.map((r, i) => <WorkCard key={r.id} work={r} index={i} imageUrl={publicImageUrl(r.images[0]?.storage_path)} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
