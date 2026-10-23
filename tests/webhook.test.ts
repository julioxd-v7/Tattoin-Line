import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { verifyWebhookSignature, mapStatus } from '../src/lib/mercadopago';

const secret = 'segredo-de-teste';
const sign = (id: string, req: string, ts: string) => crypto.createHmac('sha256', secret).update(`id:${id};request-id:${req};ts:${ts};`).digest('hex');

describe('assinatura do webhook', () => {
  const ts = String(Math.floor(Date.now() / 1000));
  it('aceita assinatura válida', () => {
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=${sign('123456', 'req-1', ts)}`, requestId: 'req-1', dataId: '123456', secret })).toBe(true);
  });
  it('recusa assinatura adulterada', () => {
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=${sign('999', 'req-1', ts)}`, requestId: 'req-1', dataId: '123456', secret })).toBe(false);
  });
  it('recusa notificação antiga', () => {
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(verifyWebhookSignature({ signature: `ts=${old},v1=${sign('123456', 'req-1', old)}`, requestId: 'req-1', dataId: '123456', secret })).toBe(false);
  });
  it('recusa sem segredo configurado', () => {
    expect(verifyWebhookSignature({ signature: `ts=${ts},v1=abc`, requestId: 'r', dataId: '1', secret: '' })).toBe(false);
  });
});

describe('status do Mercado Pago', () => {
  it('mapeia estados', () => {
    expect(mapStatus('approved')).toBe('aprovado');
    expect(mapStatus('in_process')).toBe('em_analise');
    expect(mapStatus('rejected')).toBe('recusado');
    expect(mapStatus('refunded')).toBe('reembolsado');
  });
});
