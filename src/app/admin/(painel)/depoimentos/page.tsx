import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { ActionForm, Submit } from '@/components/ActionForm';
import { deleteTestimonial, saveTestimonial } from '@/app/admin/testimonials-actions';
import type { Testimonial } from '@/lib/types';

function Fields({ t }: { t?: Testimonial }) {
  return (
    <>
      {t ? <input type="hidden" name="id" value={t.id} /> : null}
      <div className="form-grid">
        <label className="field"><span>Nome do cliente <small>— pode ser só o primeiro nome</small></span><input className="input" name="author_name" defaultValue={t?.author_name} required maxLength={80} /></label>
        <label className="field"><span>Nota</span>
          <select className="select" name="rating" defaultValue={t?.rating ?? ''}>
            <option value="">Sem nota</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
          </select>
        </label>
        <label className="field"><span>Onde foi dito <small>— opcional</small></span><input className="input" name="source" defaultValue={t?.source ?? ''} placeholder="Google, Instagram, WhatsApp…" maxLength={80} /></label>
        <label className="field"><span>Ordem</span><input className="input" name="sort" type="number" defaultValue={t?.sort ?? 0} /></label>
      </div>
      <label className="field"><span>Depoimento <small>— copie as palavras do cliente, sem alterar o sentido</small></span><textarea className="textarea" name="body" defaultValue={t?.body} required minLength={10} maxLength={600} /></label>
      <label className="check"><input type="checkbox" name="consent" defaultChecked={Boolean(t)} required /> <span>O cliente autorizou a publicação deste depoimento no site.</span></label>
      <label className="check"><input type="checkbox" name="published" defaultChecked={t?.published ?? true} /> <span>Mostrar no site</span></label>
    </>
  );
}

export default async function Depoimentos() {
  const ctx = await requireAdmin();
  const { data } = await serviceClient().from('testimonials').select('*').eq('artist_id', ctx.artistId).order('sort').order('created_at', { ascending: false });
  const list = (data ?? []) as Testimonial[];
  return (
    <>
      <h1 className="h2">Depoimentos</h1>
      <p className="muted" style={{ margin: 0 }}>Use apenas avaliações reais, com autorização do cliente. Eles aparecem na página inicial quando houver pelo menos um publicado.</p>
      <ActionForm action={saveTestimonial} className="panel" style={{ padding: 18 }}>
        <strong>Novo depoimento</strong>
        <Fields />
        <Submit>Adicionar</Submit>
      </ActionForm>
      {list.map((t) => (
        <div key={t.id} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ActionForm action={saveTestimonial}>
            <Fields t={t} />
            <Submit className="btn btn-ghost btn-sm">Salvar</Submit>
          </ActionForm>
          <form action={deleteTestimonial}><input type="hidden" name="id" value={t.id} /><button type="submit" className="btn btn-ghost btn-sm">Excluir depoimento</button></form>
        </div>
      ))}
    </>
  );
}
