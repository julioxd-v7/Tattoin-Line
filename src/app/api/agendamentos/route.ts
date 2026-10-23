import { NextResponse } from 'next/server';
import { bookingSchema } from '@/lib/validation';
import { BookingError, createBooking } from '@/lib/booking';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!await rateLimit(`book:${ip}`, 5, 10 * 60000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' }, { status: 429 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 }); }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? 'Dados inválidos.', field: first?.path.join('.') }, { status: 422 });
  }
  if (parsed.data.website) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  try {
    const r = await createBooking(parsed.data);
    return NextResponse.json(r, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    console.error('agendamentos', e);
    return NextResponse.json({ error: 'Não foi possível concluir agora. Tente novamente em instantes.' }, { status: 500 });
  }
}
