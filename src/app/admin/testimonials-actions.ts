'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';
import type { ActionState } from './actions';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

/** Cria ou edita um depoimento. Só publica com a autorização do cliente marcada. */
export async function saveTestimonial(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const author = str(f, 'author_name');
  const body = str(f, 'body');
  const rating = Number(str(f, 'rating'));
  if (author.length < 2) return { error: 'Informe o nome (ou primeiro nome) do cliente.' };
  if (body.length < 10 || body.length > 600) return { error: 'O depoimento precisa ter entre 10 e 600 caracteres.' };
  if (f.get('consent') !== 'on') return { error: 'Confirme que o cliente autorizou a publicação do depoimento.' };
  const row = {
    artist_id: ctx.artistId,
    author_name: author.slice(0, 80),
    body,
    rating: rating >= 1 && rating <= 5 ? rating : null,
    source: str(f, 'source').slice(0, 80) || null,
    published: f.get('published') === 'on',
    sort: Number(str(f, 'sort') || 0) || 0
  };
  const db = serviceClient();
  const { error } = id
    ? await db.from('testimonials').update(row).eq('id', id).eq('artist_id', ctx.artistId)
    : await db.from('testimonials').insert({ ...row, consent_at: new Date().toISOString() });
  if (error) return { error: error.message };
  await audit(ctx.artistId, ctx.userId, id ? 'atualizar' : 'criar', 'testimonials', id || author);
  revalidatePath('/', 'layout');
  return { ok: id ? 'Depoimento salvo.' : 'Depoimento adicionado.' };
}

export async function deleteTestimonial(f: FormData) {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  await serviceClient().from('testimonials').delete().eq('id', id).eq('artist_id', ctx.artistId);
  await audit(ctx.artistId, ctx.userId, 'excluir', 'testimonials', id);
  revalidatePath('/', 'layout');
}
