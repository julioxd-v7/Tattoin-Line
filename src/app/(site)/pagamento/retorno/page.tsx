import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAppointmentByToken, refreshFromProvider } from '@/lib/booking';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pagamento', robots: { index: false, follow: false } };

/**
 * Retorno do Mercado Pago. Os parâmetros da URL NÃO confirmam nada:
 * consultamos o provedor e mostramos o estado registrado no servidor.
 */
export default async function Retorno({ searchParams }: { searchParams: { reserva?: string } }) {
  const a = searchParams.reserva ? await getAppointmentByToken(searchParams.reserva) : null;
  if (!a) {
    return (
      <div className="wrap" style={{ paddingBlock: 96, maxWidth: 720 }}>
        <h1 className="h2">Não encontramos essa reserva.</h1>
        <p className="muted">Se você concluiu um pagamento, o comprovante chega por e-mail. <Link href="/agendar">Voltar ao agendamento</Link></p>
      </div>
    );
  }
  try { await refreshFromProvider(a.id); } catch (e) { console.error('retorno', (e as Error).message); }
  redirect(`/reserva/${a.public_token}`);
}
