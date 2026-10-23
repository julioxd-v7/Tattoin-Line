import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { addDaysYmd, formatDateTime, weekdayOfYmd, ymdOf, zonedToUtc } from '@/lib/tz';
import { AppointmentTag, PaymentTag } from '@/components/StatusTag';
import type { Appointment } from '@/lib/types';

type View = 'dia' | 'semana' | 'mes';

export default async function Agenda({ searchParams }: { searchParams: { v?: string; d?: string; status?: string } }) {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const tz = artist.timezone;
  const view: View = searchParams.v === 'dia' || searchParams.v === 'mes' ? searchParams.v : 'semana';
  const today = ymdOf(new Date(), tz);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d ?? '') ? searchParams.d! : today;
  let from = d, days = 1;
  if (view === 'semana') { from = addDaysYmd(d, -weekdayOfYmd(d)); days = 7; }
  if (view === 'mes') { from = `${d.slice(0, 7)}-01`; const [y, m] = d.split('-').map(Number); days = new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  const to = addDaysYmd(from, days);
  const prev = view === 'mes' ? addDaysYmd(from, -1) : addDaysYmd(from, -days);
  const next = to;
  const db = serviceClient();
  const [{ data }, { data: requests }, { data: blocks }] = await Promise.all([
    db.from('appointments').select('*').eq('artist_id', ctx.artistId).gte('starts_at', zonedToUtc(from, '00:00', tz).toISOString()).lt('starts_at', zonedToUtc(to, '00:00', tz).toISOString()).not('status', 'in', '(expirado)').order('starts_at'),
    db.from('appointments').select('*').eq('artist_id', ctx.artistId).eq('status', 'solicitado').order('created_at'),
    db.from('blocked_slots').select('*').eq('artist_id', ctx.artistId).lt('starts_at', zonedToUtc(to, '00:00', tz).toISOString()).gt('ends_at', zonedToUtc(from, '00:00', tz).toISOString())
  ]);
  const appts = (data ?? []) as Appointment[];
  const byDay = new Map<string, Appointment[]>();
  appts.forEach((a) => { const k = ymdOf(new Date(a.starts_at!), tz); byDay.set(k, [...(byDay.get(k) ?? []), a]); });
  const dayList = Array.from({ length: days }, (_, i) => addDaysYmd(from, i));
  const tab = (v: View, label: string) => <Link className={`filter`} aria-pressed={view === v} href={`/admin/agenda?v=${v}&d=${d}`} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{label}</Link>;
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="h2">Agenda</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tab('dia', 'Dia')}{tab('semana', 'Semana')}{tab('mes', 'Mês')}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link className="btn btn-ghost btn-sm" href={`/admin/agenda?v=${view}&d=${prev}`}>Anterior</Link>
        <strong>{formatDateTime(zonedToUtc(from, '12:00', tz), tz, { dateStyle: 'long' })}{days > 1 ? ` — ${formatDateTime(zonedToUtc(addDaysYmd(to, -1), '12:00', tz), tz, { dateStyle: 'long' })}` : ''}</strong>
        <Link className="btn btn-ghost btn-sm" href={`/admin/agenda?v=${view}&d=${next}`}>Próximo</Link>
        <Link className="small" href={`/admin/agenda?v=${view}&d=${today}`}>Hoje</Link>
      </div>
      {requests?.length ? (
        <section className="panel" aria-labelledby="orc">
          <h2 id="orc">Orçamentos aguardando avaliação ({requests.length})</h2>
          {(requests as Appointment[]).map((a) => (
            <Link key={a.id} href={`/admin/agenda/${a.id}`} className="list-row" style={{ textDecoration: 'none' }}>
              <span><strong>{a.customer_name}</strong><br /><span className="small">{a.size_label} · {a.style ?? 'estilo a definir'} · recebido {formatDateTime(a.created_at, tz, { dateStyle: 'short' })}</span></span>
              <AppointmentTag s={a.status} />
            </Link>
          ))}
        </section>
      ) : null}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: view === 'dia' ? '1fr' : view === 'semana' ? 'repeat(7, minmax(150px, 1fr))' : 'repeat(7, minmax(120px, 1fr))', gap: 8, minWidth: view === 'dia' ? 0 : 900 }}>
          {view === 'mes' ? Array.from({ length: weekdayOfYmd(from) }, (_, i) => <div key={`e${i}`} />) : null}
          {dayList.map((day) => {
            const items = byDay.get(day) ?? [];
            const blocked = (blocks ?? []).some((b) => b.starts_at < zonedToUtc(addDaysYmd(day, 1), '00:00', tz).toISOString() && b.ends_at > zonedToUtc(day, '00:00', tz).toISOString());
            return (
              <div key={day} style={{ borderTop: `1px solid ${day === today ? 'var(--accent-ink)' : 'var(--line)'}`, paddingTop: 8, minHeight: view === 'mes' ? 110 : 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link href={`/admin/agenda?v=dia&d=${day}`} className="small" style={{ textDecoration: 'none' }}>{formatDateTime(zonedToUtc(day, '12:00', tz), tz, { weekday: 'short', day: 'numeric' })}{blocked ? ' · bloqueio' : ''}</Link>
                {items.map((a) => (
                  <Link key={a.id} href={`/admin/agenda/${a.id}`} style={{ textDecoration: 'none', padding: 8, borderRadius: 8, fontSize: 13, background: a.status === 'confirmado' ? 'var(--fg)' : 'var(--surface)', color: a.status === 'confirmado' ? 'var(--bg)' : 'var(--fg)', border: a.status === 'aguardando_pagamento' ? '1px dashed var(--t-warn)' : '1px solid var(--line)', opacity: a.status === 'cancelado' ? 0.6 : 1 }}>
                    <strong>{formatDateTime(a.starts_at!, tz, { timeStyle: 'short' })}</strong> {a.customer_name.split(' ')[0]}
                    {view === 'dia' ? <span style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}><AppointmentTag s={a.status} /><PaymentTag s={a.payment_status} /></span> : null}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="small">Fundo claro: confirmado · borda tracejada: aguardando pagamento · esmaecido: cancelado.</p>
    </>
  );
}
