/** Cálculo de horários livres — função pura (testada em tests/availability.test.ts). */
import { weekdayOfYmd, zonedToUtc } from './tz';

export interface Rule { weekday: number; start_time: string; end_time: string }
export interface Range { start: Date; end: Date }

export interface SlotInput {
  ymd: string;
  tz: string;
  rules: Rule[];
  durationMinutes: number;
  bufferMinutes: number;
  busy: Range[];      // agendamentos ativos, já incluindo o intervalo após cada um
  blocked: Range[];   // folgas, feriados e bloqueios manuais
  now: Date;
  minLeadMinutes?: number;
  stepMinutes?: number;
}

export interface Slot { startsAt: string; endsAt: string; label: string; available: boolean }

const overlaps = (a: Range, b: Range) => a.start < b.end && b.start < a.end;
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toHm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function computeSlots(i: SlotInput): Slot[] {
  const step = i.stepMinutes ?? 30;
  const lead = i.minLeadMinutes ?? 120;
  const wd = weekdayOfYmd(i.ymd);
  const out: Slot[] = [];
  for (const r of i.rules.filter((x) => x.weekday === wd)) {
    const open = toMin(r.start_time), close = toMin(r.end_time);
    for (let m = open; m + i.durationMinutes <= close; m += step) {
      const start = zonedToUtc(i.ymd, toHm(m), i.tz);
      const end = new Date(start.getTime() + i.durationMinutes * 60000);
      const withBuffer: Range = { start, end: new Date(end.getTime() + i.bufferMinutes * 60000) };
      const available =
        start.getTime() >= i.now.getTime() + lead * 60000 &&
        !i.busy.some((b) => overlaps(withBuffer, b)) &&
        !i.blocked.some((b) => overlaps({ start, end }, b));
      out.push({ startsAt: start.toISOString(), endsAt: end.toISOString(), label: toHm(m), available });
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function hasOpenRule(ymd: string, rules: Rule[]): boolean {
  return rules.some((r) => r.weekday === weekdayOfYmd(ymd));
}
