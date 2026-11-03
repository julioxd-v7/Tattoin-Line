import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatBRLShort } from '@/lib/money';
import { FLASH_LABEL, type FlashProject } from '@/lib/types';

const BADGE: Record<string, string> = { disponivel: 'badge-ok', reservado: 'badge-warn', vendido: 'badge-off', arquivado: 'badge-off' };

/**
 * Cartão de projeto autoral (flash): imagem enviada pelo artista, nome, estilo, dimensões,
 * preço, disponibilidade e "Ver detalhes" (página /projetos/[slug]).
 */
export function ProjectCard({ project, imageUrl, index = 0 }: { project: FlashProject; imageUrl: string | null; index?: number }) {
  const href = `/projetos/${project.slug}`;
  const meta = [project.style?.name, project.size_label].filter(Boolean).join(' · ');
  return (
    <article className="project-card" data-status={project.status} data-rv="up" style={{ ['--d' as string]: `${(index % 4) * 90}ms` }}>
      {/* a imagem também leva aos detalhes, mas fica fora da ordem do teclado (o link principal é "Ver detalhes") */}
      <Link href={href} className="project-media" tabIndex={-1} aria-hidden="true">
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="(max-width: 700px) 80vw, (max-width: 1100px) 45vw, 22vw" /> : null}
      </Link>
      <span className={`badge ${BADGE[project.status] ?? 'badge-off'} project-status`}>{FLASH_LABEL[project.status]}</span>
      <div className="project-body">
        <div className="project-row">
          <h3 className="project-name">{project.name}</h3>
          <span className="project-price">{formatBRLShort(project.price_cents)}</span>
        </div>
        {meta ? <p className="project-meta">{meta}</p> : null}
        <Link href={href} className="link-arrow is-neutral project-link" aria-label={`Ver detalhes de ${project.name}`}>
          Ver detalhes <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
