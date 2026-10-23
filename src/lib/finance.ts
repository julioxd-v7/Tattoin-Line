/**
 * Resumo financeiro do mês (funções puras, testadas em tests/finance.test.ts).
 * Valores sempre em centavos.
 */
export interface FinPayment { amount_cents: number; status: string; live_mode: boolean | null; created_at: string }
export interface FinAppointment {
  id: string; status: string; starts_at: string | null; total_cents: number | null; balance_cents: number | null;
  amount_due_cents: number | null; payment_status: string; balance_paid_at: string | null; is_estimate: boolean;
}

export interface MonthSummary {
  onlineCents: number;          // sinais/integrais aprovados no Mercado Pago no mês
  onlineTestCents: number;      // pagamentos de teste (sandbox), mostrados à parte
  studioCents: number;          // saldos marcados como recebidos no estúdio no mês
  receivedCents: number;        // online (real) + estúdio
  toReceiveCents: number;       // saldos de sessões confirmadas do mês ainda não recebidos
  sessions: { confirmed: number; done: number; canceled: number; pending: number };
  avgTicketCents: number | null; // média do valor total das sessões concluídas
}

export function monthBounds(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return { from: `${ym}-01`, to: `${next}-01` };
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** `inMonth` diz se um instante (ISO) cai no mês, já considerando o fuso do estúdio. */
export function summarize(payments: FinPayment[], appts: FinAppointment[], inMonth: (iso: string) => boolean): MonthSummary {
  let online = 0, onlineTest = 0, studio = 0, toReceive = 0;
  const sessions = { confirmed: 0, done: 0, canceled: 0, pending: 0 };
  const doneTotals: number[] = [];
  for (const p of payments) {
    if (p.status !== 'aprovado' || !inMonth(p.created_at)) continue;
    if (p.live_mode === false) onlineTest += p.amount_cents; else online += p.amount_cents;
  }
  for (const a of appts) {
    if (a.balance_paid_at && inMonth(a.balance_paid_at)) studio += a.balance_cents ?? 0;
    if (!a.starts_at || !inMonth(a.starts_at)) continue;
    if (a.status === 'concluido') { sessions.done++; if (a.total_cents) doneTotals.push(a.total_cents); }
    else if (a.status === 'confirmado' || a.status === 'reagendamento_solicitado') { sessions.confirmed++; toReceive += a.balance_cents ?? 0; }
    else if (a.status === 'cancelado' || a.status === 'expirado') sessions.canceled++;
    else sessions.pending++;
  }
  return {
    onlineCents: online, onlineTestCents: onlineTest, studioCents: studio, receivedCents: online + studio, toReceiveCents: toReceive, sessions,
    avgTicketCents: doneTotals.length ? Math.round(doneTotals.reduce((x, y) => x + y, 0) / doneTotals.length) : null
  };
}
