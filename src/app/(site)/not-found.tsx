import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap" style={{ paddingBlock: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <h1 className="h2">Página não encontrada.</h1>
      <p className="muted">O endereço pode ter mudado ou o trabalho foi arquivado.</p>
      <Link className="btn btn-accent" href="/">Voltar ao início</Link>
    </div>
  );
}
