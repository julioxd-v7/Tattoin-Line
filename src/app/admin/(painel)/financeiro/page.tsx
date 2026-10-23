import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { formatBRL } from '@/lib/money';
import { formatDateTime, ymdOf } from '@/lib/tz';
import { monthBounds, shiftMonth, summarize, type FinAppointment, type FinPayment } from '@/lib/finance';

export const dynamic = 'force-dynamic';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export default async function Financeiro({ searchParams }: { searchParams: { mes?: string } }) {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const tz = artist.timezone;
  const current = ymdOf(new Date(), tz).slice(0, 7);
  const ym = /^\d{4}-\d{2}$/.test(searchParams.mes ?? '') ? searchParams.mes! : current;
  const { from, to } = monthBounds(ym);
  // busca com folga de 1 dia e filtra pelo fuso do estúdio
  const lo = new Date(Date.parse(from) - 86400000).toISOString();
  const hi = new Date(Date.parse(to) + 86400000).toISOString();
  const inMonth = (iso: string) => ymdOf(new Date(iso), tz).slice(0, 7) === ym;
  const db = serviceClient();
  const cols = 'id, customer_name, status, starts_at, total_cents, balance_cents, amount_due_cents, payment_status, balance_paid_at, is_estimate';
  const [pay, byDate, byPaid] = await Promise.all([
    db.from('payments').select('amount_cents, status, live_mode, created_at, appointment:appointments!inner(artist_id)').eq('appointment.artist_id', ctx.artistId).gte('created_at', lo).lt('created_at', hi),
    db.from('appointments').select(cols).eq('artist_id', ctx.artistId).gte('starts_at', lo).lt('starts_at', hi),
    db.from('appointments').select(cols).eq('artist_id', ctx.artistId).gte('balance_paid_at', lo).lt('balance_paid_at', hi)
  ]);
  type A = FinAppointment & { customer_name: string };
  const map = new Map<string, A>();
  [...((byDate.data ?? []) as A[]), ...((byPaid.data ?? []) as A[])].forEach((a) => map.set(a.id, a));
  const appts = Array.from(map.values());
  const s = summarize((pay.data ?? []) as unknown as FinPayment[], appts, inMonth);
  const upcoming = appts.filter((a) => a.starts_at && inMonth(a.starts_at) && ['confirmado', 'reagendamento_solicitado'].includes(a.status)).sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
  const [y, m] = ym.split('-').map(Number);
  const Card = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="small">{label}</span><strong style={{ fontSize: 26, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>{hint ? <span className="small">{hint}</span> : null}
    </div>
  );
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="h2">Resumo financeiro</h1>
        <nav aria-label="Mês" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link className="btn btn-ghost btn-sm" href={`/admin/financeiro?mes=${shiftMonth(ym, -1)}`} aria-label="Mês anterior">←</Link>
          <strong style={{ minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>{MONTHS[m - 1]} {y}</strong>
          <Link className="btn btn-ghost btn-sm" href={`/admin/financeiro?mes=${shiftMonth(ym, 1)}`} aria-label="Próximo mês">→</Link>
        </nav>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 14 }}>
        <Card label="Recebido no mês" value={formatBRL(s.receivedCents)} hint="online + saldos no estúdio" />
        <Card label="Online (Mercado Pago)" value={formatBRL(s.onlineCents)} hint={s.onlineTestCents ? `+ ${formatBRL(s.onlineTestCents)} em testes` : 'sinais e pagamentos integrais'} />
        <Card label="No estúdio" value={formatBRL(s.studioCents)} hint="saldos marcados ao concluir a sessão" />
        <Card label="A receber" value={formatBRL(s.toReceiveCents)} hint="saldos das sessões confirmadas do mês" />
        <Card label="Sessões" value={`${s.sessions.done} concluídas`} hint={`${s.sessions.confirmed} confirmadas · ${s.sessions.canceled} canceladas/expiradas`} />
        <Card label="Ticket médio" value={s.avgTicketCents ? formatBRL(s.avgTicketCents) : '—'} hint="valor total das sessões concluídas" />
      </div>
      <section className="panel" aria-labelledby="prox">
        <h2 id="prox">Saldos a receber neste mês</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Data</th><th scope="col">Cliente</th><th scope="col">Total</th><th scope="col">Saldo no dia</th></tr></thead>
            <tbody>
              {upcoming.length ? upcoming.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.starts_at!, tz, { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td><Link href={`/admin/agenda/${a.id}`}>{a.customer_name}</Link></td>
                  <td>{formatBRL(a.total_cents)}{a.is_estimate ? ' (estimado)' : ''}</td>
                  <td>{formatBRL(a.balance_cents)}</td>
                </tr>
              )) : <tr><td colSpan={4} className="muted">Nenhuma sessão confirmada com saldo neste mês.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <p className="small" style={{ margin: 0 }}>Valores informativos para controle do estúdio, não substituem a contabilidade. Para o saldo entrar em “No estúdio”, marque “Saldo recebido” ao concluir a sessão na agenda.</p>
    </>
  );
}
