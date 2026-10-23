import type { Metadata } from 'next';
import { ActionForm, Submit } from '@/components/ActionForm';
import { updatePassword } from '../auth-actions';

export const metadata: Metadata = { title: 'Nova senha', robots: { index: false, follow: false } };

export default function NovaSenha() {
  return (
    <div className="wrap" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, margin: 0 }}>Criar nova senha</h1>
        <ActionForm action={updatePassword}>
          <label className="field"><span>Nova senha <small>— mínimo de 10 caracteres</small></span><input className="input" name="password" type="password" autoComplete="new-password" required minLength={10} /></label>
          <label className="field"><span>Repita a nova senha</span><input className="input" name="confirm" type="password" autoComplete="new-password" required minLength={10} /></label>
          <Submit>Salvar nova senha</Submit>
        </ActionForm>
      </div>
    </div>
  );
}
