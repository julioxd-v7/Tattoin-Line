import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter_Tight } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { getArtist, getSettings } from '@/lib/data';
import './globals.css';

const display = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-display', display: 'swap' });
const body = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Título e descrição vêm do painel (Configurações → Identidade); nada fixo no código. */
export async function generateMetadata(): Promise<Metadata> {
  let brand = 'Tatuagem autoral';
  let description = 'Portfólio, projetos disponíveis e agendamento online.';
  let city: string | null = null;
  try {
    const [s, artist] = await Promise.all([getSettings(), getArtist()]);
    brand = s.brand_name;
    city = s.city;
    description = s.seo_description || `${s.hero_subtitle} Tatuagem por ${artist.name}${s.city ? `, em ${s.city}` : ''}.`;
  } catch {
    // banco indisponível: usa os textos genéricos acima
  }
  return {
    metadataBase: new URL(site),
    title: { default: `${brand} — tatuagem autoral${city ? ` em ${city}` : ''}`, template: `%s — ${brand}` },
    description,
    openGraph: { type: 'website', locale: 'pt_BR', siteName: brand, description },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true }
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#121110' }, { media: '(prefers-color-scheme: light)', color: '#f6f3ee' }],
  colorScheme: 'dark light',
  viewportFit: 'cover'
};

// aplica o tema escolhido antes da primeira pintura (evita piscar)
const themeInit = `try{var t=localStorage.getItem("tl-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>
        {children}
        {/* contador de visitas: só existe na Vercel; na Netlify use o Analytics do painel deles */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
