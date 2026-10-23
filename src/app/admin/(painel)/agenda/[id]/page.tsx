import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { formatBRL, formatDuration } from '@/lib/money';
import { formatDateTime, hmOf, ymdOf } from '@/lib/tz';
import { AppointmentTag, PaymentTag } from '@/components/StatusTag';
import { ActionForm, Submit } from '@/components/ActionForm';
import { apptAction } from '@/app/admin/actions';
import { PAYMENT_LABEL, type Appointment, type Payment } from '@/lib/types';

export default async function Detalhe({ params }: { params: { id: string } }) {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const tz = artist.timezone;
  const db = serviceClient();
  const { data } = await db.from('appointments').select('*').eq('id', params.id).eq('artist_id', ctx.artistId).maybeSingle();
  if (!data) notFound();
  const a = data as Appointment;
  const [{ data: pays }, { data: events }, { data: notes }, refs] = await Promise.all([
    db.from('payments').select('*').eq('appointment_id', a.id).order('created_at'),
    db.from('appointment_events').select('*').eq('appointment_id', a.id).order('created_at'),
    db.from('customer_notifications').select('*').eq('appointment_id', a.id).order('created_at'),
    a.reference_paths.length ? db.storage.from('referencias').createSignedUrls(a.reference_paths, 600) : Promise.resolve({ data: [] as { signedUrl: string }[] })
  ]);
  const hidden = (action: string) => <><input type="hidden" name="id" value={a.id} /><input type="hidden" name="action" value={action} /></>;
  const active = ['aguardando_pagamento', 'confirmado', 'reagendamento_solicitado', 'solicitado'].includes(a.status);
  return (
    <>
      <p className="small" style={{ margin: 0 }}><Link href="/admin/agenda">Agenda</Link> / {a.customer_name}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}><h1 className="h2">{a.customer_name}</h1><AppointmentTag s={a.status} /><PaymentTag s={a.payment_status} /></div>
      {a.needs_attention ? (
        <ActionForm action={apptAction} className="alert alert-bad">
          {hidden('resolver_alerta')}
          <strong>Precisa de atenção:</strong> {a.attention_reason}
          <label className="field"><span>Nota da resolução</span><input className="input" name="note" /></label>
          <Submit className="btn btn-ghost btn-sm">Marcar como resolvido</Submit>
        </ActionForm>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 24, alignItems: 'start' }}>
        <div className="summary">
          <div><span className="label">Agendamento</span></div>
          <div><span>Serviço</span><span>{String(a.terms_snapshot?.quote_label ?? a.service)}</span></div>
          <div><span>Data</span><span>{a.starts_at ? formatDateTime(a.starts_at, tz) : 'A definir'}</span></div>
          {a.source === 'simulador' ? <div><span>Origem</span><span>Veio do simulador</span></div> : null}
          <div><span>Duração</span><span>{formatDuration(a.duration_minutes)}</span></div>
          <div><span>{a.is_estimate ? 'Valor estimado' : 'Valor total'}</span><strong>{formatBRL(a.total_cents)}</strong></div>
          <div><span>{a.charge_mode === 'integral' ? 'Pago/pagar agora (integral)' : 'Sinal'}</span><span>{formatBRL(a.amount_due_cents)}</span></div>
          <div><span>Saldo no dia</span><span>{formatBRL(a.balance_cents)}</span></div>
          {a.hold_expires_at ? <div><span>Reserva temporária até</span><span>{formatDateTime(a.hold_expires_at, tz, { dateStyle: 'short', timeStyle: 'short' })}</span></div> : null}
        </div>
        <div className="summary">
          <div><span className="label">Cliente</span></div>
          <div><span>E-mail</span><a href={`mailto:${a.customer_email}`}>{a.customer_email}</a></div>
          <div><span>WhatsApp</span><a href={`https://wa.me/${a.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{a.customer_phone}</a></div>
          <div><span>Estilo</span><span>{a.style ?? '—'}</span></div>
          <div><span>Região</span><span>{a.body_region ?? '—'}</span></div>
          <div><span>Tamanho</span><span>{a.size_label ?? '—'}</span></div>
          {a.idea ? <div style={{ flexDirection: 'column' }}><span className="label">Ideia</span><span style={{ whiteSpace: 'pre-line' }}>{a.idea}</span></div> : null}
          {refs.data?.length ? <div style={{ flexDirection: 'column' }}><span className="label">Referências (links válidos por 10 min)</span><span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{refs.data.map((r, i) => <a key={i} href={r.signedUrl} target="_blank" rel="noopener noreferrer">Imagem {i + 1}</a>)}</span></div> : null}
        </div>
      </div>

      <section className="panel" aria-labelledby="acoes">
        <h2 id="acoes">Ações</h2>
        <div className="panel-body" style={{ gap: 24 }}>
          {a.status === 'solicitado' ? (
            <ActionForm action={apptAction}>
              {hidden('enviar_orcamento')}
              <strong>Aprovar e enviar orçamento</strong>
              <div className="form-grid">
                <label className="field"><span>Valor total (R$)</span><input className="input" name="total" inputMode="decimal" required placeholder="900,00" /></label>
                <label className="field"><span>Duração (min)</span><input className="input" name="duration_minutes" type="number" min={15} step={15} required defaultValue={180} /></label>
                <label className="field"><span>Data</span><input className="input" name="date" type="date" required /></label>
                <label className="field"><span>Hora</span><input className="input" name="time" type="time" required step={900} /></label>
              </div>
              <p className="small" style={{ margin: 0 }}>O cliente recebe o link para pagar o sinal. O horário fica reservado por 24 horas.</p>
              <Submit>Enviar orçamento</Submit>
            </ActionForm>
          ) : null}
          {['confirmado', 'reagendamento_solicitado'].includes(a.status) ? (
            <ActionForm action={apptAction}>
              {hidden('reagendar')}
              <strong>{a.status === 'reagendamento_solicitado' ? 'Confirmar nova data pedida pelo cliente' : 'Reagendar'}</strong>
              <div className="form-grid">
                <label className="field"><span>Data</span><input className="input" name="date" type="date" required defaultValue={a.starts_at ? ymdOf(new Date(a.starts_at), tz) : ''} /></label>
                <label className="field"><span>Hora</span><input className="input" name="time" type="time" required step={900} defaultValue={a.starts_at ? hmOf(new Date(a.starts_at), tz) : ''} /></label>
              </div>
              <Submit>Confirmar nova data</Submit>
            </ActionForm>
          ) : null}
          {a.status === 'confirmado' ? (
            <ActionForm action={apptAction}>
              {hidden('concluir')}
              <strong>Registrar conclusão</strong>
              <label className="check"><input type="checkbox" name="balance_paid" /> <span>Saldo de {formatBRL(a.balance_cents)} recebido no estúdio</span></label>
              <Submit className="btn btn-ghost">Marcar como concluída</Submit>
            </ActionForm>
          ) : null}
          <ActionForm action={apptAction}>
            {hidden('consultar_pagamento')}
            <strong>Pagamento</strong>
            <p className="small" style={{ margin: 0 }}>Consulta o estado real no Mercado Pago e atualiza a reserva.</p>
            <Submit className="btn btn-ghost">Consultar status no Mercado Pago</Submit>
          </ActionForm>
          {active && a.payment_status === 'aprovado' ? (
            <ActionForm action={apptAction}>
              {hidden('cancelar_reembolso')}
              <strong>Cancelar e reembolsar</strong>
              <label className="field"><span>Motivo (vai para o histórico)</span><input className="input" name="reason" /></label>
              <Submit className="btn btn-ghost">Cancelar e reembolsar pelo Mercado Pago</Submit>
            </ActionForm>
          ) : null}
          {active ? (
            <ActionForm action={apptAction}>
              {hidden('cancelar_sem_reembolso')}
              <strong>{a.payment_status === 'aprovado' ? 'Cancelar sem reembolso (conforme a política)' : 'Cancelar'}</strong>
              <label className="field"><span>Motivo (vai para o histórico)</span><input className="input" name="reason" /></label>
              <Submit className="btn btn-ghost">Cancelar agendamento</Submit>
            </ActionForm>
          ) : null}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 24, alignItems: 'start' }}>
        <section className="panel" aria-labelledby="pays">
          <h2 id="pays">Pagamentos</h2>
          {(pays as Payment[] | null)?.length ? (pays as Payment[]).map((p) => (
            <div key={p.id} className="list-row"><span>#{p.provider_payment_id} · {p.method ?? '—'}<br /><span className="small">{formatDateTime(p.updated_at, tz, { dateStyle: 'short', timeStyle: 'short' })} · {p.provider_status_detail}</span></span><span>{formatBRL(p.amount_cents)} · {PAYMENT_LABEL[p.status]}</span></div>
          )) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Nenhum pagamento registrado.</p></div>}
        </section>
        <section className="panel" aria-labelledby="hist">
          <h2 id="hist">Histórico</h2>
          {(events ?? []).map((e) => (
            <div key={e.id} className="list-row"><span>{e.type}{e.to_status ? `: ${e.from_status ?? '—'} → ${e.to_status}` : ''}<br /><span className="small">{e.actor}</span></span><span className="small">{formatDateTime(e.created_at, tz, { dateStyle: 'short', timeStyle: 'short' })}</span></div>
          ))}
          {(notes ?? []).map((n) => (
            <div key={`n${n.id}`} className="list-row"><span>Aviso por {n.channel}: {n.template}<br /><span className="small">{n.recipient}{n.error ? ` · ${n.error}` : ''}</span></span><span className={`tag ${n.status === 'enviado' ? 'tag-ok' : n.status === 'falhou' ? 'tag-bad' : 'tag-off'}`}>{n.status === 'nao_configurado' ? 'não configurado' : n.status}</span></div>
          ))}
        </section>
      </div>
    </>
  );
}
