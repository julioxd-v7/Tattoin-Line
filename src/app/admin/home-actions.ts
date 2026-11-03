'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { audit } from '@/lib/audit';
import { HERO_LIMITS, normalizeHeroTitle } from '@/lib/hero';
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
  const raw = str(f, 'slot');
  const slot = raw === 'about' || raw === 'sim' ? raw : 'hero';
  const db = serviceClient();
  // lê só a coluna do espaço; se ela não existe (migration pendente), avisa antes de enviar o arquivo
  const { data: cur, error: readErr } = await db.from('site_settings').select(`${slot}_image_path`).eq('artist_id', ctx.artistId).single();
  if (readErr) return { error: isMissingColumn(readErr) ? MIGRATION_0008 : 'Não foi possível ler as configurações: ' + readErr.message };
  const oldPath = ((cur as Record<string, string | null> | null)?.[`${slot}_image_path`]) ?? null;
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
  return { ok: f.get('remove') === '1' ? 'Imagem removida. O site volta a mostrar o espaço reservado.' : 'Imagem salva. Já aparece na página inicial.' };
}

const MIGRATION_0008 = 'Falta rodar no banco o arquivo supabase/migrations/0008_sobre_simulador.sql para usar este campo.';
const isMissingColumn = (e: { code?: string; message: string }) => e.code === '42703' || e.code === 'PGRST204' || /column|coluna/i.test(e.message);

/** "Sobre o artista": frase curta de apresentação e texto "Sobre mim". O nome fica em Configurações. */
export async function saveAboutContent(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const headline = str(f, 'about_headline').replace(/\s+/g, ' ');
  // mantém parágrafos (linha em branco) e quebras do texto
  const about = String(f.get('about') ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (headline.length > 160) return { error: 'A frase de apresentação pode ter até 160 caracteres.' };
  if (about.length > 3000) return { error: 'O texto "Sobre mim" pode ter até 3000 caracteres.' };
  const db = serviceClient();
  // texto principal primeiro: funciona mesmo antes da migration 0008
  const { error } = await db.from('site_settings').update({ about }).eq('artist_id', ctx.artistId);
  if (error) return { error: 'Não foi possível salvar: ' + error.message };
  const { error: e2 } = await db.from('site_settings').update({ about_headline: headline || null }).eq('artist_id', ctx.artistId);
  revalidatePath('/', 'layout');
  if (e2) return { error: isMissingColumn(e2) ? '"Sobre mim" salvo. ' + MIGRATION_0008 : '"Sobre mim" salvo, mas a frase não: ' + e2.message };
  await audit(ctx.artistId, ctx.userId, 'pagina_inicial', 'site_settings', 'sobre', { campos: ['about', 'about_headline'] });
  return { ok: 'Sobre o artista atualizado.' };
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

/** Textos e enquadramento da primeira dobra (título, frase, rótulo, layout, escurecimento, foco e zoom). */
export async function saveHeroContent(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const L = HERO_LIMITS;
  // o título aceita quebra de linha (Enter); por isso não usa o str() comum
  const title = normalizeHeroTitle(String(f.get('title') ?? ''));
  const subtitle = str(f, 'subtitle').replace(/\s+/g, ' ');
  const eyebrow = str(f, 'eyebrow').replace(/\s+/g, ' ');
  if (title.replace(/\n/g, '').length < 3) return { error: 'Escreva o título principal.' };
  if (title.length > L.titleMax) return { error: `O título pode ter até ${L.titleMax} caracteres.` };
  if (subtitle.length > L.subtitleMax) return { error: `A frase de apresentação pode ter até ${L.subtitleMax} caracteres.` };
  if (eyebrow.length > L.eyebrowMax) return { error: `O rótulo acima do título pode ter até ${L.eyebrowMax} caracteres.` };
  const int = (k: string, min: number, max: number, fallback: number) => {
    const n = Number(str(f, k));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };
  const display = {
    hero_eyebrow: eyebrow || null,
    hero_layout: str(f, 'layout') === 'fundo' ? 'fundo' : 'lateral',
    hero_overlay: int('overlay', L.overlay.min, L.overlay.max, L.overlay.default),
    hero_focus_x: int('focus_x', L.focus.min, L.focus.max, L.focus.default),
    hero_focus_y: int('focus_y', L.focus.min, L.focus.max, L.focus.default),
    hero_zoom: int('zoom', L.zoom.min, L.zoom.max, L.zoom.default)
  };
  const db = serviceClient();
  // textos primeiro: funcionam mesmo antes da migration 0007
  const { error } = await db.from('site_settings').update({ hero_title: title, hero_subtitle: subtitle }).eq('artist_id', ctx.artistId);
  if (error) return { error: 'Não foi possível salvar: ' + error.message };
  const { error: e2 } = await db.from('site_settings').update(display).eq('artist_id', ctx.artistId);
  revalidatePath('/', 'layout');
  if (e2) {
    const missing = e2.code === '42703' || e2.code === 'PGRST204' || /column|coluna/i.test(e2.message);
    return { error: missing
      ? 'Título e frase salvos. Para salvar o rótulo e o enquadramento da foto, rode no banco o arquivo supabase/migrations/0007_hero.sql.'
      : 'Título e frase salvos, mas o enquadramento não: ' + e2.message };
  }
  await audit(ctx.artistId, ctx.userId, 'pagina_inicial', 'site_settings', 'hero', { campos: ['hero_title', 'hero_subtitle', ...Object.keys(display)] });
  return { ok: 'Topo da página atualizado.' };
}

/** O que fazer com a seção de depoimentos quando não há nenhum publicado. */
export async function saveTestimonialsDisplay(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const show = f.get('show_empty') === 'on';
  const { error } = await serviceClient().from('site_settings').update({ testimonials_show_empty: show }).eq('artist_id', ctx.artistId);
  if (error) return { error: isMissingColumn(error) ? 'Falta rodar no banco o arquivo supabase/migrations/0009_depoimentos_vazio.sql para usar esta opção.' : error.message };
  await audit(ctx.artistId, ctx.userId, 'pagina_inicial', 'site_settings', 'depoimentos', { testimonials_show_empty: show });
  revalidatePath('/', 'layout');
  return { ok: show ? 'Sem depoimentos, a seção aparece com um aviso discreto.' : 'Sem depoimentos, a seção fica escondida.' };
}
