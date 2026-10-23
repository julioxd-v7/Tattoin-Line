import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { formatBRL } from '@/lib/money';
import { formatDateTime } from '@/lib/tz';
import { PaymentTag } from '@/components/StatusTag';
import type { PaymentStatus } from '@/lib/types';

export default async function Pagamentos() {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const { data } = await serviceClient().from('payments')
    .select('id, provider_payment_id, status, provider_status_detail, amount_cents, method, live_mode, created_at, appointment:appointments!inner(id, artist_id, customer_name)')
    .eq('appointment.artist_id', ctx.artistId).order('created_at', { ascending: false }).limit(200);
  type Row = { id: string; provider_payment_id: string; status: PaymentStatus; provider_status_detail: string | null; amount_cents: number; method: string | null; live_mode: boolean | null; created_at: string; appointment: { id: string; customer_name: string } };
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <h1 className="h2">Pagamentos</h1>
      <p className="muted" style={{ margin: 0 }}>Histórico registrado a partir das notificações e consultas ao Mercado Pago. A receita do painel considera apenas pagamentos aprovados.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th scope="col">Data</th><th scope="col">Cliente</th><th scope="col">Pagamento</th><th scope="col">Meio</th><th scope="col">Valor</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((p) => (
              <tr key={p.id}>
                <td>{formatDateTime(p.created_at, artist.timezone, { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><Link href={`/admin/agenda/${p.appointment.id}`}>{p.appointment.customer_name}</Link></td>
                <td>#{p.provider_payment_id}{p.live_mode === false ? ' (teste)' : ''}</td>
                <td>{p.method ?? '—'}</td>
                <td>{formatBRL(p.amount_cents)}</td>
                <td><PaymentTag s={p.status} /></td>
              </tr>
            )) : <tr><td colSpan={6} className="muted">Nenhum pagamento ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
