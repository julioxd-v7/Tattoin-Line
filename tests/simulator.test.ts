import { describe, expect, it } from 'vitest';
import { decodePrefs, encodePrefs, fitContain, fromStage, historyInit, historyPush, historyRedo, historyUndo, initialTransform, normalizeRotation, sanitize, sniffImage, toStage, validateDimensions, validateFile } from '../src/lib/simulator';

describe('coordenadas normalizadas', () => {
  const t = { x: 0.3, y: 0.6, scale: 0.25, rotation: 30, opacity: 0.8 };
  it('ida e volta no mesmo palco', () => {
    const n = toStage(t, { w: 800, h: 600 }, 1.5);
    expect(fromStage(n, { w: 800, h: 600 }, 0.8)).toEqual(t);
  });
  it('trocar o tamanho da tela preserva posição e tamanho relativos', () => {
    const big = toStage(t, { w: 1200, h: 900 }, 1.5);
    const small = toStage(t, { w: 360, h: 270 }, 1.5);
    expect(big.x / 1200).toBe(small.x / 360);
    expect(big.width / 1200).toBe(small.width / 360);
    expect(fromStage(small, { w: 360, h: 270 }, 0.8)).toEqual(t);
  });
  it('mantém a proporção do desenho', () => {
    const n = toStage(t, { w: 1000, h: 750 }, 1.5);
    expect(n.height / n.width).toBe(1.5);
  });
});

describe('limites', () => {
  it('corrige valores inválidos', () => {
    const s = sanitize({ x: -1, y: 2, scale: 99, rotation: 540, opacity: 0 });
    expect(s.x).toBe(0); expect(s.y).toBe(1); expect(s.scale).toBe(1.6); expect(s.rotation).toBe(180); expect(s.opacity).toBe(0.1);
  });
  it('normaliza rotação', () => { expect(normalizeRotation(-190)).toBe(170); expect(normalizeRotation(360)).toBe(0); });
  it('posição inicial centralizada e proporcional', () => {
    const t = initialTransform({ w: 2000, h: 1500 }, { w: 400, h: 800 });
    expect(t.x).toBe(0.5); expect(t.y).toBe(0.5);
    // maior lado do desenho ≈ 35% de 1500 = 525 px → largura 262,5 px
    expect(Math.round(t.scale * 2000)).toBe(263);
  });
  it('contain não corta nem deforma', () => {
    const r = fitContain({ w: 3000, h: 4000 }, { w: 600, h: 600 });
    expect(r.w).toBe(450); expect(r.h).toBe(600);
  });
});

describe('histórico', () => {
  it('desfaz e refaz', () => {
    let h = historyInit(1);
    h = historyPush(h, 2); h = historyPush(h, 3);
    h = historyUndo(h); expect(h.present).toBe(2);
    h = historyUndo(h); expect(h.present).toBe(1);
    h = historyRedo(h); expect(h.present).toBe(2);
    h = historyPush(h, 9); expect(h.future).toHaveLength(0);
  });
  it('ignora mudança igual', () => { const h = historyInit({ a: 1 }); expect(historyPush(h, { a: 1 })).toBe(h); });
});

describe('arquivos', () => {
  it('reconhece pelo conteúdo', () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffImage(new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0)))))).toBe('image/webp');
    expect(sniffImage(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe(null);
  });
  it('recusa JPG como desenho e foto grande demais', () => {
    expect(validateFile(1000, 'image/jpeg', 'art')).not.toBe(null);
    expect(validateFile(13 * 1024 * 1024, 'image/jpeg', 'photo')).not.toBe(null);
    expect(validateFile(1000, 'image/png', 'art')).toBe(null);
  });
  it('dimensões mínimas', () => { expect(validateDimensions(200, 800, 'photo')).not.toBe(null); expect(validateDimensions(1200, 900, 'photo')).toBe(null); });
});

describe('preferências para o agendamento', () => {
  it('codifica e decodifica', () => {
    const t = { x: 0.25, y: 0.5, scale: 0.3, rotation: -15, opacity: 0.9 };
    expect(decodePrefs(encodePrefs(t))).toEqual(t);
  });
  it('recusa valores fora dos limites', () => { expect(decodePrefs('2,0,0.3,0,1')).toBe(null); expect(decodePrefs('a,b')).toBe(null); });
});
