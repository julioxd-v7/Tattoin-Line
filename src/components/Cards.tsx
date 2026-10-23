import Link from 'next/link';
import Image from 'next/image';
import { formatBRLShort, formatDuration } from '@/lib/money';
import { FLASH_LABEL, type FlashProject, type PortfolioItem } from '@/lib/types';

const DIRS = ['left', 'up', 'up', 'right'];

export function WorkCard({ work, index, imageUrl }: { work: PortfolioItem; index: number; imageUrl: string | null }) {
  const img = work.images[0];
  return (
    <Link href={`/tatuagens/${work.slug}`} className="work" data-rv={DIRS[index % 4]} style={{ ['--d' as string]: `${(index % 4) * 90}ms` }}>
      <div className="ph">
        {imageUrl && img ? <Image src={imageUrl} alt={img.alt} fill sizes="(max-width: 600px) 100vw, 300px" style={{ objectFit: 'cover' }} /> : null}
        <span className="num">{work.style?.name ?? 'Autoral'}</span>
        {work.images.length > 1 ? <span className="count">{work.images.length} fotos</span> : null}
      </div>
      <div className="meta"><span className="title">{work.title}</span><span className="style">{work.body_region ?? ''}</span></div>
    </Link>
  );
}

export function FlashCard({ project, index, imageUrl }: { project: FlashProject; index: number; imageUrl: string | null }) {
  const badge = project.status === 'disponivel' ? 'badge-ok' : project.status === 'reservado' ? 'badge-warn' : 'badge-off';
  return (
    <article className="flash" data-rv="up" style={{ ['--d' as string]: `${(index % 4) * 90}ms` }}>
      <div className="ph">
        {imageUrl ? <Image src={imageUrl} alt={project.image_alt ?? `Desenho: ${project.name}`} fill sizes="(max-width: 600px) 100vw, 280px" style={{ objectFit: 'contain', padding: 12 }} /> : null}
        <span className={`badge ${badge}`}>{FLASH_LABEL[project.status]}</span>
      </div>
      <div className="row"><h3>{project.name}</h3><span className="price">{formatBRLShort(project.price_cents)}</span></div>
      <p>{project.size_label} · ≈ {formatDuration(project.duration_minutes)}{project.style ? ` · ${project.style.name}` : ''}</p>
      {project.status === 'disponivel' ? (
        <>
          <Link className="btn btn-ink" href={`/agendar?projeto=${project.slug}`}>Reservar este projeto</Link>
          {project.simulation_image_path && project.simulation_enabled !== false ? (
            <Link className="sim-link" href={`/simulador?projeto=${project.slug}`}>Ver no meu corpo</Link>
          ) : null}
        </>
      ) : (
        <span className="reserved">{project.status === 'reservado' ? 'Reservado' : 'Já tatuado'}</span>
      )}
    </article>
  );
}
