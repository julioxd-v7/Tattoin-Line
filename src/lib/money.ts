export function formatBRL(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatBRLShort(cents: number): string {
  const v = cents / 100;
  return Number.isInteger(v) ? 'R$ ' + v.toLocaleString('pt-BR') : formatBRL(cents);
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return 'a definir';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
