import 'server-only';
import crypto from 'node:crypto';
import { env } from './env';
import type { PaymentStatus } from './types';

const API = 'https://api.mercadopago.com';

export class MercadoPagoError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) { super(message); }
}

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const token = env.mpAccessToken();
  if (!token) throw new MercadoPagoError('Mercado Pago não configurado (MERCADOPAGO_ACCESS_TOKEN).');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (init.idempotencyKey) headers['X-Idempotency-Key'] = init.idempotencyKey;
  const res = await fetch(API + path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new MercadoPagoError(`Mercado Pago respondeu ${res.status}`, res.status, body);
  return body as T;
}

export interface PreferenceInput {
  appointmentId: string;
  publicToken: string;
  title: string;
  amountCents: number;
  payerEmail: string;
  payerName: string;
  expiresAt: Date;
}

export async function createPreference(i: PreferenceInput): Promise<{ id: string; checkoutUrl: string }> {
  const site = env.siteUrl();
  const back = `${site}/pagamento/retorno?reserva=${i.publicToken}`;
  const body = {
    items: [{ id: i.appointmentId, title: i.title.slice(0, 250), quantity: 1, currency_id: 'BRL', unit_price: i.amountCents / 100 }],
    payer: { email: i.payerEmail, name: i.payerName },
    external_reference: i.appointmentId,
    notification_url: `${site}/api/webhooks/mercadopago`,
    back_urls: { success: back, pending: back, failure: back },
    auto_return: 'approved',
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: i.expiresAt.toISOString(),
    date_of_expiration: i.expiresAt.toISOString(),
    statement_descriptor: 'TATTOINLINE',
    metadata: { appointment_id: i.appointmentId }
  };
  const pref = await mp<{ id: string; init_point: string; sandbox_init_point: string }>('/checkout/preferences', {
    method: 'POST', body: JSON.stringify(body), idempotencyKey: `pref-${i.appointmentId}-${i.amountCents}`
  });
  // Com credenciais de teste o próprio init_point já abre o ambiente de testes.
  return { id: pref.id, checkoutUrl: pref.init_point || pref.sandbox_init_point };
}

export interface MpPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_method_id: string | null;
  payment_type_id: string | null;
  live_mode: boolean;
  date_approved: string | null;
}

export function getPayment(id: string): Promise<MpPayment> {
  if (!/^\d{1,20}$/.test(id)) throw new MercadoPagoError('Identificador de pagamento inválido.');
  return mp<MpPayment>(`/v1/payments/${id}`);
}

export async function searchPaymentsByReference(ref: string): Promise<MpPayment[]> {
  const r = await mp<{ results: MpPayment[] }>(`/v1/payments/search?external_reference=${encodeURIComponent(ref)}&sort=date_created&criteria=desc&limit=20`);
  return r.results ?? [];
}

export async function refundPayment(id: string, amountCents: number | null, key: string) {
  const body = amountCents == null ? {} : { amount: amountCents / 100 };
  return mp<{ id: number; status: string }>(`/v1/payments/${id}/refunds`, { method: 'POST', body: JSON.stringify(body), idempotencyKey: key });
}

export function mapStatus(s: string): PaymentStatus {
  switch (s) {
    case 'approved': return 'aprovado';
    case 'authorized':
    case 'in_process': return 'em_analise';
    case 'pending': return 'pendente';
    case 'rejected': return 'recusado';
    case 'cancelled': return 'cancelado';
    case 'refunded':
    case 'charged_back': return 'reembolsado';
    default: return 'pendente';
  }
}

/**
 * Valida o cabeçalho x-signature dos webhooks do Mercado Pago.
 * Manifesto: id:{data.id};request-id:{x-request-id};ts:{ts};
 */
export function verifyWebhookSignature(opts: { signature: string | null; requestId: string | null; dataId: string | null; secret: string; toleranceSeconds?: number; now?: number }): boolean {
  if (!opts.signature || !opts.secret) return false;
  const parts = Object.fromEntries(opts.signature.split(',').map((p) => p.trim().split('=') as [string, string]));
  const ts = parts.ts, v1 = parts.v1;
  if (!ts || !v1) return false;
  const tol = opts.toleranceSeconds ?? 600;
  const tsNum = Number(ts) > 1e12 ? Number(ts) / 1000 : Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs((opts.now ?? Date.now()) / 1000 - tsNum) > tol) return false;
  let manifest = '';
  if (opts.dataId) manifest += `id:${/^[a-z0-9]+$/i.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;
  const expected = crypto.createHmac('sha256', opts.secret).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'hex'), b = Buffer.from(v1, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
