import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Suspense } from 'react';
import { Motion } from '@/components/Motion';
import { PageProgress } from '@/components/PageProgress';
import { getArtist, getSettings } from '@/lib/data';

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3a2.6 2.6 0 0 0-.8 1.9 4.5 4.5 0 0 0 .9 2.4 10.3 10.3 0 0 0 4 3.5c1.5.6 2 .7 2.7.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
  );
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [artist, s] = await Promise.all([getArtist(), getSettings()]);
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : null;
  return (
    <div style={{ ['--accent' as string]: s.accent_color }}>
      <a href="#conteudo" className="visually-hidden">Pular para o conteúdo</a>
      <Suspense fallback={null}><PageProgress /></Suspense>
      <SiteHeader brand={s.brand_name} />
      <main id="conteudo">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div><span style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1 }}>{s.brand_name}</span><span className="small">Tatuagem autoral por {artist.name}.</span></div>
            <div>
              <strong>Contato</strong>
              {wa ? <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a> : null}
              {s.contact_email ? <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : null}
              {s.instagram ? <a href={`https://instagram.com/${s.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">Instagram @{s.instagram.replace('@', '')}</a> : null}
            </div>
            <div><strong>Estúdio</strong>{s.address ? <span className="muted">{s.address}</span> : null}{s.city ? <span className="muted">{s.city}</span> : null}<span className="muted">Somente com hora marcada</span></div>
            <div><strong>Políticas</strong><Link href="/politicas#privacidade">Privacidade (LGPD)</Link><Link href="/politicas#cancelamento">Cancelamento e reagendamento</Link><Link href="/politicas#reserva">Termos da reserva</Link></div>
          </div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} {s.brand_name}{s.business_info ? ` · ${s.business_info}` : ''}</span><Link href="/admin" className="small">Área do artista</Link></div>
        </div>
      </footer>
      {wa ? (
        <a className="wa-float" href={`${wa}?text=${encodeURIComponent(s.whatsapp_message || `Olá! Vi o site ${s.brand_name} e quero falar sobre uma tatuagem.`)}`} target="_blank" rel="noopener noreferrer" aria-label="Conversar pelo WhatsApp">
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      ) : null}
      <Motion />
    </div>
  );
}

// páginas montadas na hora: o build não depende do banco de dados
export const dynamic = 'force-dynamic';
