import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';

export interface MosaicWork {
  slug: string;
  title: string;
  style: string | null;
  region: string | null;
  image: { url: string; alt: string };
}

interface Props {
  works: MosaicWork[];
  /** total de trabalhos publicados no portfólio */
  total: number;
  /** posição desta seção na página e total de seções (índice "02 / 05") */
  index: number;
  sectionCount: number;
}

// posição de cada trabalho no mosaico (o desenho de cada quantidade está em home.css)
const AREAS = ['a', 'b', 'c', 'd'] as const;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "Trabalhos selecionados": texto em uma coluna e mosaico com proporções variadas na outra.
 * Os trabalhos vêm do portfólio cadastrado no painel. Sem nenhum publicado, o mosaico mostra
 * espaços reservados e um aviso honesto — nunca imagem de exemplo.
 */
export function PortfolioSection({ works, total, index, sectionCount }: Props) {
  const empty = works.length === 0;
  const count = empty ? 0 : works.length;
  return (
    <section className="section portfolio" aria-labelledby="pf-title">
      <div className="container portfolio-grid">
        <header className="portfolio-intro" data-rv="up">
          <span className="index" aria-hidden="true">{pad(index)} / {pad(sectionCount)}</span>
          <p className="eyebrow">Portfólio</p>
          <h2 id="pf-title" className="h2">Trabalhos<br />selecionados</h2>
          <p className="lead">Uma seleção de tatuagens que representam a essência do nosso trabalho.</p>
          {total > 0 ? (
            <Link className="link-arrow" href="/tatuagens">Ver todos os trabalhos <ArrowRight size={16} aria-hidden /></Link>
          ) : null}
        </header>

        <div className="mosaic" data-count={count}>
          {empty
            ? AREAS.map((area, i) => (
                <div key={area} className="mosaic-item" style={{ gridArea: area }}>
                  <MediaPlaceholder label={`Trabalho ${pad(i + 1)}`} />
                </div>
              ))
            : works.map((w, i) => (
                <Link
                  key={w.slug}
                  href={`/tatuagens/${w.slug}`}
                  className="mosaic-item mosaic-work"
                  style={{ gridArea: AREAS[i], ['--d' as string]: `${i * 90}ms` }}
                  data-rv="up"
                >
                  <Image src={w.image.url} alt={w.image.alt || w.title} fill sizes={i === 0 ? '(max-width: 900px) 100vw, 34vw' : '(max-width: 900px) 50vw, 17vw'} />
                  <span className="mosaic-caption">
                    <span className="label">{pad(i + 1)}{w.style ? ` — ${w.style}` : ''}</span>
                    <span className="mosaic-title">{w.title}</span>
                  </span>
                </Link>
              ))}

          {empty ? (
            <div className="mosaic-tile" style={{ gridArea: 't' }}>
              <span className="label">Portfólio em montagem</span>
              <p className="small">Os trabalhos aparecem aqui assim que forem publicados.</p>
            </div>
          ) : (
            <Link className="mosaic-tile is-link" href="/tatuagens" style={{ gridArea: 't' }} data-rv="up">
              <span className="label">{total} {total === 1 ? 'trabalho publicado' : 'trabalhos publicados'}</span>
              <span className="mosaic-tile-cta">Ver portfólio <ArrowRight size={16} aria-hidden /></span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
