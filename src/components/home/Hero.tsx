import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';
import { heroTitleLines, type HeroDisplay } from '@/lib/hero';

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: { url: string; alt: string } | null;
  caption: string | null;
  display: HeroDisplay;
  /** quantas seções a página inicial tem (para o índice "01 / 05") */
  sectionCount: number;
}

/**
 * Primeira dobra da página inicial.
 * Foto na lateral direita ou como fundo, com escurecimento, ponto de foco e zoom
 * definidos em Painel → Página inicial. Sem foto, mostra o espaço reservado.
 */
export function Hero({ eyebrow, title, subtitle, image, caption, display, sectionCount }: Props) {
  const lines = heroTitleLines(title);
  const style = {
    '--hero-fx': `${display.focusX}%`,
    '--hero-fy': `${display.focusY}%`,
    '--hero-zoom': display.zoom,
    '--hero-overlay': display.overlay
  } as React.CSSProperties;
  return (
    <section
      className={`hero${image ? ' theme-dark' : ''}`}
      data-layout={display.layout}
      data-has-image={image ? 'true' : 'false'}
      aria-labelledby="hero-title"
      style={style}
    >
      <div className="hero-media">
        {image ? (
          <>
            <Image className="hero-img" src={image.url} alt={image.alt} fill priority sizes="(max-width: 900px) 100vw, 64vw" />
            <span className="hero-shade" aria-hidden="true" />
          </>
        ) : (
          <MediaPlaceholder label="Imagem principal" ratio="4:5" className="hero-ph" />
        )}
        {image && caption ? <p className="hero-caption label">{caption}</p> : null}
      </div>

      <span className="hero-arc" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-content">
          {/* coluna fina à esquerda: fio vertical e índice da seção */}
          <span className="hero-rail-line" aria-hidden="true" />
          <div className="hero-copy">
            <p className="label hero-eyebrow">{eyebrow}</p>
            <h1 id="hero-title" className="hero-title">
              {lines.map((l, i) => (
                <span key={i} className="hero-line"><span style={{ ['--i' as string]: i }}>{l}</span></span>
              ))}
            </h1>
            {subtitle ? <p className="hero-lead">{subtitle}</p> : null}
          </div>
          <span className="index hero-index" aria-hidden="true">01<br />/ {String(sectionCount).padStart(2, '0')}</span>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/tatuagens">Ver portfólio <ArrowRight size={16} aria-hidden /></Link>
            <Link className="btn btn-secondary" href="/agendar">Agendar sessão</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
