import { ImageResponse } from 'next/og';
import { getArtist, getSettings, publicImageUrl } from '@/lib/data';
import { cleanText } from '@/lib/contact';

// Imagem que aparece quando o link do site é compartilhado (WhatsApp, Instagram, Facebook...).
export const alt = 'Tatuagem autoral';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// gerada na hora: os dados do Supabase nunca vêm do cache (src/lib/supabase/fetch.ts)
export const dynamic = 'force-dynamic';

const LEGACY_DEFAULT_ACCENT = '#a3342a';

export default async function OgImage() {
  let brand = 'Tatuagem autoral', artistName = '', city = '', line = 'Portfólio, projetos e agendamento online', photo: string | null = null, accent = '#c5ff4a';
  try {
    const [s, a] = await Promise.all([getSettings(), getArtist()]);
    brand = s.brand_name; artistName = a.name; city = cleanText(s.city) ?? '';
    if (s.accent_color && /^#[0-9a-f]{6}$/i.test(s.accent_color) && s.accent_color.toLowerCase() !== LEGACY_DEFAULT_ACCENT) accent = s.accent_color;
    line = s.specialties.length ? s.specialties.slice(0, 3).join(' · ') : line;
    // o gerador de imagem só lê JPG/PNG
    if (s.hero_image_path && /\.(jpe?g|png)$/i.test(s.hero_image_path)) photo = publicImageUrl(s.hero_image_path);
  } catch { /* usa os textos genéricos */ }
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#0b0b0b', color: '#f0f0f0', fontFamily: 'sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, borderRight: '1px solid #303030' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 22, letterSpacing: 6, textTransform: 'uppercase', color: '#999999' }}>
            Tatuagem autoral{city ? ` · ${city}` : ''}
            <div style={{ display: 'flex', width: 48, height: 1, background: '#999999' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', fontSize: 92, lineHeight: 1, fontWeight: 300, letterSpacing: -1, textTransform: 'uppercase' }}>{brand}</div>
            {artistName ? <div style={{ display: 'flex', fontSize: 34, color: '#999999' }}>por {artistName}</div> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 24, letterSpacing: 3, textTransform: 'uppercase', color: '#999999' }}>
            <div style={{ display: 'flex', width: 56, height: 2, background: accent }} />{line}
          </div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={420} height={630} style={{ width: 420, height: 630, objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', width: 8, height: 630, background: '#0b0b0b' }} />
        )}
      </div>
    ),
    size
  );
}
