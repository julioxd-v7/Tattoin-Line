import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { publicImageUrl } from '@/lib/data';

export default async function Portfolio() {
  const ctx = await requireAdmin();
  const { data } = await serviceClient().from('portfolio_items').select('id, title, status, featured, client_consent, year, style:tattoo_styles(name), images:portfolio_images(storage_path, sort)').eq('artist_id', ctx.artistId).order('sort').order('created_at', { ascending: false });
  type Row = { id: string; title: string; status: string; featured: boolean; client_consent: boolean; year: number | null; style: { name: string } | null; images: { storage_path: string; sort: number }[] };
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="h2">Portfólio</h1>
        <Link className="btn btn-accent btn-sm" href="/admin/portfolio/novo">Nova tatuagem</Link>
      </div>
      <section className="panel">
        {rows.length ? rows.map((w) => {
          const cover = w.images.sort((a, b) => a.sort - b.sort)[0];
          return (
            <Link key={w.id} href={`/admin/portfolio/${w.id}`} className="list-row" style={{ textDecoration: 'none', alignItems: 'center' }}>
              <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ width: 56, height: 56, borderRadius: 6, background: cover ? `center/cover url(${publicImageUrl(cover.storage_path)})` : 'var(--line)', flex: 'none' }} aria-hidden />
                <span><strong>{w.title}</strong><br /><span className="small">{w.style?.name ?? 'Sem estilo'} · {w.year ?? 's/ ano'} · {w.images.length} foto(s){w.featured ? ' · destaque' : ''}</span></span>
              </span>
              <span className={`tag ${w.status === 'publicado' ? 'tag-ok' : w.status === 'rascunho' ? 'tag-warn' : 'tag-off'}`}>{w.status}</span>
            </Link>
          );
        }) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Nenhum trabalho cadastrado.</p></div>}
      </section>
    </>
  );
}
