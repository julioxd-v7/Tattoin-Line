import type { Metadata } from 'next';
import { getSettings } from '@/lib/data';
import { publicContact } from '@/lib/contact';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Políticas', description: 'Privacidade (LGPD), termos de uso, cancelamento, reagendamento e informações legais.', alternates: { canonical: '/politicas' } };

export default async function Politicas() {
  const s = await getSettings();
  // só dados reais: sem CNPJ, e-mail ou endereço de exemplo
  const c = publicContact(s);
  return (
    <div className="wrap" style={{ paddingBlock: '56px 96px', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 40 }}>
      <h1 className="display" style={{ fontSize: 'clamp(44px,6vw,72px)' }}>Políticas</h1>
      <section id="privacidade" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="h3">Privacidade (LGPD)</h2>
        <p className="muted" style={{ whiteSpace: 'pre-line' }}>{s.privacy_policy}</p>
        <p className="muted">Controlador dos dados: {c.businessInfo ? `${s.brand_name} (${c.businessInfo})` : s.brand_name}. Contato para solicitações de acesso, correção ou exclusão: {c.email ?? (c.whatsapp ? 'pelo WhatsApp do estúdio' : 'pelos canais de contato do estúdio')}. Pagamentos são processados pelo Mercado Pago; o site não armazena dados de cartão.</p>
      </section>
      <section id="cancelamento" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="h3">Cancelamento e reagendamento</h2>
        <p className="muted" style={{ whiteSpace: 'pre-line' }}>{s.cancellation_policy}</p>
      </section>
      <section id="reserva" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="h3">Termos de uso e da reserva</h2>
        <p className="muted">O horário só é confirmado após a aprovação do pagamento. Enquanto o pagamento não é concluído, o horário fica reservado por {s.hold_minutes} minutos e depois é liberado. O sinal é descontado do valor total. Valores de sessões personalizadas são estimativas até a confirmação do orçamento. É necessário ter 18 anos ou mais e apresentar documento com foto.</p>
      </section>
      {c.businessInfo ? (
        <section id="legal" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="h3">Informações legais</h2>
          <p className="muted" style={{ margin: 0 }}>{s.brand_name} · {c.businessInfo}</p>
          {c.address || c.city ? <p className="muted" style={{ margin: 0 }}>{[c.address, c.city].filter(Boolean).join(' · ')}</p> : null}
          {c.email ? <p className="muted" style={{ margin: 0 }}><a href={`mailto:${c.email}`}>{c.email}</a></p> : null}
        </section>
      ) : null}
      <p className="small">Revise estes textos com um profissional antes de publicar o site.</p>
    </div>
  );
}
