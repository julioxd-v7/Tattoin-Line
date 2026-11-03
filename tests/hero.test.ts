import { describe, expect, it } from 'vitest';
import { heroDisplay, heroTitleLines, normalizeHeroTitle } from '../src/lib/hero';

describe('heroDisplay', () => {
  it('usa padrões quando as colunas ainda não existem', () => {
    expect(heroDisplay({})).toEqual({ layout: 'lateral', overlay: 0.3, focusX: 50, focusY: 50, zoom: 1 });
  });
  it('converte porcentagens e respeita os limites', () => {
    expect(heroDisplay({ hero_layout: 'fundo', hero_overlay: 60, hero_focus_x: 20, hero_focus_y: 80, hero_zoom: 150 }))
      .toEqual({ layout: 'fundo', overlay: 0.6, focusX: 20, focusY: 80, zoom: 1.5 });
    expect(heroDisplay({ hero_overlay: 200, hero_focus_x: -5, hero_zoom: 50 })).toMatchObject({ overlay: 0.85, focusX: 0, zoom: 1 });
  });
  it('ignora layout desconhecido', () => {
    expect(heroDisplay({ hero_layout: 'outro' as never }).layout).toBe('lateral');
  });
});

describe('heroTitleLines', () => {
  it('respeita a quebra feita no painel', () => {
    expect(heroTitleLines('Arte na pele.\nCom propósito.')).toEqual(['Arte na pele.', 'Com propósito.']);
    expect(heroTitleLines('Arte na pele.\r\nCom propósito.')).toEqual(['Arte na pele.', 'Com propósito.']);
  });
  it('sem quebra, separa por frase', () => {
    expect(heroTitleLines('Arte na pele. Com propósito.')).toEqual(['Arte na pele.', 'Com propósito.']);
    expect(heroTitleLines('Arte que fica pra vida toda.')).toEqual(['Arte que fica pra vida toda.']);
  });
  it('junta o excedente na última linha', () => {
    expect(heroTitleLines('a\nb\nc\nd')).toEqual(['a', 'b', 'c d']);
  });
  it('título vazio não gera linhas', () => {
    expect(heroTitleLines('   ')).toEqual([]);
  });
});

describe('normalizeHeroTitle', () => {
  it('remove linhas vazias, espaços extras e limita a 3 linhas', () => {
    expect(normalizeHeroTitle('  Arte  na pele. \r\n\r\n Com propósito. \nx\ny')).toBe('Arte na pele.\nCom propósito.\nx');
  });
});
