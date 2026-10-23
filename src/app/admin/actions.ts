'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';
import { z } from 'zod';
import { sessionClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { audit, appointmentEvent } from '@/lib/audit';
import { getArtist } from '@/lib/data';
import { cancelAppointment, refreshFromProvider, BookingError } from '@/lib/booking';
import { createPreference } from '@/lib/mercadopago';
import { depositFor } from '@/lib/pricing';
import { notify } from '@/lib/notify';
import { zonedToUtc } from '@/lib/tz';
import { integrations } from '@/lib/env';
import { sniffImage, ART_MAX_BYTES } from '@/lib/simulator';
import type { Appointment, Settings } from '@/lib/types';

export type ActionState = { ok?: string; error?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const reais = (v: string) => Math.round(Number(v.replace(/\./g, '').replace(',', '.')) * 100);
const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'item';
const refreshSite = () => revalidatePath('/', 'layout');

// ---------- Autenticação ----------
export async function login(_: ActionState, f: FormData): Promise<ActionState> {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse({ email: str(f, 'email'), password: String(f.get('password') ?? '') });
  if (!parsed.success) return { error: 'Informe e-mail e senha (mínimo de 8 caracteres).' };
  const { error } = await sessionClient().auth.signInWithPassword(parsed.data);
  if (error) return { error: 'E-mail ou senha incorretos.' };
  redirect('/admin');
}

export async function logout() {
  await sessionClient().auth.signOut();
  redirect('/admin/login');
}

// ---------- Configurações ----------
export async function saveSettings(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const tiersRaw = str(f, 'size_tiers');
  let tiers: Settings['size_tiers'];
  try {
    tiers = tiersRaw.split('\n').map((l) => l.trim()).filter(Boolean).map((line, i) => {
      const [label, price, minutes] = line.split('|').map((x) => x.trim());
      const priceCents = price && price !== '-' ? reais(price) : null;
      const mins = minutes && minutes !== '-' ? Number(minutes) : null;
      if (!label || (priceCents != null && !(priceCents > 0)) || (mins != null && !(mins > 0))) throw new Error();
      return { id: `t${i + 1}`, label, from_cents: priceCents, minutes: priceCents == null ? null : mins };
    });
  } catch { return { error: 'Faixas de tamanho: use uma por linha no formato  Rótulo | valor | minutos  (ou "-" para orçamento).' }; }
  const schema = z.object({
    hero_title: z.string().min(3).max(120), hero_subtitle: z.string().max(400), about: z.string().max(3000),
    accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
    contact_email: z.string().email().or(z.literal('')), whatsapp: z.string().max(20), instagram: z.string().max(60),
    address: z.string().max(200), city: z.string().max(80), business_info: z.string().max(200),
    deposit_percent: z.coerce.number().int().min(0).max(100), deposit_min: z.string(), hold_minutes: z.coerce.number().int().min(10).max(1440),
    buffer_minutes: z.coerce.number().int().min(0).max(240), min_session: z.string(), hourly_rate: z.string(),
    consult_price: z.string(), consult_minutes: z.coerce.number().int().min(15).max(240),
    payment_methods_text: z.string().max(500), quote_rules_text: z.string().max(1500), cancellation_policy: z.string().min(20).max(3000),
    privacy_policy: z.string().min(20).max(5000), reschedule_min_hours: z.coerce.number().int().min(0).max(720), booking_window_days: z.coerce.number().int().min(7).max(365),
    specialties: z.string().max(300),
    brand_name: z.string().min(2, 'Nome do site').max(60), artist_name: z.string().min(2, 'Nome do artista').max(80),
    seo_description: z.string().max(300), whatsapp_message: z.string().max(300)
  });
  const p = schema.safeParse(Object.fromEntries(['hero_title', 'hero_subtitle', 'about', 'accent_color', 'contact_email', 'whatsapp', 'instagram', 'address', 'city', 'business_info', 'deposit_percent', 'deposit_min', 'hold_minutes', 'buffer_minutes', 'min_session', 'hourly_rate', 'consult_price', 'consult_minutes', 'payment_methods_text', 'quote_rules_text', 'cancellation_policy', 'privacy_policy', 'reschedule_min_hours', 'booking_window_days', 'specialties', 'brand_name', 'artist_name', 'seo_description', 'whatsapp_message'].map((k) => [k, str(f, k)])));
  if (!p.success) return { error: 'Verifique os campos: ' + p.error.issues.map((i) => i.path.join('.')).join(', ') };
  const d = p.data;
  const row = {
    hero_title: d.hero_title, hero_subtitle: d.hero_subtitle, about: d.about, accent_color: d.accent_color,
    contact_email: d.contact_email || null, whatsapp: d.whatsapp.replace(/\D/g, '') || null, instagram: d.instagram.replace('@', '') || null,
    address: d.address || null, city: d.city || null, business_info: d.business_info || null,
    deposit_percent: d.deposit_percent, deposit_min_cents: reais(d.deposit_min || '0'), allow_full_payment: f.get('allow_full_payment') === 'on',
    hold_minutes: d.hold_minutes, buffer_minutes: d.buffer_minutes, min_session_cents: reais(d.min_session || '0'),
    hourly_rate_cents: d.hourly_rate ? reais(d.hourly_rate) : null, consult_enabled: f.get('consult_enabled') === 'on',
    consult_price_cents: reais(d.consult_price || '0'), consult_minutes: d.consult_minutes, size_tiers: tiers,
    payment_methods_text: d.payment_methods_text, quote_rules_text: d.quote_rules_text, cancellation_policy: d.cancellation_policy,
    privacy_policy: d.privacy_policy, reschedule_min_hours: d.reschedule_min_hours, booking_window_days: d.booking_window_days,
    specialties: d.specialties.split(',').map((x) => x.trim()).filter(Boolean),
    brand_name: d.brand_name, seo_description: d.seo_description || null, whatsapp_message: d.whatsapp_message || null
  };
  const { error } = await serviceClient().from('site_settings').update(row).eq('artist_id', ctx.artistId);
  if (error) return { error: 'Não foi possível salvar: ' + error.message };
  const { error: e2 } = await serviceClient().from('artists').update({ name: d.artist_name }).eq('id', ctx.artistId);
  if (e2) return { error: 'Não foi possível salvar o nome do artista: ' + e2.message };
  await audit(ctx.artistId, ctx.userId, 'atualizar', 'site_settings', ctx.artistId, { campos: Object.keys(row) });
  refreshSite();
  return { ok: 'Configurações salvas. Agendamentos já feitos mantêm os valores da época.' };
}

// ---------- Estilos ----------
export async function saveStyle(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id'), name = str(f, 'name');
  if (name.length < 2) return { error: 'Informe o nome do estilo.' };
  const row = { artist_id: ctx.artistId, name, slug: slugify(str(f, 'slug') || name), description: str(f, 'description').slice(0, 400), sort: Number(str(f, 'sort') || 0) };
  const q = id ? serviceClient().from('tattoo_styles').update(row).eq('id', id).eq('artist_id', ctx.artistId) : serviceClient().from('tattoo_styles').insert(row);
  const { error } = await q;
  if (error) return { error: error.code === '23505' ? 'Já existe um estilo com esse endereço.' : error.message };
  await audit(ctx.artistId, ctx.userId, id ? 'atualizar' : 'criar', 'tattoo_styles', id || row.slug);
  refreshSite();
  return { ok: 'Estilo salvo.' };
}

export async function deleteStyle(f: FormData) {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  await serviceClient().from('tattoo_styles').delete().eq('id', id).eq('artist_id', ctx.artistId);
  await audit(ctx.artistId, ctx.userId, 'excluir', 'tattoo_styles', id);
  refreshSite();
}

// ---------- Portfólio ----------
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** PNG/WebP transparente para o simulador (bucket público 'simulacao'). Confere o conteúdo, não só a extensão. */
async function uploadSimulationImage(artistId: string, file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(buf.subarray(0, 16));
  if (type !== 'image/png' && type !== 'image/webp') throw new Error('A imagem do simulador precisa ser PNG ou WebP com fundo transparente.');
  if (file.size > ART_MAX_BYTES) throw new Error('A imagem do simulador deve ter até 8 MB.');
  const path = `${artistId}/${crypto.randomBytes(8).toString('hex')}.${type === 'image/png' ? 'png' : 'webp'}`;
  const { error } = await serviceClient().storage.from('simulacao').upload(path, buf, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error('Falha no envio da imagem do simulador: ' + error.message);
  return path;
}

async function uploadImages(artistId: string, folder: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!IMAGE_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Imagens devem ser JPG, PNG, WebP ou AVIF com até 10 MB.');
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${artistId}/${folder}/${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const { error } = await serviceClient().storage.from('portfolio').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
    if (error) throw new Error('Falha no envio da imagem: ' + error.message);
    paths.push(path);
  }
  return paths;
}

export async function saveWork(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const title = str(f, 'title');
  if (title.length < 2) return { error: 'Informe o título.' };
  const status = str(f, 'status') as 'rascunho' | 'publicado' | 'arquivado';
  const consent = f.get('client_consent') === 'on';
  if (status === 'publicado' && !consent) return { error: 'Para publicar, confirme que o cliente autorizou o uso das imagens.' };
  const year = str(f, 'year') ? Number(str(f, 'year')) : null;
  const row = {
    artist_id: ctx.artistId, title, slug: slugify(str(f, 'slug') || title), style_id: str(f, 'style_id') || null,
    body_region: str(f, 'body_region') || null, description: str(f, 'description').slice(0, 2000), year: year && year > 1990 ? year : null,
    status: ['rascunho', 'publicado', 'arquivado'].includes(status) ? status : 'rascunho', featured: f.get('featured') === 'on',
    client_consent: consent, sort: Number(str(f, 'sort') || 0)
  };
  const db = serviceClient();
  const { data, error } = id
    ? await db.from('portfolio_items').update(row).eq('id', id).eq('artist_id', ctx.artistId).select('id').single()
    : await db.from('portfolio_items').insert(row).select('id').single();
  if (error || !data) return { error: error?.code === '23505' ? 'Já existe um trabalho com esse endereço (slug).' : error?.message ?? 'Erro ao salvar.' };
  const files = f.getAll('images').filter((x): x is File => x instanceof File && x.size > 0);
  const alt = str(f, 'alt') || `Tatuagem ${title}`;
  try {
    const paths = await uploadImages(ctx.artistId, `trabalhos/${data.id}`, files);
    if (paths.length) {
      const { count } = await db.from('portfolio_images').select('id', { count: 'exact', head: true }).eq('item_id', data.id);
      await db.from('portfolio_images').insert(paths.map((p, i) => ({ item_id: data.id, storage_path: p, alt, sort: (count ?? 0) + i })));
    }
  } catch (e) { return { error: (e as Error).message }; }
  // sem foto não vai para o site: volta para rascunho
  let noPhoto = false;
  if (row.status === 'publicado') {
    const { count: photos } = await db.from('portfolio_images').select('id', { count: 'exact', head: true }).eq('item_id', data.id);
    if (!photos) { noPhoto = true; await db.from('portfolio_items').update({ status: 'rascunho' }).eq('id', data.id); }
  }
  await audit(ctx.artistId, ctx.userId, id ? 'atualizar' : 'criar', 'portfolio_items', data.id, { status: row.status });
  refreshSite();
  if (!id) redirect(`/admin/portfolio/${data.id}?${noPhoto ? 'semfoto' : 'salvo'}=1`);
  if (noPhoto) return { error: 'Salvo como rascunho: envie pelo menos uma foto para publicar no site.' };
  return { ok: 'Trabalho salvo.' };
}

export async function deleteWork(f: FormData) {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const db = serviceClient();
  const { data: imgs } = await db.from('portfolio_images').select('storage_path, item:portfolio_items!inner(artist_id)').eq('item_id', id).eq('item.artist_id', ctx.artistId);
  if (imgs?.length) await db.storage.from('portfolio').remove(imgs.map((i: { storage_path: string }) => i.storage_path));
  await db.from('portfolio_items').delete().eq('id', id).eq('artist_id', ctx.artistId);
  await audit(ctx.artistId, ctx.userId, 'excluir', 'portfolio_items', id);
  refreshSite();
  redirect('/admin/portfolio');
}

export async function deleteImage(f: FormData) {
  const ctx = await requireAdmin();
  const id = str(f, 'image_id');
  const db = serviceClient();
  const { data } = await db.from('portfolio_images').select('id, storage_path, item_id, item:portfolio_items!inner(artist_id)').eq('id', id).eq('item.artist_id', ctx.artistId).maybeSingle();
  if (!data) return;
  await db.storage.from('portfolio').remove([data.storage_path]);
  await db.from('portfolio_images').delete().eq('id', id);
  refreshSite();
  revalidatePath(`/admin/portfolio/${data.item_id}`);
}

// ---------- Projetos autorais ----------
export async function saveFlash(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const name = str(f, 'name');
  const price = reais(str(f, 'price') || '0');
  const minutes = Number(str(f, 'duration_minutes'));
  if (name.length < 2 || !(price > 0) || !(minutes >= 15)) return { error: 'Informe nome, preço e duração (mínimo 15 min).' };
  const status = str(f, 'status') as 'disponivel' | 'reservado' | 'vendido' | 'arquivado';
  const db = serviceClient();
  if (id) {
    // não deixa liberar um projeto que tem agendamento ativo
    const { data: active } = await db.from('appointments').select('id').eq('flash_project_id', id).in('status', ['aguardando_pagamento', 'confirmado', 'reagendamento_solicitado']).limit(1);
    if (active?.length && status === 'disponivel') return { error: 'Este projeto tem um agendamento ativo. Cancele ou conclua o agendamento antes de liberá-lo.' };
    if (active?.length) {
      const { data: cur } = await db.from('flash_projects').select('price_cents').eq('id', id).single();
      if (cur && cur.price_cents !== price) return { error: 'Não é possível mudar o preço de um projeto com agendamento ativo.' };
    }
  }
  const row: Record<string, unknown> = {
    artist_id: ctx.artistId, name, slug: slugify(str(f, 'slug') || name), style_id: str(f, 'style_id') || null,
    description: str(f, 'description').slice(0, 2000), size_label: str(f, 'size_label') || 'A combinar', body_region: str(f, 'body_region') || null,
    price_cents: price, duration_minutes: minutes, status: ['disponivel', 'reservado', 'vendido', 'arquivado'].includes(status) ? status : 'disponivel',
    sort: Number(str(f, 'sort') || 0), image_alt: str(f, 'image_alt') || `Desenho: ${name}`,
    simulation_enabled: f.get('simulation_enabled') === 'on'
  };
  const file = f.get('image');
  const simFile = f.get('sim_image');
  try {
    if (file instanceof File && file.size > 0) {
      const [path] = await uploadImages(ctx.artistId, 'projetos', [file]);
      row.image_path = path;
    }
    if (simFile instanceof File && simFile.size > 0) row.simulation_image_path = await uploadSimulationImage(ctx.artistId, simFile);
    else if (f.get('sim_remove') === 'on') row.simulation_image_path = null;
  } catch (e) { return { error: (e as Error).message }; }
  if (!row.image_path && ['disponivel', 'reservado'].includes(String(row.status))) {
    const { data: cur } = id ? await db.from('flash_projects').select('image_path').eq('id', id).maybeSingle() : { data: null };
    if (!cur?.image_path) return { error: 'Envie a imagem do desenho: projetos sem imagem não aparecem no site.' };
  }
  const { data, error } = id
    ? await db.from('flash_projects').update(row).eq('id', id).eq('artist_id', ctx.artistId).select('id').single()
    : await db.from('flash_projects').insert(row).select('id').single();
  if (error || !data) return { error: error?.code === '23505' ? 'Já existe um projeto com esse endereço.' : error?.message ?? 'Erro ao salvar.' };
  await audit(ctx.artistId, ctx.userId, id ? 'atualizar' : 'criar', 'flash_projects', data.id, { status: row.status, price_cents: price });
  refreshSite();
  if (!id) redirect(`/admin/projetos/${data.id}?salvo=1`);
  return { ok: 'Projeto salvo.' };
}

// ---------- Disponibilidade ----------
export async function saveRules(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const rows: { artist_id: string; weekday: number; start_time: string; end_time: string }[] = [];
  for (let d = 0; d < 7; d++) {
    if (f.get(`on_${d}`) !== 'on') continue;
    const start = str(f, `start_${d}`), end = str(f, `end_${d}`);
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) return { error: 'Confira os horários: o fim precisa ser depois do início.' };
    rows.push({ artist_id: ctx.artistId, weekday: d, start_time: start, end_time: end });
  }
  const db = serviceClient();
  await db.from('availability_rules').delete().eq('artist_id', ctx.artistId);
  if (rows.length) {
    const { error } = await db.from('availability_rules').insert(rows);
    if (error) return { error: error.message };
  }
  await audit(ctx.artistId, ctx.userId, 'atualizar', 'availability_rules', null, { dias: rows.map((r) => r.weekday) });
  return { ok: 'Horários de atendimento salvos.' };
}

export async function addBlock(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const date = str(f, 'date'), endDate = str(f, 'end_date') || date;
  const allDay = f.get('all_day') === 'on';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Informe a data.' };
  const start = zonedToUtc(date, allDay ? '00:00' : str(f, 'start') || '00:00', artist.timezone);
  const end = allDay ? new Date(zonedToUtc(endDate, '00:00', artist.timezone).getTime() + 86400000) : zonedToUtc(endDate, str(f, 'end') || '23:59', artist.timezone);
  if (end <= start) return { error: 'O fim do bloqueio precisa ser depois do início.' };
  const { error } = await serviceClient().from('blocked_slots').insert({ artist_id: ctx.artistId, starts_at: start.toISOString(), ends_at: end.toISOString(), reason: str(f, 'reason').slice(0, 120) });
  if (error) return { error: error.message };
  await audit(ctx.artistId, ctx.userId, 'criar', 'blocked_slots', null, { start, end });
  return { ok: 'Bloqueio adicionado. Agendamentos já confirmados nesse período não são alterados.' };
}

export async function deleteBlock(f: FormData) {
  const ctx = await requireAdmin();
  await serviceClient().from('blocked_slots').delete().eq('id', str(f, 'id')).eq('artist_id', ctx.artistId);
  revalidatePath('/admin/disponibilidade');
}

// ---------- Agendamentos ----------
async function loadAppt(artistId: string, id: string): Promise<Appointment> {
  const { data } = await serviceClient().from('appointments').select('*').eq('id', id).eq('artist_id', artistId).single();
  if (!data) throw new BookingError('NAO_ENCONTRADO', 'Agendamento não encontrado.');
  return data as Appointment;
}

function wrap(fn: () => Promise<string>): Promise<ActionState> {
  return fn().then((ok) => ({ ok }), (e) => ({ error: e instanceof BookingError ? e.message : (e as Error).message?.includes('appointments_no_overlap') ? 'Esse horário conflita com outro agendamento.' : 'Não foi possível concluir: ' + (e as Error).message }));
}

export async function apptAction(_: ActionState, f: FormData): Promise<ActionState> {
  const ctx = await requireAdmin();
  const id = str(f, 'id');
  const action = str(f, 'action');
  const artist = await getArtist();
  const db = serviceClient();
  const result = await wrap(async () => {
    const a = await loadAppt(ctx.artistId, id);
    const nctx = { tz: artist.timezone, artistName: artist.name };
    switch (action) {
      case 'cancelar_reembolso':
      case 'cancelar_sem_reembolso': {
        await cancelAppointment(a, { refund: action === 'cancelar_reembolso', actor: ctx.email ?? 'admin', reason: str(f, 'reason') });
        return action === 'cancelar_reembolso' && a.payment_status === 'aprovado' ? 'Cancelado. Reembolso solicitado ao Mercado Pago.' : 'Agendamento cancelado.';
      }
      case 'concluir': {
        if (a.status !== 'confirmado') throw new BookingError('STATUS', 'Só sessões confirmadas podem ser concluídas.');
        await db.from('appointments').update({ status: 'concluido', balance_paid_at: f.get('balance_paid') === 'on' ? new Date().toISOString() : null }).eq('id', a.id);
        if (a.flash_project_id) await db.from('flash_projects').update({ status: 'vendido' }).eq('id', a.flash_project_id);
        await appointmentEvent(a.id, 'concluido', ctx.email ?? 'admin', { saldo_recebido: f.get('balance_paid') === 'on' });
        return 'Sessão marcada como concluída.';
      }
      case 'consultar_pagamento': {
        if (!integrations.payments()) throw new BookingError('MP', 'Mercado Pago não configurado.');
        const n = await refreshFromProvider(a.id);
        return n ? `Status atualizado a partir de ${n} pagamento(s) no Mercado Pago.` : 'Nenhum pagamento encontrado no Mercado Pago para esta reserva.';
      }
      case 'resolver_alerta': {
        await db.from('appointments').update({ needs_attention: false }).eq('id', a.id);
        await appointmentEvent(a.id, 'alerta_resolvido', ctx.email ?? 'admin', { nota: str(f, 'note') });
        return 'Alerta marcado como resolvido.';
      }
      case 'reagendar': {
        if (!['confirmado', 'reagendamento_solicitado'].includes(a.status)) throw new BookingError('STATUS', 'Só sessões confirmadas podem ser reagendadas.');
        const date = str(f, 'date'), time = str(f, 'time');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new BookingError('DATA', 'Informe data e hora.');
        const start = zonedToUtc(date, time, artist.timezone);
        const end = new Date(start.getTime() + (a.duration_minutes ?? 60) * 60000);
        const { data: u, error } = await db.from('appointments').update({ starts_at: start.toISOString(), ends_at: end.toISOString(), status: 'confirmado', reminder_sent_at: null }).eq('id', a.id).select('*').single();
        if (error) throw new Error(error.message);
        await appointmentEvent(a.id, 'reagendado', ctx.email ?? 'admin', { de: a.starts_at, para: start.toISOString() });
        await notify('alteracao_horario', { appointment: u as Appointment, ...nctx });
        return 'Nova data confirmada e cliente avisado.';
      }
      case 'enviar_orcamento': {
        if (a.status !== 'solicitado') throw new BookingError('STATUS', 'Este pedido não está aguardando avaliação.');
        if (!integrations.payments()) throw new BookingError('MP', 'Configure o Mercado Pago para enviar o link de pagamento.');
        const total = reais(str(f, 'total') || '0');
        const minutes = Number(str(f, 'duration_minutes'));
        const date = str(f, 'date'), time = str(f, 'time');
        if (!(total > 0) || !(minutes >= 15) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new BookingError('DADOS', 'Informe valor, duração, data e hora.');
        const { data: s } = await db.from('site_settings').select('*').eq('artist_id', ctx.artistId).single();
        const settings = s as Settings;
        const dep = depositFor(total, settings);
        const start = zonedToUtc(date, time, artist.timezone);
        const holdHours = Math.max(24, settings.hold_minutes / 60); // orçamento: cliente tem pelo menos 24 h para pagar
        const holdUntil = new Date(Date.now() + holdHours * 3600000);
        const { data: u, error } = await db.from('appointments').update({
          starts_at: start.toISOString(), ends_at: new Date(start.getTime() + minutes * 60000).toISOString(), duration_minutes: minutes,
          buffer_minutes: settings.buffer_minutes, total_cents: total, deposit_cents: dep, balance_cents: total - dep, amount_due_cents: dep,
          is_estimate: false, charge_mode: 'sinal', status: 'aguardando_pagamento', payment_status: 'pendente', hold_expires_at: holdUntil.toISOString(),
          terms_snapshot: { ...a.terms_snapshot, quote_label: `Sessão personalizada (orçamento)`, quoted_at: new Date().toISOString(), deposit_percent: settings.deposit_percent }
        }).eq('id', a.id).eq('status', 'solicitado').select('*').single();
        if (error || !u) throw new Error(error?.message ?? 'conflito');
        try {
          const pref = await createPreference({ appointmentId: a.id, publicToken: a.public_token, title: 'Sessão personalizada — sinal', amountCents: dep, payerEmail: a.customer_email, payerName: a.customer_name, expiresAt: holdUntil });
          const { data: u2 } = await db.from('appointments').update({ mp_preference_id: pref.id, mp_checkout_url: pref.checkoutUrl }).eq('id', a.id).select('*').single();
          await notify('orcamento_pronto', { appointment: u2 as Appointment, ...nctx });
        } catch (e) {
          await db.from('appointments').update({ status: 'solicitado', payment_status: 'nao_iniciado', starts_at: null, ends_at: null, hold_expires_at: null }).eq('id', a.id);
          throw new Error('Falha ao criar a cobrança no Mercado Pago. O pedido voltou para avaliação. ' + (e as Error).message);
        }
        return 'Orçamento enviado. O horário fica reservado até o pagamento ou o fim do prazo.';
      }
      default:
        throw new BookingError('ACAO', 'Ação inválida.');
    }
  });
  await audit(ctx.artistId, ctx.userId, action, 'appointments', id, result ?? {});
  revalidatePath(`/admin/agenda/${id}`);
  revalidatePath('/admin');
  refreshSite();
  return result;
}
