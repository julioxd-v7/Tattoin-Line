import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAppointmentByToken, hoursUntil } from '@/lib/booking';
import { getArtist, getSettings } from '@/lib/data';
import { formatBRL, formatDuration } from '@/lib/money';
import { formatDateTime } from '@/lib/tz';
import { AppointmentTag, PaymentTag } from '@/components/StatusTag';
import { ClientRequest } from '@/components/ClientRequest';
import { serviceClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sua reserva', robots: { index: false, follow: false } };

export default async function Reserva({ params }: { params: { token: string } }) {
  const a = await getAppointmentByToken(params.token);
  if (!a) notFound();
  const [artist, s] = await Promise.all([getArtist(), getSettings()]);
  const tz = artist.timezone;
  const { data: ficha } = a.client_id ? await serviceClient().from('clients').select('ficha_token, ficha_completed_at').eq('id', a.client_id).maybeSingle() : { data: null };
  const h = hoursUntil(a.starts_at);
  const canReschedule = a.status === 'confirmado' && h >= s.reschedule_min_hours;
  const canCancel = ['aguardando_pagamento', 'confirmado', 'reagendamento_solicitado', 'solicitado'].includes(a.status);
  const cancelNote = a.payment_status === 'aprovado'
    ? h >= s.reschedule_min_hours ? 'Como faltam mais de ' + s.reschedule_min_hours + ' horas, o valor pago será reembolsado pelo Mercado Pago.' : 'Faltam menos de ' + s.reschedule_min_hours + ' horas: pela política, o sinal não é devolvido.'
    : 'Nenhuma cobrança foi feita; o horário será liberado.';
  return (
    <div className="wrap" style={{ paddingBlock: '56px 96px', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 32 }}>
      <p className="small" style={{ margin: 0 }}>Link pessoal — não compartilhe.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AppointmentTag s={a.status} /><PaymentTag s={a.payment_status} /></div>
        <h1 className="h2">Olá, {a.customer_name.split(' ')[0]}.</h1>
        <p className="lead">{a.starts_at ? formatDateTime(a.starts_at, tz) + ' · horário de Recife' : 'Data a combinar após o orçamento'}</p>
      </div>
      {a.status === 'aguardando_pagamento' ? (
        <div className="alert" role="status">
          Seu horário está reservado até {a.hold_expires_at ? formatDateTime(a.hold_expires_at, tz, { timeStyle: 'short', dateStyle: 'short' }) : 'o fim do prazo'}. Ele só é confirmado depois que o pagamento for aprovado.
          {a.mp_checkout_url ? <> <a href={a.mp_checkout_url} style={{ color: 'inherit', fontWeight: 600 }}>Concluir pagamento</a></> : null}
        </div>
      ) : null}
      {a.status === 'expirado' ? <div className="alert alert-bad" role="status">O prazo para pagamento terminou e o horário foi liberado. Nenhuma cobrança foi feita. <Link href="/agendar" style={{ color: 'inherit', fontWeight: 600 }}>Escolher novo horário</Link></div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: 24, alignItems: 'start' }}>
        <div className="summary">
          <div><span className="label">Sessão</span></div>
          <div><span>Serviço</span><span>{String(a.terms_snapshot?.quote_label ?? a.service)}</span></div>
          <div><span>Duração estimada</span><span>{formatDuration(a.duration_minutes)}</span></div>
          {s.address ? <div><span>Local</span><span>{s.address}{s.city ? `, ${s.city}` : ''}</span></div> : null}
        </div>
        <div className="summary">
          <div><span className="label">Valores</span></div>
          <div><span>{a.is_estimate ? 'Valor estimado' : 'Valor total'}</span><strong>{a.total_cents != null ? (a.is_estimate ? 'a partir de ' : '') + formatBRL(a.total_cents) : 'Sob orçamento'}</strong></div>
          {a.amount_due_cents != null ? <div><span>{a.charge_mode === 'integral' ? 'Pagamento integral' : 'Sinal'}</span><span>{formatBRL(a.amount_due_cents)}</span></div> : null}
          {a.balance_cents != null ? <div><span>Saldo no dia</span><span>{formatBRL(a.balance_cents)}</span></div> : null}
        </div>
      </div>
      {ficha ? (
        <div className="notice" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{ficha.ficha_completed_at ? 'Sua ficha está preenchida. Atualize se algo mudou.' : <><strong>Falta sua ficha:</strong> e-mail, nascimento e informações de saúde (opcionais) antes da sessão.</>}</span>
          <Link className="btn btn-ghost btn-sm" href={`/ficha/${ficha.ficha_token}`}>{ficha.ficha_completed_at ? 'Ver minha ficha' : 'Preencher ficha'}</Link>
        </div>
      ) : null}
      <section aria-labelledby="mudar" style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--line)', paddingTop: 28 }}>
        <h2 className="h3" id="mudar">Precisa mudar algo?</h2>
        <p className="muted" style={{ margin: 0 }}>Reagendamento gratuito até {s.reschedule_min_hours} horas antes. <Link href="/politicas#cancelamento">Política de cancelamento</Link></p>
        <ClientRequest token={a.public_token} canReschedule={canReschedule} canCancel={canCancel} cancelNote={cancelNote} />
      </section>
    </div>
  );
}
