import type { HeroLayout, Settings } from './types';

/** Limites do enquadramento da foto do topo (iguais aos da migration 0007). */
export const HERO_LIMITS = {
  overlay: { min: 0, max: 85, default: 30 },
  focus: { min: 0, max: 100, default: 50 },
  zoom: { min: 100, max: 200, default: 100 },
  titleMax: 120,
  titleLines: 3,
  eyebrowMax: 60,
  subtitleMax: 400
} as const;

export interface HeroDisplay {
  layout: HeroLayout;
  /** 0–0.85 */
  overlay: number;
  /** 0–100 (%) */
  focusX: number;
  focusY: number;
  /** 1–2 */
  zoom: number;
}

const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};

/** Valores de exibição da foto com padrões seguros (antes da migration, ou com dado inválido). */
export function heroDisplay(s: Partial<Pick<Settings, 'hero_layout' | 'hero_overlay' | 'hero_focus_x' | 'hero_focus_y' | 'hero_zoom'>>): HeroDisplay {
  const L = HERO_LIMITS;
  return {
    layout: s.hero_layout === 'fundo' ? 'fundo' : 'lateral',
    overlay: clampInt(s.hero_overlay, L.overlay.min, L.overlay.max, L.overlay.default) / 100,
    focusX: clampInt(s.hero_focus_x, L.focus.min, L.focus.max, L.focus.default),
    focusY: clampInt(s.hero_focus_y, L.focus.min, L.focus.max, L.focus.default),
    zoom: clampInt(s.hero_zoom, L.zoom.min, L.zoom.max, L.zoom.default) / 100
  };
}

/**
 * Linhas do título principal.
 * Quebras feitas no painel (Enter) são respeitadas; sem quebra, separa as frases
 * ("Arte na pele. Com propósito." → duas linhas). No máximo 3 linhas.
 */
export function heroTitleLines(title: string): string[] {
  const clean = title.replace(/\r\n?/g, '\n').trim();
  if (!clean) return [];
  let lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) lines = clean.split(/(?<=[.!?])\s+(?=\S)/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > HERO_LIMITS.titleLines) {
    lines = [...lines.slice(0, HERO_LIMITS.titleLines - 1), lines.slice(HERO_LIMITS.titleLines - 1).join(' ')];
  }
  return lines;
}

/** Normaliza o título digitado no painel: quebras de linha simples, sem linhas vazias. */
export function normalizeHeroTitle(title: string): string {
  return title.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, HERO_LIMITS.titleLines).join('\n');
}
