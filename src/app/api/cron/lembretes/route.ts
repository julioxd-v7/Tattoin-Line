import { NextResponse } from 'next/server';
import { authorizedCron } from '@/lib/cron';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { notify } from '@/lib/notify';
import type { Appointment } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Envia lembrete para sessões confirmadas que começam nas próximas 36 horas. */
export async function GET(req: Request) {
  if (!authorizedCron(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  const artist = await getArtist();
  const now = Date.now();
  const { data } = await serviceClient().from('appointments').select('*').eq('status', 'confirmado').is('reminder_sent_at', null)
    .gt('starts_at', new Date(now).toISOString()).lt('starts_at', new Date(now + 36 * 3600000).toISOString());
  let sent = 0;
  for (const a of (data ?? []) as Appointment[]) {
    const { data: claimed } = await serviceClient().from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', a.id).is('reminder_sent_at', null).select('id').maybeSingle();
    if (!claimed) continue;
    await notify('lembrete', { appointment: a, tz: artist.timezone, artistName: artist.name });
    sent++;
  }
  return NextResponse.json({ sent });
}
