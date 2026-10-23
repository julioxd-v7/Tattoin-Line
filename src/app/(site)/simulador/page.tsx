import type { Metadata } from 'next';
import { Simulator, type SimProject } from '@/components/simulator/Simulator';
import { getSettings, getSimulatorProjects, simulationImageUrl } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Simulador de tatuagem',
  description: 'Veja como um projeto fica na sua pele antes de agendar. Sua foto fica só no seu aparelho.',
  alternates: { canonical: '/simulador' }
};

export default async function SimuladorPage({ searchParams }: { searchParams: { projeto?: string } }) {
  const [settings, list] = await Promise.all([getSettings(), getSimulatorProjects()]);
  const projects: SimProject[] = list.map((f) => ({
    slug: f.slug, name: f.name, style: f.style?.name ?? null, priceCents: f.price_cents, sizeLabel: f.size_label,
    simUrl: simulationImageUrl(f.simulation_image_path)!, alt: f.image_alt ?? `Desenho: ${f.name}`
  }));
  const slug = typeof searchParams.projeto === 'string' ? searchParams.projeto.slice(0, 80) : undefined;
  return (
    <div className="wrap" style={{ paddingBlock: '48px 96px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
        <p className="eyebrow">Experimente antes de tatuar</p><h1 className="display" style={{ fontSize: 'clamp(44px,6vw,76px)' }}>Simulador</h1>
        <p className="lead" style={{ margin: 0 }}>Escolha um projeto, tire ou envie uma foto da região e posicione o desenho. A foto não sai do seu aparelho.</p>
      </header>
      <Simulator projects={projects} initialSlug={slug} brand={settings.brand_name} />
    </div>
  );
}
