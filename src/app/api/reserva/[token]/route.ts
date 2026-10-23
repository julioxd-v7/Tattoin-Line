import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { clientRequestSchema } from '@/lib/validation';
import { BookingError, cancelAppointment, getAppointmentByToken, hoursUntil } from '@/lib/booking';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist, getSettings } from '@/lib/data';
import { notify } from '@/lib/notify';
import { appointmentEvent } from '@/lib/audit';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import type { Appointment } from '@/lib/types';

export const dynamic = 'force-dynamic';

const same = (a: string, b: string) => {
  const x = crypto.createHash('sha256').update(a).digest(), y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y);
};

/** Pedido do cliente: reagendamento ou cancelamento. Exige o e-mail usado na reserva. */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  if (!await rateLimit(`cli:${clientIp(req.headers)}`, 5, 15 * 60000)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
  const appt = await getAppointmentByToken(params.token);
  if (!appt) return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
  const parsed = clientRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 422 });
  const { action, email, message } = parsed.data;
  if (!same(email, appt.customer_email)) return NextResponse.json({ error: 'O e-mail não confere com o da reserva.' }, { status: 403 });

  const [s, artist] = await Promise.all([getSettings(), getArtist()]);
  const ctx = { tz: artist.timezone, artistName: artist.name };
  const db = serviceClient();
  try {
    if (action === 'reagendar') {
      if (appt.status !== 'confirmado') return NextResponse.json({ error: 'Só é possível pedir reagendamento de uma sessão confirmada.' }, { status: 409 });
      if (hoursUntil(appt.starts_at) < s.reschedule_min_hours) return NextResponse.json({ error: `Reagendamentos precisam ser pedidos com ${s.reschedule_min_hours} horas de antecedência. Fale com o estúdio.` }, { status: 409 });
      const { data: u } = await db.from('appointments').update({ status: 'reagendamento_solicitado' }).eq('id', appt.id).eq('status', 'confirmado').select('*').single();
      await appointmentEvent(appt.id, 'pedido_reagendamento', 'cliente', { message });
      await notify('aviso_admin', { appointment: u as Appointment, ...ctx, extra: `Pedido de reagendamento: ${message || 'sem mensagem'}` });
      return NextResponse.json({ ok: true, message: 'Pedido enviado. Você recebe a nova data por e-mail. Seu horário atual continua reservado até lá.' });
    }
    if (!['aguardando_pagamento', 'confirmado', 'reagendamento_solicitado', 'solicitado'].includes(appt.status)) {
      return NextResponse.json({ error: 'Esta reserva já está encerrada.' }, { status: 409 });
    }
    const refund = appt.payment_status === 'aprovado' && hoursUntil(appt.starts_at) >= s.reschedule_min_hours;
    await cancelAppointment(appt, { refund, actor: 'cliente', reason: message });
    return NextResponse.json({ ok: true, message: refund ? 'Reserva cancelada. O reembolso foi solicitado ao Mercado Pago.' : appt.payment_status === 'aprovado' ? 'Reserva cancelada. Pela política, o sinal não é devolvido.' : 'Reserva cancelada. Nenhuma cobrança foi feita.' });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('reserva', e);
    return NextResponse.json({ error: 'Não foi possível concluir agora. Tente novamente ou fale com o estúdio.' }, { status: 500 });
  }
}
