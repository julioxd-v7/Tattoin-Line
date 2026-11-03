import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { AdminNav } from '@/components/AdminNav';
import { BrandMark } from '@/components/Icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { env } from '@/lib/env';
import { logout } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } };

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();
  return (
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="Painel">
        <Link href="/admin" className="admin-brand" aria-label="Painel — visão geral"><BrandMark /> <span>Tattoin Line</span></Link>
        <AdminNav />
        <div className="admin-nav-foot">
          <ThemeToggle />
          <span className="small admin-email">{ctx.email}</span>
          <Link href="/" target="_blank">Ver site</Link>
          <form action={logout}><button type="submit" className="btn btn-ghost btn-sm">Sair</button></form>
        </div>
      </nav>
      <div className="admin-main">
        {env.mpEnv() === 'test' ? <p className="alert" role="status"><strong>Mercado Pago em modo de teste.</strong> Nenhuma cobrança real é feita. Veja no README como ativar a produção.</p> : null}
        {children}
      </div>
    </div>
  );
}
