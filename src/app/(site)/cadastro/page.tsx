import type { Metadata } from 'next';
import { SignupForm } from '@/components/SignupForm';

export const metadata: Metadata = { title: 'Cadastro', description: 'Cadastre-se para agilizar seu atendimento.', alternates: { canonical: '/cadastro' } };

export default function Cadastro() {
  return (
    <div className="wrap" style={{ paddingBlock: '56px 96px', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="eyebrow">Cadastro</p>
        <h1 className="h2">Faça seu cadastro</h1>
        <p className="lead">Só nome e telefone. Depois você completa sua ficha com calma, antes da sessão.</p>
      </div>
      <SignupForm />
    </div>
  );
}
