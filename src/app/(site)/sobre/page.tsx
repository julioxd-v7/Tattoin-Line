import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';
import { getArtist, getSettings, publicImageUrl } from '@/lib/data';
import { aboutExcerpt, aboutParagraphs, isFilled } from '@/lib/home';
import { cleanInstagram } from '@/lib/contact';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [artist, s] = await Promise.all([getArtist(), getSettings()]);
  const desc = (isFilled(s.about_headline) ? s.about_headline : aboutExcerpt(s.about, 160).text) || `Conheça ${artist.name}, tatuador${s.city ? ` em ${s.city}` : ''}.`;
  return { title: `Sobre ${artist.name}`, description: desc, alternates: { canonical: '/sobre' } };
}

/** Página completa do artista: nome, apresentação, texto inteiro do "Sobre mim", especialidades e foto. */
export default async function Sobre() {
  const [artist, s] = await Promise.all([getArtist(), getSettings()]);
  const paragraphs = aboutParagraphs(s.about);
  const headline = isFilled(s.about_headline) ? s.about_headline.trim() : null;
  const photo = publicImageUrl(s.about_image_path);
  const ig = cleanInstagram(s.instagram);
  return (
    <div className="container artist-page">
      <div className="artist-grid">
        <div className="artist-copy">
          <p className="eyebrow">Sobre o artista</p>
          <h1 className="h1">{artist.name}</h1>
          {headline ? <p className="artist-headline">{headline}</p> : null}
          {paragraphs.length ? (
            <div className="artist-text">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
          ) : (
            <p className="artist-empty small">Apresentação do artista ainda não cadastrada.</p>
          )}
          {s.specialties.length ? (
            <ul className="artist-tags" aria-label="Especialidades">
              {s.specialties.map((x) => <li key={x} className="label">{x}</li>)}
            </ul>
          ) : null}
          <div className="artist-actions">
            <Link className="btn btn-primary" href="/agendar">Agendar sessão <ArrowRight size={16} aria-hidden /></Link>
            <Link className="btn btn-secondary" href="/tatuagens">Ver trabalhos</Link>
          </div>
          {ig ? <a className="link-arrow is-neutral" href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer">Instagram @{ig} <ArrowRight size={16} aria-hidden /></a> : null}
        </div>

        <figure className="artist-photo is-sticky">
          <div className="artist-photo-frame">
            {photo ? (
              <Image src={photo} alt={s.about_image_alt ?? `Retrato de ${artist.name}`} fill priority sizes="(max-width: 900px) 100vw, 40vw" />
            ) : (
              <MediaPlaceholder label="Foto do artista" ratio="3:4" />
            )}
          </div>
          {photo ? <figcaption className="label">{artist.name}{s.city ? ` — ${s.city}` : ''}</figcaption> : null}
        </figure>
      </div>
    </div>
  );
}
