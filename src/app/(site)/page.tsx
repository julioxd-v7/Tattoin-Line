import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { BigSkull, HeroSkull, LineArt, SkullIcon } from '@/components/Icons';
import { FlashCard, WorkCard } from '@/components/Cards';
import { ART } from '@/lib/art';
import { getArtist, getFlashProjects, getPublishedWorks, getSettings, getTestimonials, publicImageUrl } from '@/lib/data';

export const revalidate = 300;

/** Mantém a ordem escolhida no painel e descarta o que não está mais publicado. */
function pick<T extends { id: string }>(ids: string[], list: T[]): T[] {
  return ids.map((id) => list.find((x) => x.id === id)).filter((x): x is T => Boolean(x));
}

export default async function Home() {
  const [s, works, flash, testimonials, artist] = await Promise.all([getSettings(), getPublishedWorks(), getFlashProjects(), getTestimonials(), getArtist()]);
  const ig = s.instagram?.replace('@', '') || null;
  const igWorks = pick(s.home_instagram ?? [], works).slice(0, 6);
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  // dados estruturados para o Google entender que é um estúdio de tatuagem
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'TattooParlor', name: s.brand_name, url: site || undefined,
    description: s.seo_description || s.hero_subtitle, founder: { '@type': 'Person', name: artist.name },
    image: publicImageUrl(s.hero_image_path) ?? undefined, email: s.contact_email ?? undefined,
    telephone: s.whatsapp ? `+${s.whatsapp}` : undefined,
    address: s.city || s.address ? { '@type': 'PostalAddress', streetAddress: s.address ?? undefined, addressLocality: s.city ?? undefined, addressCountry: 'BR' } : undefined,
    sameAs: ig ? [`https://instagram.com/${ig}`] : undefined
  };
  // cada espaço só aparece quando o artista escolhe/envia a arte em Painel → Página inicial
  const selected = pick(s.home_works, works).slice(0, 4);
  const homeFlash = pick(s.home_flash, flash).slice(0, 4);
  const heroImg = publicImageUrl(s.hero_image_path);
  const aboutImg = publicImageUrl(s.about_image_path);
  const words = [...(s.specialties.length ? s.specialties : ['Tatuagem autoral']), s.city ?? 'Recife', 'Hora marcada'];
  const titleWords = s.hero_title.split(' ');
  const splitAt = Math.ceil(titleWords.length / 2);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <section className="wrap hero">
        <div className="hero-text">
          <p className="eyebrow" data-rv="up">Tatuagem autoral · {s.city ?? 'Recife'}</p>
          <h1 className="display" data-rv="up" style={{ ['--d' as string]: '80ms' }}>
            {titleWords.slice(0, splitAt).join(' ')} <em>{titleWords.slice(splitAt).join(' ')}</em>
          </h1>
          <p className="lead" data-rv="up" style={{ ['--d' as string]: '160ms' }}>{s.hero_subtitle}</p>
          <div data-rv="up" style={{ ['--d' as string]: '240ms', display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 6 }}>
            <Link className="btn btn-accent" href="/agendar">Agendar sessão <ArrowRight size={16} aria-hidden /></Link>
            {works.length ? <Link className="btn btn-ghost" href="/tatuagens">Ver trabalhos</Link> : null}
          </div>
        </div>
        <div className="hero-art">
          <div className="skull" data-parallax="0.12"><HeroSkull /></div>
          {heroImg ? (
            <figure className="polaroid" data-rv="zoom" style={{ ['--d' as string]: '300ms' }}>
              <div className="ph" style={{ position: 'relative', overflow: 'hidden' }}>
                <Image src={heroImg} alt={s.hero_image_alt ?? 'Tatuagem em destaque'} fill priority sizes="200px" style={{ objectFit: 'cover' }} />
              </div>
              {s.hero_caption ? <figcaption>{s.hero_caption}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...words, ...words, ...words, ...words].map((w, i) => <span key={i}>{w}<SkullIcon size={22} /></span>)}
          </div>
        </div>
      </div>

      {selected.length ? (
        <section className="section" aria-labelledby="sel">
          <div className="wrap">
            <div className="section-head">
              <div data-rv="left"><p className="eyebrow">Portfólio</p><h2 className="h2" id="sel">Trabalhos selecionados</h2></div>
              <Link data-rv="right" href="/tatuagens" className="muted">Ver portfólio completo</Link>
            </div>
            <div className="grid">{selected.map((w, i) => <WorkCard key={w.id} work={w} index={i} imageUrl={publicImageUrl(w.images[0]?.storage_path)} />)}</div>
          </div>
        </section>
      ) : null}

      {homeFlash.length ? (
        <section className="paper section" aria-labelledby="flash">
          <BigSkull stroke="currentColor" className="bg-skull" style={{ position: 'absolute', right: -120, top: -60, width: 520, opacity: 0.07 }} />
          <div className="wrap" style={{ position: 'relative' }}>
            <div className="section-head">
              <div data-rv="left"><p className="eyebrow">Flash autoral</p><h2 className="h2" id="flash">Projetos disponíveis</h2><p className="lead">Desenhos prontos, tatuados uma única vez. Preço fechado.</p></div>
              <Link data-rv="right" href="/projetos">Ver todos os projetos</Link>
            </div>
            <div className="grid">{homeFlash.map((f, i) => <FlashCard key={f.id} project={f} index={i} imageUrl={publicImageUrl(f.image_path)} />)}</div>
          </div>
        </section>
      ) : null}

      <section className="section" id="sobre" aria-labelledby="sobre-t">
        <div className={aboutImg ? 'wrap about' : 'wrap'}>
          {aboutImg ? (
            <div className="portrait" data-rv="left">
              <div className="ph" style={{ position: 'relative' }}>
                <Image src={aboutImg} alt={s.about_image_alt ?? 'Retrato do artista'} fill sizes="320px" style={{ objectFit: 'cover' }} />
              </div>
              <LineArt path={ART.dagger} stroke="#e0644f" width={1.6} className="dagger" />
            </div>
          ) : null}
          <div data-rv={aboutImg ? 'right' : 'up'} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
            <p className="eyebrow">Sobre mim</p>
            <h2 className="h2" id="sobre-t">Cada desenho começa por uma conversa.</h2>
            <p className="lead" style={{ whiteSpace: 'pre-line' }}>{s.about}</p>
            {s.specialties.length ? <div className="chips">{s.specialties.map((x) => <span key={x} className="chip">{x}</span>)}<span className="chip">Só com hora marcada</span></div> : null}
          </div>
        </div>
      </section>

      {testimonials.length ? (
        <section className="section" aria-labelledby="dep">
          <div className="wrap">
            <div className="section-head"><div data-rv="left"><p className="eyebrow">Quem já tatuou</p><h2 className="h2" id="dep">Depoimentos</h2></div></div>
            <div className="testimonials">
              {testimonials.slice(0, 6).map((t, i) => (
                <figure key={t.id} className="testimonial" data-rv="up" style={{ ['--d' as string]: `${(i % 3) * 90}ms` }}>
                  {t.rating ? <p className="stars" aria-label={`Nota ${t.rating} de 5`}>{'★'.repeat(t.rating)}<span aria-hidden="true">{'★'.repeat(5 - t.rating)}</span></p> : null}
                  <blockquote>“{t.body}”</blockquote>
                  <figcaption><strong>{t.author_name}</strong>{t.source ? <span className="small"> · {t.source}</span> : null}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {ig ? (
        <section className="section ig-band" aria-labelledby="ig">
          <div className="wrap">
            <div className="section-head">
              <div data-rv="left"><p className="eyebrow">Instagram</p><h2 className="h2" id="ig">Acompanhe os trabalhos novos</h2><p className="lead">Desenhos, bastidores e horários que abrem na agenda: tudo sai primeiro no @{ig}.</p></div>
              <a data-rv="right" className="btn btn-ghost" href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer">Seguir @{ig}</a>
            </div>
            {igWorks.length ? (
              <div className="ig-grid">
                {igWorks.map((w, i) => {
                  const url = publicImageUrl(w.images[0]?.storage_path);
                  return url ? (
                    <a key={w.id} href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="ig-tile" data-rv="zoom" style={{ ['--d' as string]: `${i * 60}ms` }} aria-label={`${w.title} — ver no Instagram`}>
                      <Image src={url} alt={w.images[0]?.alt || w.title} fill sizes="(max-width: 600px) 33vw, 200px" style={{ objectFit: 'cover' }} />
                    </a>
                  ) : null;
                })}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="wrap" style={{ paddingBottom: 104 }} aria-labelledby="cta">
        <div className="cta" data-rv="up">
          <BigSkull stroke="#fff8f2" width={2.4} className="cta-skull" />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
            <h2 className="h2" id="cta" style={{ fontSize: 'clamp(32px,4vw,48px)' }}>Tem uma ideia? Vamos desenhar junto.</h2>
            <p>Conte o que imagina, onde quer tatuar e o tamanho. Respondo com orçamento e horários.</p>
          </div>
          <Link className="btn" style={{ position: 'relative' }} href="/agendar">Apresentar minha ideia</Link>
        </div>
      </section>
    </>
  );
}
