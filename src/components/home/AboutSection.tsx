import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';

interface Props {
  /** nome do artista (Painel → Configurações) */
  name: string;
  /** frase curta de apresentação (Painel → Página inicial); vazia = não aparece */
  headline: string | null;
  /** resumo do "Sobre mim"; vazio = aviso discreto */
  excerpt: string;
  /** há texto cadastrado para a página /sobre */
  hasBio: boolean;
  specialties: string[];
  city: string | null;
  photo: { url: string; alt: string } | null;
  index: number;
  sectionCount: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "Sobre o artista" da página inicial. Tudo vem do cadastro do tatuador;
 * o que não foi cadastrado vira estado vazio discreto, nunca texto ou foto inventados.
 */
export function AboutSection({ name, headline, excerpt, hasBio, specialties, city, photo, index, sectionCount }: Props) {
  return (
    <section className="section artist" id="sobre" aria-labelledby="artist-title">
      <div className="container artist-grid">
        <div className="artist-copy" data-rv="up">
          <span className="index" aria-hidden="true">{pad(index)} / {pad(sectionCount)}</span>
          <p className="eyebrow">Sobre o artista</p>
          <h2 id="artist-title" className="h2">{name}</h2>
          {headline ? <p className="artist-headline">{headline}</p> : null}
          {excerpt ? <p className="artist-bio">{excerpt}</p> : <p className="artist-empty small">Apresentação do artista ainda não cadastrada.</p>}
          {specialties.length ? (
            <ul className="artist-tags" aria-label="Especialidades">
              {specialties.map((s) => <li key={s} className="label">{s}</li>)}
            </ul>
          ) : null}
          {hasBio ? (
            <Link className="btn btn-secondary btn-sm" href="/sobre">Conhecer mais <ArrowRight size={16} aria-hidden /></Link>
          ) : null}
        </div>

        <figure className="artist-photo" data-rv="zoom">
          <div className="artist-photo-frame">
            {photo ? (
              <Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 900px) 100vw, 40vw" />
            ) : (
              <MediaPlaceholder label="Foto do artista" ratio="3:4" />
            )}
          </div>
          {photo ? <figcaption className="label">{name}{city ? ` — ${city}` : ''}</figcaption> : null}
        </figure>
      </div>
    </section>
  );
}
