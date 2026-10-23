import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { integrations, env } from '@/lib/env';
import { formatBRL } from '@/lib/money';
import { formatDateTime, ymdOf, zonedToUtc } from '@/lib/tz';
import { AppointmentTag, PaymentTag } from '@/components/StatusTag';
import { REVENUE_PAYMENT_STATUSES, type Appointment } from '@/lib/types';

export default async function Dashboard({ searchParams }: { searchParams: { senha?: string } }) {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const db = serviceClient();
  const now = new Date();
  const ym = ymdOf(now, artist.timezone).slice(0, 7);
  const monthStart = zonedToUtc(`${ym}-01`, '00:00', artist.timezone).toISOString();
  const week = new Date(now.getTime() + 7 * 86400000).toISOString();
  const [upcoming, pending, awaiting, revenue, flash, attention, notif] = await Promise.all([
    db.from('appointments').select('*').eq('artist_id', ctx.artistId).in('status', ['confirmado', 'reagendamento_solicitado', 'aguardando_pagamento']).gte('starts_at', now.toISOString()).order('starts_at').limit(8),
    db.from('appointments').select('id', { count: 'exact', head: true }).eq('artist_id', ctx.artistId).in('status', ['solicitado', 'reagendamento_solicitado']),
    db.from('appointments').select('id', { count: 'exact', head: true }).eq('artist_id', ctx.artistId).eq('status', 'aguardando_pagamento'),
    db.from('payments').select('amount_cents, appointment:appointments!inner(artist_id)').eq('appointment.artist_id', ctx.artistId).in('status', REVENUE_PAYMENT_STATUSES).gte('created_at', monthStart),
    db.from('flash_projects').select('status').eq('artist_id', ctx.artistId).neq('status', 'arquivado'),
    db.from('appointments').select('id, customer_name, attention_reason').eq('artist_id', ctx.artistId).eq('needs_attention', true).limit(5),
    db.from('customer_notifications').select('status').eq('status', 'nao_configurado').gte('created_at', monthStart).limit(1)
  ]);
  const list = (upcoming.data ?? []) as Appointment[];
  const week7 = list.filter((a) => a.starts_at && a.starts_at < week).length;
  const rev = (revenue.data ?? []).reduce((s, p) => s + p.amount_cents, 0);
  const flashFree = (flash.data ?? []).filter((f) => f.status === 'disponivel').length;
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', gap: 16 }}>
        <div><p className="small" style={{ margin: 0 }}>{formatDateTime(now, artist.timezone, { dateStyle: 'full' })}</p><h1 className="h2">Visão geral</h1></div>
        {searchParams.senha ? <p className="alert alert-ok" role="status" style={{ flexBasis: '100%' }}>Senha alterada.</p> : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link className="btn btn-ghost btn-sm" href="/admin/disponibilidade">Bloquear horário</Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/projetos/novo">Novo projeto</Link>
          <Link className="btn btn-accent btn-sm" href="/admin/portfolio/novo">Nova tatuagem</Link>
        </div>
      </div>
      {(attention.data ?? []).map((a) => (
        <p key={a.id} className="alert alert-bad" role="alert"><strong>Atenção — {a.customer_name}:</strong> {a.attention_reason} <Link href={`/admin/agenda/${a.id}`} style={{ color: 'inherit', fontWeight: 600 }}>Abrir</Link></p>
      ))}
      <div className="kpis">
        <div><span className="small">Próximos 7 dias</span><strong>{week7}</strong><span className="small">agendamentos</span></div>
        <div><span className="small">Solicitações</span><strong>{pending.count ?? 0}</strong><span className="small">orçamentos e reagendamentos</span></div>
        <div><span className="small">Aguardando pagamento</span><strong>{awaiting.count ?? 0}</strong><span className="small">reservas temporárias</span></div>
        <div><span className="small">Recebido no mês</span><strong>{formatBRL(rev)}</strong><span className="small">só pagamentos aprovados</span></div>
        <div><span className="small">Projetos disponíveis</span><strong>{flashFree}</strong><span className="small">no catálogo</span></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: 24, alignItems: 'start' }}>
        <section className="panel" aria-labelledby="prox">
          <h2 id="prox">Próximos agendamentos</h2>
          {list.length ? list.map((a) => (
            <Link key={a.id} href={`/admin/agenda/${a.id}`} className="list-row" style={{ textDecoration: 'none' }}>
              <span><strong>{a.customer_name}</strong><br /><span className="small">{a.starts_at ? formatDateTime(a.starts_at, artist.timezone, { dateStyle: 'medium', timeStyle: 'short' }) : '—'} · {String(a.terms_snapshot?.quote_label ?? a.service)}</span></span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><AppointmentTag s={a.status} /><PaymentTag s={a.payment_status} /></span>
            </Link>
          )) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Nenhum agendamento futuro.</p></div>}
        </section>
        <section className="panel" aria-labelledby="integ">
          <h2 id="integ">Integrações</h2>
          <div className="list-row"><span>Mercado Pago</span>{integrations.payments() ? <span className={`tag ${env.mpEnv() === 'test' ? 'tag-warn' : 'tag-ok'}`}>{env.mpEnv() === 'test' ? 'Teste' : 'Produção'}</span> : <span className="tag tag-bad">Não configurado</span>}</div>
          <div className="list-row"><span>Assinatura do webhook</span>{integrations.webhookSigned() ? <span className="tag tag-ok">Configurada</span> : <span className="tag tag-bad">Sem segredo — notificações são recusadas</span>}</div>
          <div className="list-row"><span>E-mail transacional</span>{integrations.email() ? <span className="tag tag-ok">Configurado</span> : <span className="tag tag-bad">Não configurado — e-mails não são enviados</span>}</div>
          <div className="list-row"><span>WhatsApp (API oficial)</span>{integrations.whatsapp() ? <span className="tag tag-ok">Configurado</span> : <span className="tag tag-off">Não configurado — mensagens não são enviadas</span>}</div>
          {notif.data?.length ? <div className="panel-body"><p className="small" style={{ margin: 0 }}>Há avisos deste mês que não foram enviados por falta de configuração.</p></div> : null}
        </section>
      </div>
    </>
  );
}
