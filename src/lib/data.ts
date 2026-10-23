import 'server-only';
import { cache } from 'react';
import { serviceClient } from './supabase/admin';
import { env } from './env';
import type { Artist, FlashProject, PortfolioItem, Settings, Style, Testimonial } from './types';

/**
 * Leituras do conteúdo público. Usam a chave de serviço no servidor, mas
 * filtram explicitamente o que é público (mesmas regras das políticas RLS).
 */
export const getArtist = cache(async (): Promise<Artist> => {
  const { data, error } = await serviceClient().from('artists').select('id, slug, name, timezone').eq('slug', env.artistSlug()).single();
  if (error) {
    // mostra a causa real no terminal (chave errada, URL errada, sem internet...)
    console.error('[getArtist] Supabase respondeu:', error.message, error.code ?? '', error.hint ?? '');
    throw new Error(`Não foi possível ler o banco: ${error.message}. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local e reinicie o npm run dev.`);
  }
  if (!data) throw new Error(`Artista "${env.artistSlug()}" não encontrado. Confira ARTIST_SLUG no .env.local.`);
  return data as Artist;
});

export const getSettings = cache(async (): Promise<Settings> => {
  const artist = await getArtist();
  const { data, error } = await serviceClient().from('site_settings').select('*').eq('artist_id', artist.id).single();
  if (error || !data) throw new Error('Configurações do site não encontradas.');
  return data as Settings;
});

export const getStyles = cache(async (): Promise<Style[]> => {
  const artist = await getArtist();
  const { data } = await serviceClient().from('tattoo_styles').select('id, slug, name, description, sort').eq('artist_id', artist.id).order('sort');
  return (data ?? []) as Style[];
});

const ITEM_SELECT = 'id, slug, title, style_id, body_region, description, year, status, featured, client_consent, sort, style:tattoo_styles(id, slug, name, description, sort), images:portfolio_images(id, storage_path, alt, sort)';

function sortImages(items: PortfolioItem[]) {
  items.forEach((i) => i.images?.sort((a, b) => a.sort - b.sort));
  return items;
}

export const getPublishedWorks = cache(async (): Promise<PortfolioItem[]> => {
  const artist = await getArtist();
  const { data } = await serviceClient().from('portfolio_items').select(ITEM_SELECT)
    .eq('artist_id', artist.id).eq('status', 'publicado').order('sort').order('created_at', { ascending: false });
  // no site só aparece trabalho com pelo menos uma foto enviada pelo artista
  return sortImages((data ?? []) as unknown as PortfolioItem[]).filter((w) => w.images.length > 0);
});

export async function getPublishedWork(slug: string): Promise<PortfolioItem | null> {
  const works = await getPublishedWorks();
  return works.find((w) => w.slug === slug) ?? null;
}

export const getFlashProjects = cache(async (opts: { includeSold?: boolean } = {}): Promise<FlashProject[]> => {
  const artist = await getArtist();
  let q = serviceClient().from('flash_projects').select('*, style:tattoo_styles(id, slug, name, description, sort)').eq('artist_id', artist.id).neq('status', 'arquivado').not('image_path', 'is', null);
  if (!opts.includeSold) q = q.neq('status', 'vendido');
  const { data } = await q.order('sort');
  return (data ?? []) as FlashProject[];
});

/** Depoimentos publicados (só os autorizados pelos clientes). */
export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const artist = await getArtist();
  const { data } = await serviceClient().from('testimonials').select('*').eq('artist_id', artist.id).eq('published', true).order('sort').order('created_at', { ascending: false }).limit(12);
  return (data ?? []) as Testimonial[];
});

/** Projetos que podem ser experimentados no simulador (precisam do PNG transparente). */
export const getSimulatorProjects = cache(async (): Promise<FlashProject[]> => {
  const all = await getFlashProjects();
  return all.filter((f) => f.status === 'disponivel' && f.simulation_enabled !== false && !!f.simulation_image_path);
});

export function simulationImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${env.supabaseUrl()}/storage/v1/object/public/simulacao/${path}`;
}

export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${env.supabaseUrl()}/storage/v1/object/public/portfolio/${path}`;
}
