import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, Submit } from '@/components/ActionForm';
import { requestPasswordReset } from '../auth-actions';

export const metadata: Metadata = { title: 'Recuperar senha', robots: { index: false, follow: false } };

export default function Recuperar({ searchParams }: { searchParams: { erro?: string } }) {
  return (
    <div className="wrap" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, margin: 0 }}>Esqueci minha senha</h1>
        <p className="muted" style={{ margin: 0 }}>Informe o e-mail do painel. Enviaremos um link para criar uma nova senha.</p>
        {searchParams.erro ? <p className="alert alert-bad">O link expirou ou já foi usado. Peça um novo abaixo.</p> : null}
        <ActionForm action={requestPasswordReset}>
          <label className="field"><span>E-mail</span><input className="input" name="email" type="email" autoComplete="username" required /></label>
          <Submit>Enviar link</Submit>
        </ActionForm>
        <Link href="/admin/login" className="small">Voltar para o login</Link>
      </div>
    </div>
  );
}
