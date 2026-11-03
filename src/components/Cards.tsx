import Link from 'next/link';
import Image from 'next/image';
import type { PortfolioItem } from '@/lib/types';

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
