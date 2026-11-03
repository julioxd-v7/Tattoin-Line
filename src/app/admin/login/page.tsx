import type { Metadata } from 'next';
import Link from 'next/link';
import { ActionForm, Submit } from '@/components/ActionForm';
import { BrandMark } from '@/components/Icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { login } from '../actions';

export const metadata: Metadata = { title: 'Entrar no painel', robots: { index: false, follow: false } };

export default function Login({ searchParams }: { searchParams: { erro?: string } }) {
  return (
    <div className="wrap" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><BrandMark /><h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: 0, flex: 1 }}>Painel do artista</h1><ThemeToggle /></div>
        {searchParams.erro === 'sem-acesso' ? <p className="alert alert-bad">Esta conta não tem acesso ao painel. Peça ao responsável para vincular seu usuário.</p> : null}
        <ActionForm action={login}>
          <label className="field"><span>E-mail</span><input className="input" name="email" type="email" autoComplete="username" required /></label>
          <label className="field"><span>Senha</span><input className="input" name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
          <Submit>Entrar</Submit>
        </ActionForm>
        <Link href="/admin/recuperar" className="small tap">Esqueci minha senha</Link>
      </div>
    </div>
  );
}
