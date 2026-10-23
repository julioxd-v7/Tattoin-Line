import { describe, expect, it } from 'vitest';
import { depositFor, quote, type PricingSettings } from '../src/lib/pricing';

const s: PricingSettings = {
  deposit_percent: 30, deposit_min_cents: 10000, allow_full_payment: true,
  consult_enabled: true, consult_price_cents: 8000, consult_minutes: 30,
  size_tiers: [
    { id: 'p', label: 'Até 5 cm', from_cents: 30000, minutes: 60 },
    { id: 'm', label: '5 a 10 cm', from_cents: 42000, minutes: 150 },
    { id: 'xg', label: 'Maior que 20 cm', from_cents: null, minutes: null }
  ]
};

describe('sinal', () => {
  it('usa o percentual quando passa do mínimo', () => expect(depositFor(68000, s)).toBe(20400));
  it('respeita o valor mínimo', () => expect(depositFor(30000, s)).toBe(10000));
  it('nunca passa do total', () => expect(depositFor(8000, s)).toBe(8000));
});

describe('orçamento', () => {
  it('projeto: sinal e saldo somam o total', () => {
    const q = quote(s, { service: 'projeto', flash: { price_cents: 45000, duration_minutes: 90, name: 'Adaga' } });
    expect(q.depositCents! + q.balanceCents!).toBe(45000);
    expect(q.amountDueCents).toBe(13500);
    expect(q.isEstimate).toBe(false);
  });
  it('projeto: pagamento integral quando permitido', () => {
    const q = quote(s, { service: 'projeto', chargeMode: 'integral', flash: { price_cents: 45000, duration_minutes: 90, name: 'Adaga' } });
    expect(q.amountDueCents).toBe(45000);
    expect(q.balanceCents).toBe(0);
  });
  it('projeto: integral bloqueado pela configuração vira sinal', () => {
    const q = quote({ ...s, allow_full_payment: false }, { service: 'projeto', chargeMode: 'integral', flash: { price_cents: 45000, duration_minutes: 90, name: 'Adaga' } });
    expect(q.chargeMode).toBe('sinal');
  });
  it('personalizada é estimativa e cobra só o sinal', () => {
    const q = quote(s, { service: 'personalizada', sizeId: 'm', chargeMode: 'integral' });
    expect(q.isEstimate).toBe(true);
    expect(q.amountDueCents).toBe(12600);
  });
  it('peça grande exige avaliação, sem valor', () => {
    const q = quote(s, { service: 'personalizada', sizeId: 'xg' });
    expect(q.needsEvaluation).toBe(true);
    expect(q.totalCents).toBeNull();
  });
  it('consulta é cobrada integralmente', () => {
    const q = quote(s, { service: 'consulta' });
    expect(q.amountDueCents).toBe(8000);
    expect(q.balanceCents).toBe(0);
  });
});
