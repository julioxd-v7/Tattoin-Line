import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppIcon } from '@/components/Icons';
import { Motion } from '@/components/Motion';
import { PageProgress } from '@/components/PageProgress';
import { getArtist, getSettings } from '@/lib/data';
import { publicContact } from '@/lib/contact';
import { isFilled } from '@/lib/home';

/** Cor que vinha como padrão no banco antes do redesign: tratada como "não personalizada". */
const LEGACY_DEFAULT_ACCENT = '#a3342a';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [artist, s] = await Promise.all([getArtist(), getSettings()]);
  // contatos já sem dados de exemplo (seed): o que não for real não aparece em lugar nenhum
  const c = publicContact(s);
  const customDescription = isFilled(s.seo_description);
  const description = customDescription ? s.seo_description!.trim() : `Tatuagem autoral por ${artist.name}${c.city ? `, em ${c.city}` : ''}.`;
  // cor de destaque escolhida no painel (Configurações); sem escolha, vale o token do tema
  const accent = s.accent_color && /^#[0-9a-f]{6}$/i.test(s.accent_color) && s.accent_color.toLowerCase() !== LEGACY_DEFAULT_ACCENT ? s.accent_color : null;
  return (
    <>
      {accent ? <style>{`:root{--color-accent:${accent}}`}</style> : null}
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <Suspense fallback={null}><PageProgress /></Suspense>
      <SiteHeader brand={s.brand_name} whatsappUrl={c.whatsappUrl} instagramUrl={c.instagramUrl} />
      <main id="conteudo">{children}</main>
      <SiteFooter brand={s.brand_name} description={description} descriptionHasCity={!customDescription && Boolean(c.city)} contact={c} />
      {c.whatsappUrl ? (
        <a className="wa-float" href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp">
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      ) : null}
      <Motion />
    </>
  );
}

// páginas montadas na hora: o build não depende do banco de dados
export const dynamic = 'force-dynamic';
