import type { MetadataRoute } from 'next';
import { getPublishedWorks } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const pages = ['', '/tatuagens', '/projetos', '/estilos', '/precos', '/simulador', '/agendar', '/cadastro', '/politicas'].map((p) => ({ url: site + p, changeFrequency: 'weekly' as const, priority: p ? 0.7 : 1 }));
  let works: MetadataRoute.Sitemap = [];
  try { works = (await getPublishedWorks()).map((w) => ({ url: `${site}/tatuagens/${w.slug}`, changeFrequency: 'monthly' as const, priority: 0.5 })); } catch { /* banco indisponível */ }
  return [...pages, ...works];
}
