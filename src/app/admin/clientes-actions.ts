'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';
import { normalizePhone } from '@/lib/clients';
import type { ActionState } from './actions';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const opt = (f: FormData, k: string, max: number) => { const v = str(f, k).slice(0, max); return v || null; };

export async function saveClient(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const name = str(f, 'full_name');
  const phone = normalizePhone(str(f, 'phone'));
  const email = str(f, 'email').toLowerCase();
  const birth = str(f, 'birth_date');
  if (name.length < 3) return { error: 'Informe o nome completo.' };
  if (!/^\d{10,15}$/.test(phone)) return { error: 'Informe o telefone com DDD.' };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'E-mail inválido.' };
  if (birth && !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { error: 'Data de nascimento inválida.' };
  const health = { allergies: opt(f, 'allergies', 1000), medications: opt(f, 'medications', 1000), conditions: opt(f, 'conditions', 1000), health_notes: opt(f, 'health_notes', 2000) };
  const hasHealth = Object.values(health).some(Boolean);
  const consent = f.get('health_consent') === 'on';
  if (hasHealth && !consent) return { error: 'Para guardar dados de saúde, confirme que o cliente autorizou.' };
  const db = serviceClient();
  let consentAt: string | null = null;
  if (hasHealth) {
    const { data: cur } = id ? await db.from('clients').select('health_consent_at').eq('id', id).eq('artist_id', ctx.artistId).maybeSingle() : { data: null };
    consentAt = cur?.health_consent_at ?? new Date().toISOString();
  }
  const row = {
    artist_id: ctx.artistId, full_name: name, phone, email: email || null, birth_date: birth || null,
    instagram: opt(f, 'instagram', 60)?.replace('@', '') ?? null, ...health, health_consent_at: consentAt,
    internal_notes: opt(f, 'internal_notes', 5000)
  };
  const { data, error } = id
    ? await db.from('clients').update(row).eq('id', id).eq('artist_id', ctx.artistId).select('id').single()
    : await db.from('clients').insert({ ...row, source: 'painel' }).select('id').single();
  if (error || !data) return { error: error?.code === '23505' ? 'Já existe um cliente com esse telefone.' : 'Não foi possível salvar: ' + (error?.message ?? '') };
  await audit(ctx.artistId, ctx.userId, id ? 'atualizar' : 'criar', 'clients', data.id);
  revalidatePath('/admin/clientes');
  if (!id) redirect(`/admin/clientes/${data.id}?salvo=1`);
  revalidatePath(`/admin/clientes/${id}`);
  return { ok: 'Ficha salva.' };
}

/** Exclui a ficha (LGPD). Os agendamentos ficam, sem vínculo com a ficha, para manter o histórico financeiro. */
export async function deleteClient(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  if (str(f, 'confirm').toUpperCase() !== 'EXCLUIR') return { error: 'Digite EXCLUIR para confirmar.' };
  const db = serviceClient();
  const { data: active } = await db.from('appointments').select('id').eq('client_id', id).in('status', ['aguardando_pagamento', 'confirmado', 'reagendamento_solicitado']).limit(1);
  if (active?.length) return { error: 'Este cliente tem agendamento ativo. Cancele ou conclua antes de excluir a ficha.' };
  const { error } = await db.from('clients').delete().eq('id', id).eq('artist_id', ctx.artistId);
  if (error) return { error: 'Não foi possível excluir: ' + error.message };
  await audit(ctx.artistId, ctx.userId, 'excluir', 'clients', id);
  revalidatePath('/admin/clientes');
  redirect('/admin/clientes?excluido=1');
}

/** Gera um novo link de ficha (o antigo deixa de funcionar). */
export async function resetFichaLink(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const { error } = await serviceClient().from('clients').update({ ficha_token: token }).eq('id', id).eq('artist_id', ctx.artistId);
  if (error) return { error: error.message };
  await audit(ctx.artistId, ctx.userId, 'novo_link_ficha', 'clients', id);
  revalidatePath(`/admin/clientes/${id}`);
  return { ok: 'Novo link gerado. O anterior não funciona mais.' };
}
