import { NextResponse } from 'next/server';
import { z } from 'zod';
import { openDays, slotsForDay } from '@/lib/availability-server';
import { getFlashProjects, getSettings } from '@/lib/data';
import { quote } from '@/lib/pricing';
import { reconcileStaleHolds } from '@/lib/booking';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const q = z.object({
  service: z.enum(['personalizada', 'projeto', 'consulta']),
  sizeId: z.string().max(10).optional(),
  projeto: z.string().max(80).optional(),
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional()
});

export async function GET(req: Request) {
  if (!await rateLimit(`disp:${clientIp(req.headers)}`, 60, 60000)) return NextResponse.json({ error: 'Muitas consultas. Aguarde um minuto.' }, { status: 429 });
  const parsed = q.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
  const p = parsed.data;
  try {
    // a duração vem do servidor, nunca do navegador
    const s = await getSettings();
    const flash = p.service === 'projeto' ? (await getFlashProjects()).find((f) => f.slug === p.projeto && f.status === 'disponivel') : null;
    if (p.service === 'projeto' && !flash) return NextResponse.json({ error: 'Projeto indisponível.' }, { status: 409 });
    const qt = quote(s, { service: p.service, sizeId: p.sizeId, flash });
    if (qt.needsEvaluation || !qt.durationMinutes) return NextResponse.json({ needsEvaluation: true });
    await reconcileStaleHolds().catch(() => undefined);
    if (p.dia) {
      const r = await slotsForDay(p.dia, qt.durationMinutes);
      return NextResponse.json({ tz: r.tz, duration: qt.durationMinutes, slots: r.slots }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (p.mes) {
      const r = await openDays(p.mes, qt.durationMinutes);
      return NextResponse.json({ tz: r.tz, duration: qt.durationMinutes, days: r.days }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Informe dia ou mês.' }, { status: 400 });
  } catch (e) {
    console.error('disponibilidade', (e as Error).message);
    return NextResponse.json({ error: 'Não foi possível carregar a agenda agora.' }, { status: 500 });
  }
}
