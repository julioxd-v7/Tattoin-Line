'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';
import type { ActionState } from './actions';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

async function upload(artistId: string, file: File): Promise<string> {
  if (!TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Envie JPG, PNG, WebP ou AVIF com até 10 MB.');
  const path = `${artistId}/pagina-inicial/${crypto.randomBytes(8).toString('hex')}.${file.type.split('/')[1].replace('jpeg', 'jpg')}`;
  const { error } = await serviceClient().storage.from('portfolio').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw new Error('Falha no envio da imagem: ' + error.message);
  return path;
}

async function removeOld(path: string | null) {
  if (path) await serviceClient().storage.from('portfolio').remove([path]);
}

/** Foto de destaque do topo ou foto do "Sobre mim". */
export async function saveHomeImage(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const slot = str(f, 'slot') === 'about' ? 'about' : 'hero';
  const db = serviceClient();
  const { data: cur } = await db.from('site_settings').select('hero_image_path, about_image_path').eq('artist_id', ctx.artistId).single();
  const oldPath = slot === 'hero' ? cur?.hero_image_path ?? null : cur?.about_image_path ?? null;
  const update: Record<string, string | null> = {};
  if (f.get('remove') === '1') {
    update[`${slot}_image_path`] = null;
    await removeOld(oldPath);
  } else {
    const file = f.get('image');
    const alt = str(f, 'alt').slice(0, 300);
    if (file instanceof File && file.size > 0) {
      if (alt.length < 3) return { error: 'Descreva a imagem (texto alternativo) para quem usa leitor de tela.' };
      try { update[`${slot}_image_path`] = await upload(ctx.artistId, file); } catch (e) { return { error: (e as Error).message }; }
      await removeOld(oldPath);
    } else if (!oldPath) {
      return { error: 'Escolha uma imagem.' };
    }
    if (alt) update[`${slot}_image_alt`] = alt;
    if (slot === 'hero') update.hero_caption = str(f, 'caption').slice(0, 120) || null;
  }
  const { error } = await db.from('site_settings').update(update).eq('artist_id', ctx.artistId);
  if (error) return { error: error.message };
  await audit(ctx.artistId, ctx.userId, 'pagina_inicial', 'site_settings', slot, { campos: Object.keys(update) });
  revalidatePath('/', 'layout');
  return { ok: f.get('remove') === '1' ? 'Imagem removida. O espaço some do site.' : 'Imagem salva. Já aparece na página inicial.' };
}

/** Ordem dos trabalhos e projetos mostrados na página inicial. */
export async function saveHomeLists(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const k = str(f, 'kind');
  const kind = k === 'flash' ? 'flash' : k === 'instagram' ? 'instagram' : 'works';
  const slots = kind === 'instagram' ? 6 : 4;
  const ids = Array.from({ length: slots }, (_, i) => str(f, `slot_${i + 1}`)).filter((v) => /^[0-9a-f-]{36}$/.test(v));
  const unique = Array.from(new Set(ids));
  if (unique.length !== ids.length) return { error: 'A mesma arte foi escolhida em mais de um espaço.' };
  const db = serviceClient();
  // confere se tudo pertence ao artista e pode aparecer no site
  if (unique.length) {
    const table = kind === 'flash' ? 'flash_projects' : 'portfolio_items';
    const { data } = await db.from(table).select('id').eq('artist_id', ctx.artistId).in('id', unique);
    if ((data ?? []).length !== unique.length) return { error: 'Uma das artes escolhidas não foi encontrada.' };
  }
  const field = kind === 'flash' ? 'home_flash' : kind === 'instagram' ? 'home_instagram' : 'home_works';
  const { error } = await db.from('site_settings').update({ [field]: unique }).eq('artist_id', ctx.artistId);
  if (error) return { error: error.message };
  await audit(ctx.artistId, ctx.userId, 'pagina_inicial', 'site_settings', kind, { ids: unique });
  revalidatePath('/', 'layout');
  return { ok: unique.length ? 'Página inicial atualizada.' : 'Espaço esvaziado: a seção some da página inicial.' };
}
