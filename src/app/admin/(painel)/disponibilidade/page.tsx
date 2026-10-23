import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { formatDateTime } from '@/lib/tz';
import { ActionForm, Submit } from '@/components/ActionForm';
import { addBlock, deleteBlock, saveRules } from '@/app/admin/actions';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default async function Disponibilidade() {
  const ctx = await requireAdmin();
  const artist = await getArtist();
  const db = serviceClient();
  const [{ data: rules }, { data: blocks }] = await Promise.all([
    db.from('availability_rules').select('*').eq('artist_id', ctx.artistId),
    db.from('blocked_slots').select('*').eq('artist_id', ctx.artistId).gte('ends_at', new Date().toISOString()).order('starts_at')
  ]);
  return (
    <>
      <h1 className="h2">Horários e bloqueios</h1>
      <p className="muted" style={{ margin: 0 }}>Fuso horário: {artist.timezone}. O intervalo entre sessões e a duração de cada serviço ficam em Preços e configurações.</p>
      <ActionForm action={saveRules} className="panel" style={{ padding: 18 }}>
        <strong>Atendimento semanal</strong>
        {DAYS.map((d, i) => {
          const r = rules?.find((x) => x.weekday === i);
          return (
            <div key={d} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <label className="check" style={{ width: 130 }}><input type="checkbox" name={`on_${i}`} defaultChecked={!!r} /> <span>{d}</span></label>
              <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><span className="small">das</span><input className="input" style={{ width: 130 }} type="time" name={`start_${i}`} defaultValue={r?.start_time?.slice(0, 5) ?? '10:00'} /></label>
              <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><span className="small">às</span><input className="input" style={{ width: 130 }} type="time" name={`end_${i}`} defaultValue={r?.end_time?.slice(0, 5) ?? '19:00'} /></label>
            </div>
          );
        })}
        <Submit>Salvar horários</Submit>
      </ActionForm>
      <ActionForm action={addBlock} className="panel" style={{ padding: 18 }}>
        <strong>Bloquear período (folga, feriado, evento)</strong>
        <div className="form-grid">
          <label className="field"><span>De</span><input className="input" type="date" name="date" required /></label>
          <label className="field"><span>Até (opcional)</span><input className="input" type="date" name="end_date" /></label>
          <label className="field"><span>Hora inicial</span><input className="input" type="time" name="start" /></label>
          <label className="field"><span>Hora final</span><input className="input" type="time" name="end" /></label>
        </div>
        <label className="check"><input type="checkbox" name="all_day" defaultChecked /> <span>Dia inteiro</span></label>
        <label className="field"><span>Motivo</span><input className="input" name="reason" placeholder="Feriado, convenção…" /></label>
        <Submit>Adicionar bloqueio</Submit>
      </ActionForm>
      <section className="panel" aria-labelledby="bl">
        <h2 id="bl">Bloqueios futuros</h2>
        {blocks?.length ? blocks.map((b) => (
          <form key={b.id} action={deleteBlock} className="list-row">
            <span>{formatDateTime(b.starts_at, artist.timezone, { dateStyle: 'medium', timeStyle: 'short' })} → {formatDateTime(b.ends_at, artist.timezone, { dateStyle: 'medium', timeStyle: 'short' })}<br /><span className="small">{b.reason || 'Sem motivo'}</span></span>
            <input type="hidden" name="id" value={b.id} />
            <button type="submit" className="btn btn-ghost btn-sm">Remover</button>
          </form>
        )) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Nenhum bloqueio futuro.</p></div>}
      </section>
    </>
  );
}
