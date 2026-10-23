import Link from 'next/link';
import { ImageInput } from '@/components/ImageInput';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getStyles, publicImageUrl, simulationImageUrl } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { saveFlash } from '@/app/admin/actions';
import type { FlashProject } from '@/lib/types';

export default async function EditFlash({ params, searchParams }: { params: { id: string }; searchParams: { salvo?: string } }) {
  const ctx = await requireAdmin();
  const isNew = params.id === 'novo';
  let f: FlashProject | null = null;
  if (!isNew) {
    const { data } = await serviceClient().from('flash_projects').select('*').eq('id', params.id).eq('artist_id', ctx.artistId).maybeSingle();
    if (!data) notFound();
    f = data as FlashProject;
  }
  const styles = await getStyles();
  return (
    <>
      <p className="small" style={{ margin: 0 }}><Link href="/admin/projetos">Projetos</Link> / {isNew ? 'Novo' : f!.name}</p>
      <h1 className="h2">{isNew ? 'Novo projeto autoral' : 'Editar projeto'}</h1>
      {searchParams.salvo ? <p className="alert alert-ok">Projeto salvo.</p> : null}
      {f?.status === 'reservado' ? <p className="alert">Este projeto está reservado. Ele só volta a ficar disponível quando o agendamento for cancelado ou expirar — ou se você liberá-lo aqui depois disso.</p> : null}
      <ActionForm action={saveFlash} className="panel" style={{ padding: 20 }}>
        {f ? <input type="hidden" name="id" value={f.id} /> : null}
        <div className="form-grid">
          <label className="field"><span>Nome do desenho</span><input className="input" name="name" required defaultValue={f?.name} /></label>
          <label className="field"><span>Endereço (slug)</span><input className="input" name="slug" defaultValue={f?.slug} placeholder="gerado a partir do nome" /></label>
          <label className="field"><span>Estilo</span><select className="select" name="style_id" defaultValue={f?.style_id ?? ''}><option value="">Sem estilo</option>{styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="field"><span>Preço (R$)</span><input className="input" name="price" inputMode="decimal" required defaultValue={f ? (f.price_cents / 100).toFixed(2).replace('.', ',') : ''} /></label>
          <label className="field"><span>Duração estimada (min)</span><input className="input" name="duration_minutes" type="number" min={15} step={15} required defaultValue={f?.duration_minutes ?? 120} /></label>
          <label className="field"><span>Dimensões aproximadas</span><input className="input" name="size_label" defaultValue={f?.size_label} placeholder="12 × 9 cm" /></label>
          <label className="field"><span>Região sugerida (opcional)</span><input className="input" name="body_region" defaultValue={f?.body_region ?? ''} /></label>
          <label className="field"><span>Status</span><select className="select" name="status" defaultValue={f?.status ?? 'disponivel'}><option value="disponivel">Disponível</option><option value="reservado">Reservado</option><option value="vendido">Vendido / já tatuado</option><option value="arquivado">Arquivado</option></select></label>
          <label className="field"><span>Ordem</span><input className="input" name="sort" type="number" defaultValue={f?.sort ?? 0} /></label>
        </div>
        <label className="field"><span>Descrição</span><textarea className="textarea" name="description" defaultValue={f?.description} maxLength={2000} /></label>
        <div className="form-grid">
          <ImageInput name="image" label="Imagem do desenho" />
          <label className="field"><span>Texto alternativo</span><input className="input" name="image_alt" defaultValue={f?.image_alt ?? ''} /></label>
        </div>
        {f?.image_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicImageUrl(f.image_path)!} alt={f.image_alt ?? f.name} style={{ width: 180, borderRadius: 8, background: '#f3eee6' }} />
        ) : null}
        <fieldset className="sim-admin">
          <legend>Simulador</legend>
          <p className="small" style={{ margin: 0 }}>Envie o desenho em <strong>PNG ou WebP com fundo transparente</strong> (só o traço, sem papel ou sombra). É ele que o cliente posiciona sobre a própria foto. Sem essa imagem, o projeto não aparece no simulador.</p>
          <div className="form-grid">
            <ImageInput name="sim_image" accept="image/png,image/webp" label="Imagem para o simulador" />
            <label className="check" style={{ alignSelf: 'end' }}><input type="checkbox" name="simulation_enabled" defaultChecked={f?.simulation_enabled ?? true} /> <span>Mostrar no simulador</span></label>
          </div>
          {f?.simulation_image_path ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="sim-admin-preview" src={simulationImageUrl(f.simulation_image_path)!} alt="Prévia da imagem do simulador" />
              <label className="check"><input type="checkbox" name="sim_remove" /> <span>Remover imagem do simulador</span></label>
            </div>
          ) : null}
        </fieldset>
        <p className="small" style={{ margin: 0 }}>O preço exibido é o mesmo usado na cobrança. Não é possível mudar o preço enquanto houver agendamento ativo.</p>
        <Submit>Salvar projeto</Submit>
      </ActionForm>
    </>
  );
}
