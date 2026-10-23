import { describe, expect, it } from 'vitest';
import { computeSlots } from '../src/lib/availability';
import { zonedToUtc, hmOf } from '../src/lib/tz';

const tz = 'America/Recife';
const rules = [{ weekday: 2, start_time: '10:00:00', end_time: '20:00:00' }];
const ymd = '2026-11-10'; // terça-feira
const now = new Date('2026-11-01T12:00:00Z');

describe('fuso horário', () => {
  it('Recife é UTC-3', () => expect(zonedToUtc(ymd, '14:00', tz).toISOString()).toBe('2026-11-10T17:00:00.000Z'));
  it('ida e volta', () => expect(hmOf(zonedToUtc(ymd, '09:30', tz), tz)).toBe('09:30'));
});

describe('horários', () => {
  it('só gera horários que cabem até o fechamento', () => {
    const s = computeSlots({ ymd, tz, rules, durationMinutes: 180, bufferMinutes: 30, busy: [], blocked: [], now });
    expect(s[0].label).toBe('10:00');
    expect(s[s.length - 1].label).toBe('17:00');
  });
  it('dia sem regra não tem horários', () => {
    expect(computeSlots({ ymd: '2026-11-09', tz, rules, durationMinutes: 60, bufferMinutes: 30, busy: [], blocked: [], now })).toHaveLength(0);
  });
  it('respeita sessão existente + intervalo', () => {
    const busyStart = zonedToUtc(ymd, '14:00', tz);
    const busy = [{ start: busyStart, end: new Date(busyStart.getTime() + 150 * 60000) }]; // 14:00–16:00 + 30 min
    const s = computeSlots({ ymd, tz, rules, durationMinutes: 60, bufferMinutes: 30, busy, blocked: [], now });
    const free = s.filter((x) => x.available).map((x) => x.label);
    expect(free).toContain('12:30');      // 12:30–13:30 + 30 → termina 14:00
    expect(free).not.toContain('13:00');  // 13:00–14:00 + 30 invade
    expect(free).not.toContain('16:00');
    expect(free).toContain('16:30');
  });
  it('bloqueios e antecedência mínima', () => {
    const blocked = [{ start: zonedToUtc(ymd, '10:00', tz), end: zonedToUtc(ymd, '12:00', tz) }];
    const s = computeSlots({ ymd, tz, rules, durationMinutes: 60, bufferMinutes: 0, busy: [], blocked, now });
    expect(s.find((x) => x.label === '11:00')!.available).toBe(false);
    expect(s.find((x) => x.label === '12:00')!.available).toBe(true);
    const late = computeSlots({ ymd, tz, rules, durationMinutes: 60, bufferMinutes: 0, busy: [], blocked: [], now: zonedToUtc(ymd, '13:00', tz) });
    expect(late.find((x) => x.label === '14:00')!.available).toBe(false);
    expect(late.find((x) => x.label === '15:00')!.available).toBe(true);
  });
});
