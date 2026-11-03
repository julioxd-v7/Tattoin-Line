import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/home/Hero';
import { FeatureStrip } from '@/components/home/FeatureStrip';
import { PortfolioSection } from '@/components/home/PortfolioSection';
import { SimulatorSection } from '@/components/home/SimulatorSection';
import { AboutSection } from '@/components/home/AboutSection';
import { ProjectsSection } from '@/components/home/ProjectsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ContactSection } from '@/components/home/ContactSection';
import { cleanInstagram, publicContact } from '@/lib/contact';
import { heroDisplay } from '@/lib/hero';
import { aboutExcerpt, isFilled, selectHomeFlash, selectHomeWorks } from '@/lib/home';
import { getArtist, getFlashProjects, getPublishedWorks, getSettings, getTestimonials, publicImageUrl } from '@/lib/data';

export const revalidate = 300;

/** Mantém a ordem escolhida no painel e descarta o que não está mais publicado. */
function pick<T extends { id: string }>(ids: string[], list: T[]): T[] {
  return ids.map((id) => list.find((x) => x.id === id)).filter((x): x is T => Boolean(x));
}

export default async function Home() {
  const [s, works, flash, testimonials, artist] = await Promise.all([getSettings(), getPublishedWorks(), getFlashProjects(), getTestimonials(), getArtist()]);
  // Instagram sem o @ de demonstração do banco de exemplo
  const ig = cleanInstagram(s.instagram);
  const igWorks = pick(s.home_instagram ?? [], works).slice(0, 6);
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  // dados estruturados para o Google entender que é um estúdio de tatuagem
  const c = publicContact(s);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'TattooParlor', name: s.brand_name, url: site || undefined,
    description: s.seo_description || s.hero_subtitle, founder: { '@type': 'Person', name: artist.name },
    image: publicImageUrl(s.hero_image_path) ?? undefined, email: c.email ?? undefined,
    telephone: c.whatsapp ? `+${c.whatsapp}` : undefined,
    address: c.city || c.address ? { '@type': 'PostalAddress', streetAddress: c.address ?? undefined, addressLocality: c.city ?? undefined, addressCountry: 'BR' } : undefined,
    sameAs: [c.instagramUrl, c.tiktokUrl, c.youtubeUrl, c.facebookUrl].filter(Boolean).length ? [c.instagramUrl, c.tiktokUrl, c.youtubeUrl, c.facebookUrl].filter(Boolean) : undefined
  };
  // mosaico: escolha do painel ou, sem escolha, destaques e mais recentes do portfólio
  const selected = selectHomeWorks(s.home_works, works);
  // desenhos exclusivos: escolha do painel ou, sem escolha, disponíveis e depois reservados
  const homeFlash = selectHomeFlash(s.home_flash, flash);
  // depoimentos: sem nenhum publicado, a seção some (padrão) ou aparece com aviso discreto, conforme o painel
  const showTestimonials = testimonials.length > 0 || s.testimonials_show_empty === true;
  const heroImg = publicImageUrl(s.hero_image_path);
  const aboutImg = publicImageUrl(s.about_image_path);
  const simImg = publicImageUrl(s.sim_image_path);
  const bio = aboutExcerpt(s.about);
  // seções numeradas: topo, trabalhos, simulador, sobre, projetos e contato sempre; depoimentos conforme o painel
  // (a faixa do Instagram não é numerada)
  const sectionCount = 6 + (showTestimonials ? 1 : 0);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Hero
        eyebrow={s.hero_eyebrow?.trim() || s.brand_name}
        title={s.hero_title}
        subtitle={s.hero_subtitle}
        image={heroImg ? { url: heroImg, alt: s.hero_image_alt ?? 'Tatuagem em destaque' } : null}
        caption={s.hero_caption}
        display={heroDisplay(s)}
        sectionCount={sectionCount}
      />

      <FeatureStrip />

      <PortfolioSection
        index={2}
        sectionCount={sectionCount}
        total={works.length}
        works={selected.map((w) => ({
          slug: w.slug, title: w.title, style: w.style?.name ?? null, region: w.body_region,
          image: { url: publicImageUrl(w.images[0]?.storage_path)!, alt: w.images[0]?.alt ?? w.title }
        }))}
      />

      <SimulatorSection
        index={3}
        sectionCount={sectionCount}
        image={simImg ? { url: simImg, alt: s.sim_image_alt ?? 'Prévia do simulador de tatuagem' } : null}
      />

      <AboutSection
        index={4}
        sectionCount={sectionCount}
        name={artist.name}
        headline={isFilled(s.about_headline) ? s.about_headline.trim() : null}
        excerpt={bio.text}
        hasBio={isFilled(s.about)}
        specialties={s.specialties}
        city={s.city}
        photo={aboutImg ? { url: aboutImg, alt: s.about_image_alt ?? `Retrato de ${artist.name}` } : null}
      />

      <ProjectsSection
        index={5}
        sectionCount={sectionCount}
        projects={homeFlash.map((f) => ({ project: f, imageUrl: publicImageUrl(f.image_path) }))}
      />

      {showTestimonials ? (
        <TestimonialsSection
          index={6}
          sectionCount={sectionCount}
          items={testimonials.slice(0, 12).map((t) => ({ id: t.id, body: t.body, author: t.author_name, source: t.source, rating: t.rating }))}
        />
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

      <ContactSection index={sectionCount} sectionCount={sectionCount} whatsappUrl={c.whatsappUrl} city={c.city} />
    </>
  );
}
