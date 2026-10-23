import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { env } from '@/lib/env';
import { ageFrom, formatPhone, type Client } from '@/lib/clients';
import { formatDateTime } from '@/lib/tz';
import { formatBRL } from '@/lib/money';
import { ActionForm, Submit } from '@/components/ActionForm';
import { AppointmentTag, PaymentTag } from '@/components/StatusTag';
import { deleteClient, resetFichaLink, saveClient } from '@/app/admin/clientes-actions';
import type { Appointment } from '@/lib/types';

export default async function ClienteDetalhe({ params, searchParams }: { params: { id: string }; searchParams: { salvo?: string } }) {
  const ctx = await requireAdmin();
  const isNew = params.id === 'novo';
  let c: Client | null = null;
  let appts: Appointment[] = [];
  if (!isNew) {
    if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();
    const db = serviceClient();
    const { data } = await db.from('clients').select('*').eq('id', params.id).eq('artist_id', ctx.artistId).maybeSingle();
    if (!data) notFound();
    c = data as Client;
    const { data: a } = await db.from('appointments').select('*').eq('client_id', c.id).order('created_at', { ascending: false });
    appts = (a ?? []) as Appointment[];
  }
  const artist = await getArtist();
  const age = ageFrom(c?.birth_date ?? null);
  const fichaUrl = c ? `${env.siteUrl()}/ficha/${c.ficha_token}` : '';
  const waText = c ? encodeURIComponent(`Olá, ${c.full_name.split(' ')[0]}! Para agilizar sua sessão, complete sua ficha: ${fichaUrl}`) : '';
  return (
    <>
      <p className="small" style={{ margin: 0 }}><Link href="/admin/clientes">Clientes</Link> / {isNew ? 'Novo' : c!.full_name}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <h1 className="h2">{isNew ? 'Novo cliente' : c!.full_name}</h1>
        {c ? <span className={`tag ${c.ficha_completed_at ? 'tag-ok' : 'tag-warn'}`}>{c.ficha_completed_at ? 'Ficha completa' : 'Ficha incompleta'}</span> : null}
        {age != null && age < 18 ? <span className="tag tag-bad">Menor de 18 anos</span> : null}
      </div>
      {searchParams.salvo ? <p className="alert alert-ok">Cliente salvo.</p> : null}
      {c?.deletion_requested_at ? <p className="alert alert-bad">Este cliente pediu a exclusão dos dados em {formatDateTime(c.deletion_requested_at, artist.timezone, { dateStyle: 'short' })}. Conclua no fim desta página.</p> : null}

      {c ? (
        <section className="panel" aria-labelledby="link">
          <h2 id="link">Link da ficha</h2>
          <div className="panel-body">
            <p className="small" style={{ margin: 0 }}>Envie para o cliente completar ou atualizar os dados. Não compartilhe em público.</p>
            <input className="input" readOnly value={fichaUrl} aria-label="Link da ficha" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a className="btn btn-accent btn-sm" href={`https://wa.me/${c.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer">Enviar pelo WhatsApp</a>
              <ActionForm action={resetFichaLink} style={{ gap: 8 }}><input type="hidden" name="id" value={c.id} /><Submit className="btn btn-ghost btn-sm">Gerar novo link</Submit></ActionForm>
            </div>
          </div>
        </section>
      ) : null}

      <ActionForm action={saveClient} style={{ gap: 24 }}>
        {c ? <input type="hidden" name="id" value={c.id} /> : null}
        <section className="panel"><h2>Contato</h2><div className="panel-body"><div className="form-grid">
          <label className="field"><span>Nome completo</span><input className="input" name="full_name" required defaultValue={c?.full_name} /></label>
          <label className="field"><span>Telefone (WhatsApp)</span><input className="input" name="phone" type="tel" required defaultValue={c ? formatPhone(c.phone) : ''} /></label>
          <label className="field"><span>E-mail</span><input className="input" name="email" type="email" defaultValue={c?.email ?? ''} /></label>
          <label className="field"><span>Nascimento{age != null ? <small> — {age} anos</small> : null}</span><input className="input" name="birth_date" type="date" defaultValue={c?.birth_date ?? ''} /></label>
          <label className="field"><span>Instagram</span><input className="input" name="instagram" defaultValue={c?.instagram ?? ''} /></label>
        </div></div></section>
        <section className="panel"><h2>Saúde</h2><div className="panel-body">
          <div className="form-grid">
            <label className="field"><span>Alergias</span><textarea className="textarea" style={{ minHeight: 70 }} name="allergies" defaultValue={c?.allergies ?? ''} /></label>
            <label className="field"><span>Medicamentos</span><textarea className="textarea" style={{ minHeight: 70 }} name="medications" defaultValue={c?.medications ?? ''} /></label>
            <label className="field"><span>Condições</span><textarea className="textarea" style={{ minHeight: 70 }} name="conditions" defaultValue={c?.conditions ?? ''} /></label>
            <label className="field"><span>Observações</span><textarea className="textarea" style={{ minHeight: 70 }} name="health_notes" defaultValue={c?.health_notes ?? ''} /></label>
          </div>
          <label className="check"><input type="checkbox" name="health_consent" defaultChecked={Boolean(c?.health_consent_at)} /> <span>O cliente autorizou guardar os dados de saúde{c?.health_consent_at ? ` (em ${formatDateTime(c.health_consent_at, artist.timezone, { dateStyle: 'short' })})` : ''}.</span></label>
        </div></section>
        <section className="panel"><h2>Notas internas <span className="small" style={{ fontWeight: 400 }}>— o cliente não vê</span></h2><div className="panel-body">
          <textarea className="textarea" name="internal_notes" defaultValue={c?.internal_notes ?? ''} placeholder="Preferências, como foi a sessão, cicatrização…" style={{ minHeight: 140 }} />
        </div></section>
        <Submit>{isNew ? 'Cadastrar cliente' : 'Salvar ficha'}</Submit>
      </ActionForm>

      {c ? (
        <section className="panel" aria-labelledby="hist">
          <h2 id="hist">Agendamentos</h2>
          {appts.length ? appts.map((a) => (
            <Link key={a.id} href={`/admin/agenda/${a.id}`} className="list-row" style={{ textDecoration: 'none' }}>
              <span><strong>{String(a.terms_snapshot?.quote_label ?? a.service)}</strong><br /><span className="small">{a.starts_at ? formatDateTime(a.starts_at, artist.timezone, { dateStyle: 'medium', timeStyle: 'short' }) : 'Sem data'} · {formatBRL(a.total_cents)}</span></span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><AppointmentTag s={a.status} /><PaymentTag s={a.payment_status} /></span>
            </Link>
          )) : <div className="panel-body"><p className="muted" style={{ margin: 0 }}>Nenhum agendamento ainda.</p></div>}
        </section>
      ) : null}

      {c ? (
        <ActionForm action={deleteClient} className="panel" style={{ padding: 18 }}>
          <input type="hidden" name="id" value={c.id} />
          <strong>Excluir ficha</strong>
          <p className="small" style={{ margin: 0 }}>Apaga contato, saúde e notas. Os agendamentos e pagamentos continuam no histórico, sem vínculo com a ficha. Não pode ser desfeito.</p>
          <label className="field" style={{ maxWidth: 280 }}><span>Digite EXCLUIR para confirmar</span><input className="input" name="confirm" autoComplete="off" /></label>
          <Submit className="btn btn-ghost btn-sm">Excluir ficha</Submit>
        </ActionForm>
      ) : null}
    </>
  );
}
