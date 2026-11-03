import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from '@/components/Icons';

interface Props {
  /** link do WhatsApp com mensagem pronta; null = número não cadastrado (botão some) */
  whatsappUrl: string | null;
  city: string | null;
  index: number;
  sectionCount: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Fechamento da página inicial: convite para agendar, com WhatsApp e agendamento online. */
export function ContactSection({ whatsappUrl, city, index, sectionCount }: Props) {
  return (
    <section className="contact" aria-labelledby="contact-title">
      <span className="contact-arc" aria-hidden="true" />
      <div className="container contact-grid">
        <div className="contact-head" data-rv="up">
          <span className="index" aria-hidden="true">{pad(index)} / {pad(sectionCount)}</span>
          <p className="eyebrow">Contato</p>
          <h2 id="contact-title" className="contact-title">Vamos<br />conversar?</h2>
        </div>
        <div className="contact-body" data-rv="up" style={{ ['--d' as string]: '120ms' }}>
          <p className="lead">Conte sua ideia ou tire suas dúvidas. Quando estiver pronto, escolha o melhor horário e agende sua sessão.</p>
          <div className="contact-actions">
            <Link className="btn btn-primary" href="/agendar">Agendar sessão <ArrowRight size={16} aria-hidden /></Link>
            {whatsappUrl ? (
              <a className="btn btn-accent-outline" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} /> Falar no WhatsApp
              </a>
            ) : null}
          </div>
          <p className="label contact-note">{city ? `${city} · ` : ''}Somente com hora marcada</p>
        </div>
      </div>
    </section>
  );
}
