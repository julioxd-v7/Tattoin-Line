import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { BrandMark, TikTokIcon, WhatsAppIcon } from './Icons';
import type { PublicContact } from '@/lib/contact';

interface Props {
  brand: string;
  /** breve descrição (Configurações) ou frase montada só com dados reais */
  description: string;
  /** a descrição foi montada automaticamente e já cita a cidade */
  descriptionHasCity?: boolean;
  /** contatos já limpos: nada de exemplo chega aqui (publicContact) */
  contact: PublicContact;
}

/**
 * Rodapé em três áreas — identidade, redes sociais e informações — e a linha de direitos autorais.
 * Cada item só aparece quando o dado real está cadastrado; área sem nenhum item some inteira.
 */
export function SiteFooter({ brand, description, descriptionHasCity = false, contact: c }: Props) {
  const networks = [
    c.instagramUrl ? { href: c.instagramUrl, label: 'Instagram', detail: `@${c.instagram}`, icon: <Instagram size={18} strokeWidth={1.5} aria-hidden /> } : null,
    c.whatsappUrl ? { href: c.whatsappUrl, label: 'WhatsApp', detail: null, icon: <WhatsAppIcon size={18} /> } : null,
    c.tiktokUrl ? { href: c.tiktokUrl, label: 'TikTok', detail: null, icon: <TikTokIcon size={18} /> } : null,
    c.youtubeUrl ? { href: c.youtubeUrl, label: 'YouTube', detail: null, icon: <Youtube size={18} strokeWidth={1.5} aria-hidden /> } : null,
    c.facebookUrl ? { href: c.facebookUrl, label: 'Facebook', detail: null, icon: <Facebook size={18} strokeWidth={1.5} aria-hidden /> } : null
  ].filter((n): n is NonNullable<typeof n> => n !== null);
  // cidade sozinha não se repete se a descrição automática já a cita
  const place = c.address ? [c.address, c.city].filter(Boolean).join(' · ') : descriptionHasCity ? '' : (c.city ?? '');

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top" data-areas={networks.length ? 3 : 2}>
          <section className="footer-area footer-identity" aria-label="Identidade">
            <Link className="brand" href="/" aria-label={`${brand} — início`}>
              <BrandMark />
              <span className="brand-name">{brand}</span>
            </Link>
            <p className="footer-desc">{description}</p>
            {place || c.email ? (
              <address className="footer-contact">
                {place ? <span>{place}</span> : null}
                {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : null}
              </address>
            ) : null}
          </section>

          {networks.length ? (
            <nav className="footer-area" aria-labelledby="ft-social">
              <h2 className="label" id="ft-social">Redes sociais</h2>
              <ul className="footer-list">
                {networks.map((n) => (
                  <li key={n.label}>
                    <a className="footer-social" href={n.href} target="_blank" rel="noopener noreferrer">
                      {n.icon}<span>{n.label}</span>{n.detail ? <span className="footer-social-detail">{n.detail}</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav className="footer-area" aria-labelledby="ft-info">
            <h2 className="label" id="ft-info">Informações</h2>
            <ul className="footer-list">
              <li><Link href="/politicas#privacidade">Política de privacidade</Link></li>
              <li><Link href="/politicas#reserva">Termos de uso</Link></li>
              <li><Link href="/politicas#cancelamento">Cancelamento</Link></li>
              {c.businessInfo ? <li><Link href="/politicas#legal">Informações legais</Link></li> : null}
            </ul>
            {c.businessInfo ? <p className="footer-legal">{c.businessInfo}</p> : null}
          </nav>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span>
          <div className="footer-links">
            <Link href="/cadastro">Cadastro de cliente</Link>
            <Link href="/admin">Área do artista</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
