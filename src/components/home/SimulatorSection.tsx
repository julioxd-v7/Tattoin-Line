import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BrandMark } from '@/components/Icons';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';

interface Props {
  /** imagem demonstrativa enviada em Painel → Página inicial (sem ela, espaço reservado) */
  image: { url: string; alt: string } | null;
  index: number;
  sectionCount: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Faixa que apresenta o simulador e leva até ele (/simulador, que continua igual). */
export function SimulatorSection({ image, index, sectionCount }: Props) {
  return (
    <section className="sim-band" aria-labelledby="sim-title">
      <div className="sim-band-media" data-rv="zoom">
        {image ? (
          <Image src={image.url} alt={image.alt} fill sizes="(max-width: 900px) 100vw, 58vw" />
        ) : (
          <MediaPlaceholder label="Imagem demonstrativa" ratio="16:10" />
        )}
      </div>

      <div className="sim-band-body">
        <div className="sim-band-copy" data-rv="up">
          <span className="index" aria-hidden="true">{pad(index)} / {pad(sectionCount)}</span>
          <p className="eyebrow">Experimente</p>
          <h2 id="sim-title" className="h2">Sua tatuagem</h2>
          <p className="lead">Escolha um desenho, envie uma foto da região e veja como ele ficaria na sua pele.</p>
          <p className="small">Mova, gire e ajuste o tamanho e a transparência. A foto fica só no seu aparelho.</p>
          <Link className="btn btn-primary" href="/simulador">Testar agora <ArrowRight size={16} aria-hidden /></Link>
        </div>
        <div className="sim-band-deco" aria-hidden="true">
          <span className="sim-band-rule" />
          <BrandMark size={96} className="sim-band-mark" />
        </div>
      </div>
    </section>
  );
}
