import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { formatBRL, formatDuration } from '@/lib/money';
import { FLASH_LABEL, type FlashProject } from '@/lib/types';

export default async function Projetos() {
  const ctx = await requireAdmin();
  const { data } = await serviceClient().from('flash_projects').select('*').eq('artist_id', ctx.artistId).order('sort');
  const rows = (data ?? []) as FlashProject[];
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="h2">Projetos autorais</h1>
        <Link className="btn btn-accent btn-sm" href="/admin/projetos/novo">Novo projeto</Link>
      </div>
      <section className="panel">
        {rows.length ? rows.map((f) => (
          <Link key={f.id} href={`/admin/projetos/${f.id}`} className="list-row" style={{ textDecoration: 'none' }}>
            <span><strong>{f.name}</strong><br /><span className="small">{formatBRL(f.price_cents)} · {f.size_label} · {formatDuration(f.duration_minutes)}</span></span>
            <span className={`tag ${f.status === 'disponivel' ? 'tag-ok' : f.status === 'reservado' ? 'tag-warn' : 'tag-off'}`}>{FLASH_LABEL[f.status]}</span>
          </Link>
        )) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Nenhum projeto cadastrado.</p></div>}
      </section>
    </>
  );
}
