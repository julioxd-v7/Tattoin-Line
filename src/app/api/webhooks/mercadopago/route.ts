import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';
import { getPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { applyPayment } from '@/lib/booking';

export const dynamic = 'force-dynamic';

/**
 * Notificações do Mercado Pago.
 * 1) valida a assinatura x-signature; 2) registra o evento uma única vez (x-request-id);
 * 3) consulta o pagamento direto na API; 4) aplica o estado de forma idempotente.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const raw = await req.text();
  let payload: Record<string, unknown> = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { /* corpo inválido */ }
  const data = (payload.data ?? {}) as { id?: string | number };
  const dataId = url.searchParams.get('data.id') ?? (data.id != null ? String(data.id) : null);
  const topic = url.searchParams.get('type') ?? (payload.type as string) ?? url.searchParams.get('topic');
  const requestId = req.headers.get('x-request-id');

  const valid = verifyWebhookSignature({ signature: req.headers.get('x-signature'), requestId, dataId, secret: env.mpWebhookSecret() });
  const db = serviceClient();
  const { data: ev, error: evErr } = await db.from('payment_events').insert({
    provider: 'mercadopago', request_id: requestId ?? `sem-id-${Date.now()}-${Math.random()}`, topic, resource_id: dataId, signature_valid: valid, payload
  }).select('id').single();

  if (evErr) {
    // mesma notificação reenviada: já registrada
    if (evErr.code === '23505') return NextResponse.json({ ok: true, duplicate: true });
    console.error('webhook insert', evErr.message);
    return NextResponse.json({ error: 'falha ao registrar' }, { status: 500 });
  }
  if (!valid) return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 });
  if (topic !== 'payment' || !dataId) {
    await db.from('payment_events').update({ result: 'ignorado', processed_at: new Date().toISOString() }).eq('id', ev.id);
    return NextResponse.json({ ok: true });
  }
  try {
    const payment = await getPayment(dataId);
    const result = await applyPayment(payment);
    await db.from('payment_events').update({ result, processed_at: new Date().toISOString() }).eq('id', ev.id);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    await db.from('payment_events').update({ result: `erro: ${(e as Error).message}`.slice(0, 300) }).eq('id', ev.id);
    // 500 faz o Mercado Pago tentar de novo mais tarde
    return NextResponse.json({ error: 'falha ao processar' }, { status: 500 });
  }
}
