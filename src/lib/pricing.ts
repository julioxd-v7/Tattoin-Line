/** Regras de preço — funções puras, usadas no servidor e testadas em tests/pricing.test.ts. */

export interface SizeTier { id: string; label: string; from_cents: number | null; minutes: number | null }

export interface PricingSettings {
  deposit_percent: number;
  deposit_min_cents: number;
  allow_full_payment: boolean;
  consult_enabled: boolean;
  consult_price_cents: number;
  consult_minutes: number;
  size_tiers: SizeTier[];
}

export type ServiceKind = 'personalizada' | 'projeto' | 'consulta';
export type ChargeMode = 'sinal' | 'integral';

export interface QuoteInput {
  service: ServiceKind;
  sizeId?: string | null;
  flash?: { price_cents: number; duration_minutes: number; name: string } | null;
  chargeMode?: ChargeMode;
}

export interface Quote {
  label: string;
  needsEvaluation: boolean;     // true = vira "solicitado", sem data nem pagamento
  durationMinutes: number | null;
  totalCents: number | null;
  isEstimate: boolean;          // "a partir de"
  chargeMode: ChargeMode;
  depositCents: number | null;
  amountDueCents: number | null;
  balanceCents: number | null;
}

export function depositFor(totalCents: number, s: Pick<PricingSettings, 'deposit_percent' | 'deposit_min_cents'>): number {
  const pct = Math.round((totalCents * s.deposit_percent) / 100);
  return Math.min(totalCents, Math.max(s.deposit_min_cents, pct));
}

export class PricingError extends Error {}

export function quote(s: PricingSettings, input: QuoteInput): Quote {
  if (input.service === 'consulta') {
    if (!s.consult_enabled) throw new PricingError('CONSULTA_DESATIVADA');
    const t = s.consult_price_cents;
    return { label: 'Consulta de avaliação', needsEvaluation: false, durationMinutes: s.consult_minutes, totalCents: t, isEstimate: false, chargeMode: 'integral', depositCents: t, amountDueCents: t, balanceCents: 0 };
  }
  if (input.service === 'projeto') {
    if (!input.flash) throw new PricingError('PROJETO_OBRIGATORIO');
    const t = input.flash.price_cents;
    const dep = depositFor(t, s);
    const full = input.chargeMode === 'integral' && s.allow_full_payment;
    return {
      label: `Projeto: ${input.flash.name}`, needsEvaluation: false, durationMinutes: input.flash.duration_minutes,
      totalCents: t, isEstimate: false, chargeMode: full ? 'integral' : 'sinal', depositCents: dep,
      amountDueCents: full ? t : dep, balanceCents: full ? 0 : t - dep
    };
  }
  const tier = s.size_tiers.find((x) => x.id === input.sizeId);
  if (!tier) throw new PricingError('TAMANHO_INVALIDO');
  if (tier.from_cents == null || tier.minutes == null) {
    return { label: `Sessão personalizada · ${tier.label}`, needsEvaluation: true, durationMinutes: null, totalCents: null, isEstimate: true, chargeMode: 'sinal', depositCents: null, amountDueCents: null, balanceCents: null };
  }
  const t = tier.from_cents;
  const dep = depositFor(t, s);
  // valor estimado: só cobra o sinal
  return { label: `Sessão personalizada · ${tier.label}`, needsEvaluation: false, durationMinutes: tier.minutes, totalCents: t, isEstimate: true, chargeMode: 'sinal', depositCents: dep, amountDueCents: dep, balanceCents: t - dep };
}
