import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import type { FlashProject } from '@/lib/types';

interface Props {
  projects: { project: FlashProject; imageUrl: string | null }[];
  index: number;
  sectionCount: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "Desenhos exclusivos": galeria dos projetos autorais cadastrados no painel. */
export function ProjectsSection({ projects, index, sectionCount }: Props) {
  return (
    <section className="section section-alt projects" aria-labelledby="projects-title">
      <div className="container">
        <header className="projects-head">
          <div className="projects-intro" data-rv="up">
            <span className="index" aria-hidden="true">{pad(index)} / {pad(sectionCount)}</span>
            <p className="eyebrow">Projetos disponíveis</p>
            <h2 id="projects-title" className="h2">Desenhos exclusivos</h2>
            <p className="lead">Arte única, pronta para ser tatuada.</p>
          </div>
          {projects.length ? (
            <Link className="link-arrow" href="/projetos" data-rv="up">Ver todos os projetos <ArrowRight size={16} aria-hidden /></Link>
          ) : null}
        </header>

        {projects.length ? (
          <div className="project-grid" data-count={projects.length}>
            {projects.map(({ project, imageUrl }, i) => <ProjectCard key={project.id} project={project} imageUrl={imageUrl} index={i} />)}
          </div>
        ) : (
          <div className="projects-empty">
            <p className="small">Nenhum desenho disponível no momento.</p>
            <Link className="link-arrow" href="/agendar">Pedir um desenho personalizado <ArrowRight size={16} aria-hidden /></Link>
          </div>
        )}
        <p className="label projects-note">Cada desenho é tatuado uma única vez</p>
      </div>
    </section>
  );
}
