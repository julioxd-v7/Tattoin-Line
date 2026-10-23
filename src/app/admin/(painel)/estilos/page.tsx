import { requireAdmin } from '@/lib/admin';
import { getStyles } from '@/lib/data';
import { ActionForm, Submit } from '@/components/ActionForm';
import { deleteStyle, saveStyle } from '@/app/admin/actions';

export default async function Estilos() {
  await requireAdmin();
  const styles = await getStyles();
  return (
    <>
      <h1 className="h2">Estilos</h1>
      <p className="muted" style={{ margin: 0 }}>Cadastre apenas os estilos que você realmente trabalha. Eles aparecem no site, nos filtros e no agendamento.</p>
      {styles.map((s) => (
        <div key={s.id} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ActionForm action={saveStyle}>
            <input type="hidden" name="id" value={s.id} />
            <div className="form-grid">
              <label className="field"><span>Nome</span><input className="input" name="name" defaultValue={s.name} required /></label>
              <label className="field"><span>Endereço</span><input className="input" name="slug" defaultValue={s.slug} /></label>
              <label className="field"><span>Ordem</span><input className="input" name="sort" type="number" defaultValue={s.sort} /></label>
            </div>
            <label className="field"><span>Descrição curta</span><input className="input" name="description" defaultValue={s.description} maxLength={400} /></label>
            <Submit className="btn btn-ghost btn-sm">Salvar</Submit>
          </ActionForm>
          <form action={deleteStyle}><input type="hidden" name="id" value={s.id} /><button type="submit" className="btn btn-ghost btn-sm">Excluir estilo</button></form>
        </div>
      ))}
      <ActionForm action={saveStyle} className="panel" style={{ padding: 18 }}>
        <strong>Novo estilo</strong>
        <div className="form-grid">
          <label className="field"><span>Nome</span><input className="input" name="name" required /></label>
          <label className="field"><span>Ordem</span><input className="input" name="sort" type="number" defaultValue={styles.length + 1} /></label>
        </div>
        <label className="field"><span>Descrição curta</span><input className="input" name="description" maxLength={400} /></label>
        <Submit>Adicionar estilo</Submit>
      </ActionForm>
    </>
  );
}
