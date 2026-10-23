'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

export interface FichaValues { name: string; email: string; birthDate: string; instagram: string; allergies: string; medications: string; conditions: string; healthNotes: string; healthConsent: boolean }

export function FichaForm({ token, initial }: { token: string; initial: FichaValues }) {
  const router = useRouter();
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<FichaValues>({ defaultValues: initial });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [delState, setDelState] = useState<'idle' | 'confirm' | 'done'>('idle');
  const health = watch(['allergies', 'medications', 'conditions', 'healthNotes']).some((x) => (x ?? '').trim());

  const onSubmit = handleSubmit(async (v) => {
    setMsg(null);
    const r = await fetch(`/api/ficha/${token}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) }).catch(() => null);
    if (!r) return setMsg({ ok: false, text: 'Falha de conexão. Tente novamente.' });
    const j = await r.json();
    if (!r.ok) {
      if (j.field) setError(j.field as keyof FichaValues, { message: j.error });
      return setMsg({ ok: false, text: j.error ?? 'Não foi possível salvar.' });
    }
    setMsg({ ok: true, text: j.message });
    router.refresh();
  });

  async function requestDeletion() {
    const r = await fetch(`/api/ficha/${token}`, { method: 'POST' }).catch(() => null);
    if (r?.ok) setDelState('done');
  }

  const err = (k: keyof FichaValues) => errors[k]?.message ? <p className="err" role="alert">{errors[k]?.message}</p> : null;
  return (
    <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {msg ? <p className={`alert ${msg.ok ? 'alert-ok' : 'alert-bad'}`} role="status">{msg.text}</p> : null}
      <section className="panel"><h2>Contato</h2><div className="panel-body">
        <div className="form-grid">
          <label className="field"><span>Nome completo</span><input className="input" autoComplete="name" {...register('name')} />{err('name')}</label>
          <label className="field"><span>E-mail</span><input className="input" type="email" autoComplete="email" {...register('email')} />{err('email')}</label>
          <label className="field"><span>Data de nascimento</span><input className="input" type="date" {...register('birthDate')} />{err('birthDate')}</label>
          <label className="field"><span>Instagram <small>— opcional</small></span><input className="input" placeholder="@seuperfil" {...register('instagram')} /></label>
        </div>
        <p className="small" style={{ margin: 0 }}>É preciso ter 18 anos ou mais para tatuar, com documento com foto no dia.</p>
      </div></section>
      <section className="panel"><h2>Saúde <span className="small" style={{ fontWeight: 400 }}>— opcional</span></h2><div className="panel-body">
        <p className="small" style={{ margin: 0 }}>Essas informações ajudam a preparar a sessão com segurança. Só o artista vê. Deixe em branco o que não quiser informar.</p>
        <label className="field"><span>Alergias</span><textarea className="textarea" style={{ minHeight: 70 }} placeholder="ex.: látex, anestésicos, pigmentos" {...register('allergies')} /></label>
        <label className="field"><span>Medicamentos em uso</span><textarea className="textarea" style={{ minHeight: 70 }} placeholder="ex.: anticoagulantes, isotretinoína" {...register('medications')} /></label>
        <label className="field"><span>Condições de saúde</span><textarea className="textarea" style={{ minHeight: 70 }} placeholder="ex.: diabetes, problemas de cicatrização ou de pele, gravidez" {...register('conditions')} /></label>
        <label className="field"><span>Outras observações</span><textarea className="textarea" style={{ minHeight: 70 }} {...register('healthNotes')} /></label>
        {health ? (
          <label className="check"><input type="checkbox" {...register('healthConsent')} /><span>Autorizo o armazenamento destes dados de saúde para o meu atendimento (LGPD). Posso pedir a exclusão a qualquer momento.</span></label>
        ) : null}
        {err('healthConsent')}
      </div></section>
      <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start' }} disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Salvando…</> : 'Salvar ficha'}</button>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {delState === 'done' ? <p className="alert" role="status">Pedido de exclusão recebido. Seus dados serão apagados, mantendo só os registros financeiros exigidos por lei.</p>
          : delState === 'confirm' ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="muted">Tem certeza? Isso pede a exclusão da sua ficha.</span>
              <button type="button" className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--a-bad-line)', color: 'var(--accent-ink)' }} onClick={requestDeletion}>Sim, excluir meus dados</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDelState('idle')}>Cancelar</button>
            </div>
          ) : <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setDelState('confirm')}>Pedir exclusão dos meus dados</button>}
      </div>
    </form>
  );
}
