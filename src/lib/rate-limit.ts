import 'server-only';
import crypto from 'node:crypto';
import { serviceClient } from './supabase/admin';

/**
 * Limite de tentativas por IP, compartilhado entre todos os servidores da Vercel
 * (tabela rate_limits no Supabase). O IP é embaralhado com hash antes de ser gravado.
 * Se o banco falhar, cai para um limite em memória para não derrubar o site.
 */
const hits = new Map<string, number[]>();

function memoryLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const [scope, ...rest] = key.split(':');
  const hashed = `${scope}:${crypto.createHash('sha256').update(rest.join(':') + (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').slice(-8)).digest('hex').slice(0, 32)}`;
  try {
    const { data, error } = await serviceClient().rpc('rate_limit_hit', { p_key: hashed, p_max: max, p_window_seconds: Math.max(1, Math.round(windowMs / 1000)) });
    if (error) throw error;
    return data === true;
  } catch {
    return memoryLimit(hashed, max, windowMs);
  }
}

/** Remove janelas antigas (chamado pelo cron diário). */
export async function cleanupRateLimits() {
  await serviceClient().from('rate_limits').delete().lt('window_start', new Date(Date.now() - 2 * 86400000).toISOString());
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'desconhecido';
}
