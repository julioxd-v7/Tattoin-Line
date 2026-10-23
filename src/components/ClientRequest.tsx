'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ClientRequest({ token, canReschedule, canCancel, cancelNote }: { token: string; canReschedule: boolean; canCancel: boolean; cancelNote: string }) {
  const router = useRouter();
  const [action, setAction] = useState<'reagendar' | 'cancelar' | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!action) return;
    setBusy(true); setResult(null);
    try {
      const r = await fetch(`/api/reserva/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, email, message }) });
      const j = await r.json();
      setResult({ ok: r.ok, text: r.ok ? j.message : j.error });
      if (r.ok) { setAction(null); router.refresh(); }
    } catch { setResult({ ok: false, text: 'Falha de conexão. Tente novamente.' }); }
    finally { setBusy(false); }
  }

  if (!canReschedule && !canCancel) return result ? <p className={`alert ${result.ok ? 'alert-ok' : 'alert-bad'}`} role="status">{result.text}</p> : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {result ? <p className={`alert ${result.ok ? 'alert-ok' : 'alert-bad'}`} role="status">{result.text}</p> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {canReschedule ? <button type="button" className="btn btn-ghost" aria-pressed={action === 'reagendar'} onClick={() => setAction('reagendar')}>Solicitar reagendamento</button> : null}
        {canCancel ? <button type="button" className="btn btn-ghost" style={{ borderColor: 'var(--a-bad-line)', color: 'var(--accent-ink)' }} aria-pressed={action === 'cancelar'} onClick={() => setAction('cancelar')}>Cancelar reserva</button> : null}
      </div>
      {action ? (
        <form onSubmit={send} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <strong>{action === 'reagendar' ? 'Pedir nova data' : 'Confirmar cancelamento'}</strong>
          {action === 'cancelar' ? <p className="muted" style={{ margin: 0 }}>{cancelNote}</p> : null}
          <label className="field"><span>Confirme o e-mail usado na reserva</span><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label className="field"><span>{action === 'reagendar' ? 'Quais dias e horários funcionam para você?' : 'Motivo (opcional)'}</span><textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required={action === 'reagendar'} /></label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-accent" disabled={busy}>{busy ? 'Enviando…' : action === 'reagendar' ? 'Enviar pedido' : 'Cancelar reserva'}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAction(null)}>Voltar</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
