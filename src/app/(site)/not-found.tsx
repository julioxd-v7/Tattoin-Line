import Link from 'next/link';
import { BigSkull } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="wrap" style={{ paddingBlock: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <BigSkull stroke="currentColor" width={1.6} style={{ width: 140, color: 'var(--skull)' }} />
      <h1 className="h2">Página não encontrada.</h1>
      <p className="muted">O endereço pode ter mudado ou o trabalho foi arquivado.</p>
      <Link className="btn btn-accent" href="/">Voltar ao início</Link>
    </div>
  );
}
