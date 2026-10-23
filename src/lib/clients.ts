import 'server-only';
import { serviceClient } from './supabase/admin';

export interface Client {
  id: string; artist_id: string; full_name: string; phone: string; email: string | null; birth_date: string | null; instagram: string | null;
  allergies: string | null; medications: string | null; conditions: string | null; health_notes: string | null; health_consent_at: string | null;
  internal_notes: string | null; source: 'site' | 'agendamento' | 'painel'; ficha_token: string; ficha_completed_at: string | null;
  privacy_accepted_at: string | null; deletion_requested_at: string | null; created_at: string; updated_at: string;
}

/** Telefone só com dígitos; acrescenta 55 quando vier só com DDD + número. */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

export function formatPhone(d: string): string {
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : d;
}

/** Cria ou completa o cliente pelo telefone. Não sobrescreve o que já foi preenchido. */
export async function upsertClient(artistId: string, name: string, phone: string, email: string | null, source: 'site' | 'agendamento' | 'painel'): Promise<string> {
  const { data, error } = await serviceClient().rpc('upsert_client', { p_artist: artistId, p_name: name.trim(), p_phone: normalizePhone(phone), p_email: email ?? '', p_source: source });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getClientByToken(token: string): Promise<Client | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const { data } = await serviceClient().from('clients').select('*').eq('ficha_token', token).maybeSingle();
  return (data as Client) ?? null;
}

export function ageFrom(birth: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth + 'T12:00:00Z'), n = new Date();
  let age = n.getUTCFullYear() - b.getUTCFullYear();
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) age--;
  return age;
}
