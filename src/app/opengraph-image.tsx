import { ImageResponse } from 'next/og';
import { getArtist, getSettings, publicImageUrl } from '@/lib/data';

// Imagem que aparece quando o link do site é compartilhado (WhatsApp, Instagram, Facebook...).
export const alt = 'Tatuagem autoral';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function OgImage() {
  let brand = 'Tatuagem autoral', artistName = '', city = '', line = 'Portfólio, projetos e agendamento online', photo: string | null = null, accent = '#a3342a';
  try {
    const [s, a] = await Promise.all([getSettings(), getArtist()]);
    brand = s.brand_name; artistName = a.name; city = s.city ?? ''; accent = s.accent_color || accent;
    line = s.specialties.length ? s.specialties.slice(0, 3).join(' · ') : line;
    // o gerador de imagem só lê JPG/PNG
    if (s.hero_image_path && /\.(jpe?g|png)$/i.test(s.hero_image_path)) photo = publicImageUrl(s.hero_image_path);
  } catch { /* usa os textos genéricos */ }
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#121110', color: '#ede8e0', fontFamily: 'serif' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72 }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, textTransform: 'uppercase', color: accent, fontFamily: 'sans-serif' }}>
            Tatuagem autoral{city ? ` · ${city}` : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 96, lineHeight: 1 }}>{brand}</div>
            {artistName ? <div style={{ fontSize: 36, color: '#bdb5a8', fontFamily: 'sans-serif' }}>por {artistName}</div> : null}
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#bdb5a8', fontFamily: 'sans-serif' }}>{line}</div>
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={420} height={630} style={{ width: 420, height: 630, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 24, height: 630, background: accent }} />
        )}
      </div>
    ),
    size
  );
}
