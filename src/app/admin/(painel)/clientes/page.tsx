import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { formatPhone, type Client } from '@/lib/clients';

const SOURCE: Record<string, string> = { site: 'Cadastro no site', agendamento: 'Agendamento', painel: 'Painel' };

export default async function Clientes({ searchParams }: { searchParams: { q?: string; filtro?: string; excluido?: string } }) {
  const ctx = await requireAdmin();
  const q = (searchParams.q ?? '').trim().slice(0, 80);
  let query = serviceClient().from('clients').select('id, full_name, phone, email, source, ficha_completed_at, deletion_requested_at, created_at').eq('artist_id', ctx.artistId).order('created_at', { ascending: false }).limit(200);
  if (q) {
    const safe = q.replace(/[%,()]/g, ' ');
    const digits = q.replace(/\D/g, '');
    query = query.or([`full_name.ilike.%${safe}%`, `email.ilike.%${safe}%`, digits.length >= 3 ? `phone.ilike.%${digits}%` : null].filter(Boolean).join(','));
  }
  if (searchParams.filtro === 'sem-ficha') query = query.is('ficha_completed_at', null);
  if (searchParams.filtro === 'exclusao') query = query.not('deletion_requested_at', 'is', null);
  const { data } = await query;
  const rows = (data ?? []) as Pick<Client, 'id' | 'full_name' | 'phone' | 'email' | 'source' | 'ficha_completed_at' | 'deletion_requested_at' | 'created_at'>[];
  const f = searchParams.filtro ?? '';
  const tab = (v: string, label: string) => <Link className="filter" aria-pressed={f === v} href={`/admin/clientes?filtro=${v}${q ? `&q=${encodeURIComponent(q)}` : ''}`} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{label}</Link>;
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="h2">Clientes</h1>
        <Link className="btn btn-accent btn-sm" href="/admin/clientes/novo">Novo cliente</Link>
      </div>
      {searchParams.excluido ? <p className="alert alert-ok" role="status">Ficha excluída.</p> : null}
      <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {f ? <input type="hidden" name="filtro" value={f} /> : null}
        <label className="field" style={{ flex: '1 1 260px' }}><span className="visually-hidden">Buscar</span><input className="input" type="search" name="q" defaultValue={q} placeholder="Buscar por nome, telefone ou e-mail" /></label>
        <button type="submit" className="btn btn-ghost">Buscar</button>
      </form>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tab('', 'Todos')}{tab('sem-ficha', 'Ficha incompleta')}{tab('exclusao', 'Pediram exclusão')}</div>
      <section className="panel">
        {rows.length ? rows.map((c) => (
          <Link key={c.id} href={`/admin/clientes/${c.id}`} className="list-row" style={{ textDecoration: 'none' }}>
            <span><strong>{c.full_name}</strong><br /><span className="small">{formatPhone(c.phone)}{c.email ? ` · ${c.email}` : ''} · {SOURCE[c.source]}</span></span>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {c.deletion_requested_at ? <span className="tag tag-bad">Pediu exclusão</span> : null}
              <span className={`tag ${c.ficha_completed_at ? 'tag-ok' : 'tag-warn'}`}>{c.ficha_completed_at ? 'Ficha completa' : 'Ficha incompleta'}</span>
            </span>
          </Link>
        )) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>{q || f ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda. Eles aparecem aqui quando se cadastram ou agendam.'}</p></div>}
      </section>
    </>
  );
}
