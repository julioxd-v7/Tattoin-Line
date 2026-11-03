import { isFilled } from './home';
import type { Settings } from './types';

/**
 * Valores que vêm do banco de demonstração (supabase/seed.sql) e nunca devem aparecer no site:
 * o artista ainda não trocou pelo dado real no painel.
 */
const SEED_INSTAGRAM = new Set(['tattoinline']);

/** Texto de exemplo: vazio, modelo entre colchetes ("[Endereço do estúdio]") ou com colchetes de modelo no meio. */
function isPlaceholder(v: string | null | undefined): boolean {
  return !isFilled(v) || /\[[^\]]*\]/.test(v);
}

/** Número de exemplo: sequência longa de zeros (ex.: 5581900000000, 00.000.000/0000-00). */
function isZeroFill(v: string): boolean {
  return /0{6,}/.test(v.replace(/\D/g, ''));
}

/** WhatsApp só com dígitos (DDI + DDD + número), ou null se ausente/de exemplo/inválido. */
export function cleanWhatsapp(v: string | null | undefined): string | null {
  if (isPlaceholder(v)) return null;
  const d = v!.replace(/\D/g, '');
  if (d.length < 10 || d.length > 15 || isZeroFill(d)) return null;
  return d;
}

/** Link do WhatsApp com mensagem pronta. */
export function whatsappLink(digits: string, message?: string | null): string {
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

/** E-mail válido e que não seja de exemplo (exemplo.com, example.com…). */
export function cleanEmail(v: string | null | undefined): string | null {
  if (isPlaceholder(v)) return null;
  const e = v!.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || /@(exemplo|example)\./i.test(e)) return null;
  return e;
}

/** Texto livre (endereço, cidade, dados comerciais) sem modelos nem números zerados. */
export function cleanText(v: string | null | undefined): string | null {
  if (isPlaceholder(v)) return null;
  const t = v!.trim();
  return isZeroFill(t) ? null : t;
}

/** Usuário do Instagram a partir de "@perfil", "perfil" ou link; null se ausente/de exemplo. */
export function cleanInstagram(v: string | null | undefined): string | null {
  if (isPlaceholder(v)) return null;
  const m = v!.trim().match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/);
  if (!m) return null;
  const handle = m[1];
  return SEED_INSTAGRAM.has(handle.toLowerCase()) ? null : handle;
}

export type SocialNetwork = 'tiktok' | 'youtube' | 'facebook';

const SOCIAL: Record<SocialNetwork, { hosts: RegExp; fromHandle: (h: string) => string; handle: RegExp }> = {
  tiktok: { hosts: /(^|\.)tiktok\.com$/i, fromHandle: (h) => `https://www.tiktok.com/@${h}`, handle: /^@?([A-Za-z0-9._]{2,24})$/ },
  youtube: { hosts: /(^|\.)(youtube\.com|youtu\.be)$/i, fromHandle: (h) => `https://www.youtube.com/@${h}`, handle: /^@?([A-Za-z0-9._-]{3,30})$/ },
  facebook: { hosts: /(^|\.)(facebook\.com|fb\.com)$/i, fromHandle: (h) => `https://www.facebook.com/${h}`, handle: /^@?([A-Za-z0-9.]{5,50})$/ }
};

/**
 * Link de rede social a partir do que o artista digitou: link completo (https://…) ou @perfil.
 * Só aceita o domínio da própria rede. Inválido ou de exemplo → null.
 */
export function socialUrl(network: SocialNetwork, v: string | null | undefined): string | null {
  if (isPlaceholder(v)) return null;
  const raw = v!.trim();
  const cfg = SOCIAL[network];
  const h = raw.match(cfg.handle);
  if (h) return cfg.fromHandle(h[1]);
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!cfg.hosts.test(u.hostname) || u.pathname.replace(/\/+$/, '') === '') return null;
    u.protocol = 'https:';
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export interface PublicContact {
  whatsapp: string | null;
  whatsappUrl: string | null;
  email: string | null;
  instagram: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  address: string | null;
  city: string | null;
  businessInfo: string | null;
}

/** Tudo que o site pode mostrar de contato e dados legais, já sem dados de exemplo. */
export function publicContact(s: Partial<Settings> & { brand_name?: string }): PublicContact {
  const whatsapp = cleanWhatsapp(s.whatsapp);
  const instagram = cleanInstagram(s.instagram);
  return {
    whatsapp,
    whatsappUrl: whatsapp ? whatsappLink(whatsapp, s.whatsapp_message?.trim() || (s.brand_name ? `Olá! Vi o site ${s.brand_name} e quero falar sobre uma tatuagem.` : null)) : null,
    email: cleanEmail(s.contact_email),
    instagram,
    instagramUrl: instagram ? `https://instagram.com/${instagram}` : null,
    tiktokUrl: socialUrl('tiktok', s.social_tiktok),
    youtubeUrl: socialUrl('youtube', s.social_youtube),
    facebookUrl: socialUrl('facebook', s.social_facebook),
    address: cleanText(s.address),
    city: cleanText(s.city),
    businessInfo: cleanText(s.business_info)
  };
}
