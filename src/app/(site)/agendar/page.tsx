import type { Metadata } from 'next';
import { BookingForm } from '@/components/BookingForm';
import { getFlashProjects, getSettings, getStyles } from '@/lib/data';
import { integrations } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Agendar', description: 'Escolha o serviço, a data e reserve sua sessão com pagamento seguro.', alternates: { canonical: '/agendar' } };

export default async function Agendar({ searchParams }: { searchParams: { projeto?: string; estilo?: string; origem?: string } }) {
  const [s, flash, styles] = await Promise.all([getSettings(), getFlashProjects(), getStyles()]);
  const projects = flash.filter((f) => f.status === 'disponivel').map((f) => ({ slug: f.slug, name: f.name, price_cents: f.price_cents, duration_minutes: f.duration_minutes, size_label: f.size_label, style: f.style?.name ?? null }));
  return (
    <div className="wrap" style={{ paddingBlock: '48px 96px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <h1 className="display" style={{ fontSize: 'clamp(44px,6vw,76px)' }}>Agendar sessão</h1>
      {!integrations.payments() ? (
        <p className="alert" role="status">O pagamento online está temporariamente indisponível. Você ainda pode pedir orçamento para peças grandes; para reservar horários, fale com o estúdio pelo WhatsApp.</p>
      ) : null}
      <BookingForm
        initialProject={searchParams.projeto}
        initialStyle={searchParams.estilo}
        origin={searchParams.origem === 'simulador' ? 'simulador' : 'site'}
        config={{
          depositPercent: s.deposit_percent, depositMinCents: s.deposit_min_cents, allowFull: s.allow_full_payment, holdMinutes: s.hold_minutes,
          consultEnabled: s.consult_enabled, consultPriceCents: s.consult_price_cents, consultMinutes: s.consult_minutes,
          sizeTiers: s.size_tiers, styles: styles.map((x) => x.name), projects, cancellationPolicy: s.cancellation_policy
        }}
      />
    </div>
  );
}
