/**
 * Regras puras do simulador (sem DOM): coordenadas normalizadas, histórico,
 * validação de arquivos. Testadas em tests/simulator.test.ts.
 *
 * Todas as posições são relativas à FOTO, não à tela:
 *   x, y     → centro do desenho, de 0 a 1 (fração da largura/altura da foto)
 *   scale    → largura do desenho como fração da largura da foto
 *   rotation → graus
 *   opacity  → 0.1 a 1 (só visual; não representa a pigmentação real)
 */

export interface Transform { x: number; y: number; scale: number; rotation: number; opacity: number }

export const LIMITS = { minScale: 0.04, maxScale: 1.6, minOpacity: 0.1, maxOpacity: 1 } as const;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function normalizeRotation(deg: number): number {
  let r = deg % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360;
  return Math.round(r * 10) / 10;
}

export function sanitize(t: Transform): Transform {
  return {
    x: clamp(Number.isFinite(t.x) ? t.x : 0.5, 0, 1),
    y: clamp(Number.isFinite(t.y) ? t.y : 0.5, 0, 1),
    scale: clamp(Number.isFinite(t.scale) ? t.scale : 0.3, LIMITS.minScale, LIMITS.maxScale),
    rotation: normalizeRotation(Number.isFinite(t.rotation) ? t.rotation : 0),
    opacity: clamp(Number.isFinite(t.opacity) ? t.opacity : 0.9, LIMITS.minOpacity, LIMITS.maxOpacity)
  };
}

/**
 * Posição inicial: centralizado, ocupando ~35% da menor dimensão da foto,
 * respeitando a proporção do desenho.
 */
export function initialTransform(photo: { w: number; h: number }, art: { w: number; h: number }): Transform {
  const artAspect = art.h / art.w;
  const target = 0.35 * Math.min(photo.w, photo.h);
  // largura em px para que o maior lado do desenho tenha ~target
  const widthPx = artAspect > 1 ? target / artAspect : target;
  return sanitize({ x: 0.5, y: 0.5, scale: widthPx / photo.w, rotation: 0, opacity: 0.92 });
}

/** Converte o estado normalizado para pixels do palco atual (que tem a mesma proporção da foto). */
export function toStage(t: Transform, stage: { w: number; h: number }, artAspect: number) {
  const width = t.scale * stage.w;
  return { x: t.x * stage.w, y: t.y * stage.h, width, height: width * artAspect, rotation: t.rotation, opacity: t.opacity };
}

/** Converte atributos do nó (centro em px, largura em px) de volta para o estado normalizado. */
export function fromStage(n: { x: number; y: number; width: number; rotation: number }, stage: { w: number; h: number }, opacity: number): Transform {
  return sanitize({ x: n.x / stage.w, y: n.y / stage.h, scale: n.width / stage.w, rotation: n.rotation, opacity });
}

/** Tamanho do palco: encaixa a foto (contain) no espaço disponível, sem cortar nem deformar. */
export function fitContain(photo: { w: number; h: number }, box: { w: number; h: number }) {
  const s = Math.min(box.w / photo.w, box.h / photo.h);
  return { w: Math.max(1, Math.floor(photo.w * s)), h: Math.max(1, Math.floor(photo.h * s)) };
}

/** Redimensiona para edição mantendo a proporção (lado maior ≤ max). */
export function downscale(w: number, h: number, max = 2400) {
  const s = Math.min(1, max / Math.max(w, h));
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

// ---------- Histórico (desfazer/refazer) ----------
export interface History<T> { past: T[]; present: T; future: T[] }
export const historyInit = <T,>(present: T): History<T> => ({ past: [], present, future: [] });

export function historyPush<T>(h: History<T>, next: T, limit = 50): History<T> {
  if (JSON.stringify(next) === JSON.stringify(h.present)) return h;
  return { past: [...h.past, h.present].slice(-limit), present: next, future: [] };
}
export function historyUndo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h;
  return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
}
export function historyRedo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h;
  return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
}

// ---------- Validação de arquivo pelo conteúdo (não pela extensão) ----------
export type SniffedType = 'image/jpeg' | 'image/png' | 'image/webp' | null;

export function sniffImage(bytes: Uint8Array): SniffedType {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export const PHOTO_MAX_BYTES = 12 * 1024 * 1024;
export const ART_MAX_BYTES = 8 * 1024 * 1024;

export function validateFile(size: number, sniffed: SniffedType, kind: 'photo' | 'art'): string | null {
  if (!sniffed) return 'Arquivo não reconhecido. Use JPG, PNG ou WebP.';
  if (kind === 'art' && sniffed === 'image/jpeg') return 'Use um PNG ou WebP com fundo transparente para o desenho.';
  const max = kind === 'photo' ? PHOTO_MAX_BYTES : ART_MAX_BYTES;
  if (size > max) return `Arquivo muito grande. O limite é ${Math.round(max / 1024 / 1024)} MB.`;
  return null;
}

export function validateDimensions(w: number, h: number, kind: 'photo' | 'art'): string | null {
  const min = kind === 'photo' ? 300 : 80;
  if (w < min || h < min) return `Imagem muito pequena (mínimo ${min} × ${min} px).`;
  if (w / h > 6 || h / w > 6) return 'Proporção da imagem muito estreita.';
  return null;
}

/** Preferências levadas ao agendamento (opcional, com consentimento). */
export function encodePrefs(t: Transform): string {
  const s = sanitize(t);
  return [s.x, s.y, s.scale, s.rotation, s.opacity].map((v) => Math.round(v * 1000) / 1000).join(',');
}
export function decodePrefs(raw: string | null | undefined): Transform | null {
  if (!raw) return null;
  const p = raw.split(',').map(Number);
  if (p.length !== 5 || p.some((v) => !Number.isFinite(v))) return null;
  const [x, y, scale, rotation, opacity] = p;
  if (x < 0 || x > 1 || y < 0 || y > 1 || scale <= 0 || scale > 3 || opacity < 0.1 || opacity > 1) return null;
  return sanitize({ x, y, scale, rotation, opacity });
}
