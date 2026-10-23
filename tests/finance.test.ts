import { describe, expect, it } from 'vitest';
import { monthBounds, shiftMonth, summarize, type FinAppointment } from '../src/lib/finance';

const inOct = (iso: string) => iso >= '2026-10-01' && iso < '2026-11-01';
const appt = (p: Partial<FinAppointment>): FinAppointment => ({ id: 'x', status: 'confirmado', starts_at: '2026-10-10T13:00:00Z', total_cents: 60000, balance_cents: 42000, amount_due_cents: 18000, payment_status: 'aprovado', balance_paid_at: null, is_estimate: false, ...p });

describe('finance', () => {
  it('limites do mês e troca de ano', () => {
    expect(monthBounds('2026-12')).toEqual({ from: '2026-12-01', to: '2027-01-01' });
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
  it('soma online aprovado, separa teste e ignora recusado/fora do mês', () => {
    const s = summarize([
      { amount_cents: 18000, status: 'aprovado', live_mode: true, created_at: '2026-10-02T10:00:00Z' },
      { amount_cents: 5000, status: 'aprovado', live_mode: false, created_at: '2026-10-03T10:00:00Z' },
      { amount_cents: 9999, status: 'recusado', live_mode: true, created_at: '2026-10-03T10:00:00Z' },
      { amount_cents: 7000, status: 'aprovado', live_mode: true, created_at: '2026-09-30T10:00:00Z' }
    ], [], inOct);
    expect(s.onlineCents).toBe(18000);
    expect(s.onlineTestCents).toBe(5000);
  });
  it('saldo a receber, recebido no estúdio, contagem e ticket médio', () => {
    const s = summarize([], [
      appt({}),
      appt({ id: 'b', status: 'concluido', total_cents: 50000, balance_cents: 35000, balance_paid_at: '2026-10-11T18:00:00Z' }),
      appt({ id: 'c', status: 'cancelado' }),
      appt({ id: 'd', status: 'aguardando_pagamento' }),
      appt({ id: 'e', starts_at: '2026-11-02T13:00:00Z' })
    ], inOct);
    expect(s.toReceiveCents).toBe(42000);
    expect(s.studioCents).toBe(35000);
    expect(s.receivedCents).toBe(35000);
    expect(s.sessions).toEqual({ confirmed: 1, done: 1, canceled: 1, pending: 1 });
    expect(s.avgTicketCents).toBe(50000);
  });
});
