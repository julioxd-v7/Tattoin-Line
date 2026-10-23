import 'server-only';
import { serviceClient } from './supabase/admin';
import { getArtist, getSettings } from './data';
import { computeSlots, type Range } from './availability';
import { addDaysYmd, ymdOf, zonedToUtc } from './tz';
import { ACTIVE_APPOINTMENT_STATUSES } from './types';

export async function slotsForDay(ymd: string, durationMinutes: number) {
  const [artist, s] = await Promise.all([getArtist(), getSettings()]);
  const db = serviceClient();
  const dayStart = zonedToUtc(ymd, '00:00', artist.timezone);
  const dayEnd = zonedToUtc(addDaysYmd(ymd, 1), '00:00', artist.timezone);
  const [rules, blocked, appts] = await Promise.all([
    db.from('availability_rules').select('weekday, start_time, end_time').eq('artist_id', artist.id),
    db.from('blocked_slots').select('starts_at, ends_at').eq('artist_id', artist.id).lt('starts_at', dayEnd.toISOString()).gt('ends_at', dayStart.toISOString()),
    db.from('appointments').select('starts_at, ends_at, buffer_minutes').eq('artist_id', artist.id).in('status', ACTIVE_APPOINTMENT_STATUSES)
      .lt('starts_at', dayEnd.toISOString()).gt('ends_at', new Date(dayStart.getTime() - 6 * 3600000).toISOString())
  ]);
  const busy: Range[] = ((appts.data ?? []) as { starts_at: string; ends_at: string; buffer_minutes: number }[]).map((a) => ({ start: new Date(a.starts_at), end: new Date(new Date(a.ends_at).getTime() + a.buffer_minutes * 60000) }));
  const block: Range[] = ((blocked.data ?? []) as { starts_at: string; ends_at: string }[]).map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));
  const now = new Date();
  const maxYmd = addDaysYmd(ymdOf(now, artist.timezone), s.booking_window_days);
  if (ymd > maxYmd) return { tz: artist.timezone, slots: [] };
  return { tz: artist.timezone, slots: computeSlots({ ymd, tz: artist.timezone, rules: rules.data ?? [], durationMinutes, bufferMinutes: s.buffer_minutes, busy, blocked: block, now }) };
}

/** Dias do mês com pelo menos um horário livre (para o calendário). */
export async function openDays(month: string, durationMinutes: number): Promise<{ tz: string; days: Record<string, boolean> }> {
  const [y, m] = month.split('-').map(Number);
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: Record<string, boolean> = {};
  let tz = 'America/Recife';
  const results = await Promise.all(Array.from({ length: daysIn }, (_, i) => {
    const ymd = `${month}-${String(i + 1).padStart(2, '0')}`;
    return slotsForDay(ymd, durationMinutes).then((r) => ({ ymd, r }));
  }));
  for (const { ymd, r } of results) { tz = r.tz; out[ymd] = r.slots.some((x) => x.available); }
  return { tz, days: out };
}
