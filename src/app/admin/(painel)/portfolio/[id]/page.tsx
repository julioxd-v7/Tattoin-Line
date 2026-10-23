import Link from 'next/link';
import { ImageInput } from '@/components/ImageInput';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getStyles, publicImageUrl } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { deleteImage, deleteWork, saveWork } from '@/app/admin/actions';
import type { PortfolioItem } from '@/lib/types';

export default async function EditWork({ params, searchParams }: { params: { id: string }; searchParams: { salvo?: string; semfoto?: string } }) {
  const ctx = await requireAdmin();
  const isNew = params.id === 'novo';
  let w: PortfolioItem | null = null;
  if (!isNew) {
    const { data } = await serviceClient().from('portfolio_items').select('*, images:portfolio_images(id, storage_path, alt, sort)').eq('id', params.id).eq('artist_id', ctx.artistId).maybeSingle();
    if (!data) notFound();
    w = data as PortfolioItem;
    w.images.sort((a, b) => a.sort - b.sort);
  }
  const styles = await getStyles();
  return (
    <>
      <p className="small" style={{ margin: 0 }}><Link href="/admin/portfolio">Portfólio</Link> / {isNew ? 'Nova tatuagem' : w!.title}</p>
      <h1 className="h2">{isNew ? 'Nova tatuagem' : 'Editar tatuagem'}</h1>
      {searchParams.salvo ? <p className="alert alert-ok">Trabalho salvo.</p> : null}
      {searchParams.semfoto ? <p className="alert">Salvo como rascunho: envie pelo menos uma foto para publicar no site.</p> : null}
      <ActionForm action={saveWork} className="panel" style={{ padding: 20 }}>
        {w ? <input type="hidden" name="id" value={w.id} /> : null}
        <div className="form-grid">
          <label className="field"><span>Título</span><input className="input" name="title" required defaultValue={w?.title} /></label>
          <label className="field"><span>Endereço (slug)</span><input className="input" name="slug" defaultValue={w?.slug} placeholder="gerado a partir do título" /></label>
          <label className="field"><span>Estilo</span><select className="select" name="style_id" defaultValue={w?.style_id ?? ''}><option value="">Sem estilo</option>{styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="field"><span>Região do corpo (se autorizada)</span><input className="input" name="body_region" defaultValue={w?.body_region ?? ''} /></label>
          <label className="field"><span>Ano</span><input className="input" name="year" type="number" min={1990} max={2100} defaultValue={w?.year ?? ''} /></label>
          <label className="field"><span>Ordem de exibição</span><input className="input" name="sort" type="number" defaultValue={w?.sort ?? 0} /></label>
        </div>
        <label className="field"><span>Descrição (opcional)</span><textarea className="textarea" name="description" defaultValue={w?.description} maxLength={2000} /></label>
        <div className="form-grid">
          <label className="field"><span>Status</span><select className="select" name="status" defaultValue={w?.status ?? 'rascunho'}><option value="rascunho">Rascunho</option><option value="publicado">Publicado</option><option value="arquivado">Arquivado</option></select></label>
          <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="featured" defaultChecked={w?.featured} /> <span>Destacar na página inicial</span></label>
        </div>
        <label className="check"><input type="checkbox" name="client_consent" defaultChecked={w?.client_consent} /> <span>O cliente autorizou a publicação destas imagens (obrigatório para publicar). Não publique rosto ou dados que identifiquem a pessoa sem autorização.</span></label>
        <div className="form-grid">
          <ImageInput name="images" multiple label={<>Adicionar fotos <small>— JPG, PNG, WebP ou AVIF. Fotos grandes são reduzidas automaticamente</small></>} />
          <label className="field"><span>Texto alternativo das novas fotos</span><input className="input" name="alt" placeholder="ex.: caveira com rosa em blackwork no antebraço" /></label>
        </div>
        <Submit>Salvar</Submit>
      </ActionForm>
      {w?.images.length ? (
        <section className="panel" aria-labelledby="fotos">
          <h2 id="fotos">Fotos</h2>
          <div className="panel-body" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {w.images.map((im) => (
              <form key={im.id} action={deleteImage} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 140 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicImageUrl(im.storage_path)!} alt={im.alt} style={{ width: 140, height: 175, objectFit: 'cover', borderRadius: 6 }} />
                <input type="hidden" name="image_id" value={im.id} />
                <button type="submit" className="btn btn-ghost btn-sm">Remover</button>
              </form>
            ))}
          </div>
        </section>
      ) : null}
      {w ? (
        <form action={deleteWork}>
          <input type="hidden" name="id" value={w.id} />
          <button type="submit" className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--a-bad-line)', color: 'var(--accent-ink)' }}>Excluir trabalho e fotos</button>
        </form>
      ) : null}
    </>
  );
}
