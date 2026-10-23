'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function SignupForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accept, setAccept] = useState(false);
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: string; text: string } | null>(null);
  const [done, setDone] = useState<{ token?: string; message?: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accept) return setError({ field: 'acceptPrivacy', text: 'É preciso aceitar a política de privacidade.' });
    setBusy(true);
    try {
      const r = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, acceptPrivacy: accept, website: hp }) });
      const j = await r.json();
      if (!r.ok) setError({ field: j.field, text: j.error ?? 'Não foi possível concluir.' });
      else setDone(j.status === 'criado' ? { token: j.token } : { message: j.message });
    } catch { setError({ text: 'Falha de conexão. Tente novamente.' }); }
    finally { setBusy(false); }
  }

  if (done) {
    return done.token ? (
      <div className="step-panel">
        <span className="status" style={{ color: 'var(--t-ok)', alignSelf: 'flex-start' }}>Cadastro feito</span>
        <h2 className="h3">Agora complete sua ficha.</h2>
        <p className="muted" style={{ margin: 0 }}>Leva 2 minutos: e-mail, data de nascimento e, se quiser, informações de saúde que ajudam a preparar a sessão. Guarde o link da ficha para voltar depois.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link className="btn btn-accent" href={`/ficha/${done.token}`}>Preencher minha ficha</Link>
          <Link className="btn btn-ghost" href="/agendar">Agendar uma sessão</Link>
        </div>
      </div>
    ) : (
      <div className="step-panel"><p className="alert" role="status">{done.message}</p><Link className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} href="/agendar">Agendar uma sessão</Link></div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && !error.field ? <p className="alert alert-bad" role="alert">{error.text}</p> : null}
      <label className="field"><span>Nome completo</span>
        <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={error?.field === 'name'} required />
        {error?.field === 'name' ? <p className="err" role="alert">{error.text}</p> : null}
      </label>
      <label className="field"><span>Telefone (WhatsApp)</span>
        <input className="input" type="tel" autoComplete="tel" placeholder="(81) 9 0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={error?.field === 'phone'} required />
        {error?.field === 'phone' ? <p className="err" role="alert">{error.text}</p> : null}
      </label>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="visually-hidden" value={hp} onChange={(e) => setHp(e.target.value)} />
      <label className="check"><input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} /><span>Concordo com a <a href="/politicas#privacidade" target="_blank">política de privacidade</a>. Meus dados são usados só para atendimento.</span></label>
      {error?.field === 'acceptPrivacy' ? <p className="err" role="alert">{error.text}</p> : null}
      <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start' }} disabled={busy}>{busy ? <><Loader2 size={16} className="animate-spin" aria-hidden /> Enviando…</> : 'Criar cadastro'}</button>
    </form>
  );
}
