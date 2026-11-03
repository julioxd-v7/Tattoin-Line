import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { MediaPlaceholder } from '@/components/MediaPlaceholder';
import { ProjectCard } from '@/components/ProjectCard';
import { getFlashProjects, getSettings, publicImageUrl } from '@/lib/data';
import { depositFor } from '@/lib/pricing';
import { formatBRL, formatBRLShort, formatDuration } from '@/lib/money';
import { FLASH_LABEL } from '@/lib/types';

export const revalidate = 120;

async function find(slug: string) {
  const list = await getFlashProjects({ includeSold: true });
  return { project: list.find((f) => f.slug === slug) ?? null, list };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { project } = await find(params.slug);
  if (!project) return { title: 'Projeto não encontrado' };
  const img = publicImageUrl(project.image_path);
  return {
    title: project.name,
    description: project.description || `${project.name} — desenho autoral${project.style ? ` em ${project.style.name}` : ''}, ${project.size_label}.`,
    alternates: { canonical: `/projetos/${project.slug}` },
    openGraph: { title: project.name, images: img ? [{ url: img, alt: project.image_alt ?? project.name }] : undefined }
  };
}

const BADGE: Record<string, string> = { disponivel: 'badge-ok', reservado: 'badge-warn', vendido: 'badge-off', arquivado: 'badge-off' };

/** Detalhes de um projeto autoral (flash): tudo vem do cadastro em Painel → Projetos. */
export default async function Projeto({ params }: { params: { slug: string } }) {
  const [{ project: p, list }, s] = await Promise.all([find(params.slug), getSettings()]);
  if (!p) notFound();
  const img = publicImageUrl(p.image_path);
  const available = p.status === 'disponivel';
  const canSimulate = available && Boolean(p.simulation_image_path) && p.simulation_enabled !== false;
  const others = list.filter((f) => f.id !== p.id && f.status === 'disponivel').slice(0, 4);
  return (
    <div className="container project-page">
      <nav aria-label="Trilha" className="label project-crumbs"><Link href="/projetos">Projetos</Link><span aria-hidden="true">/</span><span>{p.name}</span></nav>

      <div className="project-detail">
        <div className="project-detail-media">
          {img ? <Image src={img} alt={p.image_alt ?? `Desenho: ${p.name}`} fill priority sizes="(max-width: 900px) 100vw, 55vw" /> : <MediaPlaceholder label="Desenho do projeto" ratio="1:1" />}
        </div>

        <div className="project-detail-info">
          <span className={`badge ${BADGE[p.status] ?? 'badge-off'}`}>{FLASH_LABEL[p.status]}</span>
          <h1 className="h1">{p.name}</h1>
          {p.description ? <p className="lead">{p.description}</p> : null}
          <dl className="project-specs">
            <div><dt>Estilo</dt><dd>{p.style?.name ?? '—'}</dd></div>
            <div><dt>Dimensões</dt><dd>{p.size_label}</dd></div>
            {p.body_region ? <div><dt>Região sugerida</dt><dd>{p.body_region}</dd></div> : null}
            <div><dt>Duração estimada</dt><dd>≈ {formatDuration(p.duration_minutes)}</dd></div>
            <div><dt>Valor</dt><dd className="project-specs-price">{formatBRLShort(p.price_cents)}</dd></div>
            {available ? <div><dt>Sinal para reservar</dt><dd>{formatBRL(depositFor(p.price_cents, s))}{s.allow_full_payment ? ' ou valor integral' : ''}</dd></div> : null}
          </dl>
          {available ? (
            <div className="project-actions">
              <Link className="btn btn-primary" href={`/agendar?projeto=${p.slug}`}>Reservar este projeto <ArrowRight size={16} aria-hidden /></Link>
              {canSimulate ? <Link className="btn btn-secondary" href={`/simulador?projeto=${p.slug}`}>Ver no meu corpo</Link> : null}
            </div>
          ) : (
            <p className="notice">{p.status === 'reservado' ? 'Este desenho está reservado para outra pessoa no momento.' : 'Este desenho já foi tatuado e não será repetido.'}</p>
          )}
          <p className="small">Desenho tatuado uma única vez. {available ? 'Pequenos ajustes de escala são combinados na sessão, sem alterar o desenho.' : <Link href="/agendar">Pedir um desenho personalizado</Link>}</p>
        </div>
      </div>

      {others.length ? (
        <section className="project-others" aria-labelledby="outros">
          <div className="projects-head"><h2 id="outros" className="h3">Outros desenhos disponíveis</h2><Link className="link-arrow" href="/projetos">Ver todos <ArrowRight size={16} aria-hidden /></Link></div>
          <div className="project-grid">{others.map((f, i) => <ProjectCard key={f.id} project={f} imageUrl={publicImageUrl(f.image_path)} index={i} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
