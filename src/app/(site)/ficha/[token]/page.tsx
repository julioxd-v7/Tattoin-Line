import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getClientByToken } from '@/lib/clients';
import { FichaForm } from '@/components/FichaForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Minha ficha', robots: { index: false, follow: false } };

export default async function Ficha({ params }: { params: { token: string } }) {
  const c = await getClientByToken(params.token);
  if (!c) notFound();
  return (
    <div className="wrap" style={{ paddingBlock: '56px 96px', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p className="small" style={{ margin: 0 }}>Link pessoal — não compartilhe.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="eyebrow">Minha ficha</p>
        <h1 className="h2">Olá, {c.full_name.split(' ')[0]}.</h1>
        <p className="lead">{c.ficha_completed_at ? 'Confira e atualize seus dados quando quiser.' : 'Complete seus dados antes da sessão.'}</p>
      </div>
      {c.deletion_requested_at ? <p className="alert" role="status">Você pediu a exclusão dos seus dados. O estúdio vai concluir o pedido em breve.</p> : null}
      <FichaForm token={c.ficha_token} initial={{
        name: c.full_name, email: c.email ?? '', birthDate: c.birth_date ?? '', instagram: c.instagram ?? '',
        allergies: c.allergies ?? '', medications: c.medications ?? '', conditions: c.conditions ?? '', healthNotes: c.health_notes ?? '',
        healthConsent: Boolean(c.health_consent_at)
      }} />
    </div>
  );
}
