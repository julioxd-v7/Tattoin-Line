import { describe, expect, it } from 'vitest';
import { aboutExcerpt, aboutParagraphs, isFilled, selectHomeFlash, selectHomeWorks } from '../src/lib/home';

const w = (id: string, featured = false) => ({ id, featured });
const works = [w('a'), w('b', true), w('c'), w('d', true), w('e'), w('f')];

describe('selectHomeWorks', () => {
  it('usa a escolha do painel, na ordem escolhida', () => {
    expect(selectHomeWorks(['e', 'a'], works).map((x) => x.id)).toEqual(['e', 'a']);
  });
  it('ignora escolhidos que não estão mais publicados e repetidos', () => {
    expect(selectHomeWorks(['zz', 'c', 'c'], works).map((x) => x.id)).toEqual(['c']);
  });
  it('sem escolha válida: destaques primeiro, depois os demais, até o limite', () => {
    expect(selectHomeWorks([], works).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(selectHomeWorks(['zz'], works).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(selectHomeWorks(null, works, 2).map((x) => x.id)).toEqual(['b', 'd']);
  });
  it('limita a escolha ao máximo', () => {
    expect(selectHomeWorks(['a', 'b', 'c', 'd', 'e'], works)).toHaveLength(4);
  });
  it('sem trabalhos publicados devolve vazio', () => {
    expect(selectHomeWorks(['a'], [])).toEqual([]);
  });
});


describe('isFilled', () => {
  it('vazio e texto-modelo entre colchetes não contam', () => {
    expect(isFilled('')).toBe(false);
    expect(isFilled('   ')).toBe(false);
    expect(isFilled(null)).toBe(false);
    expect(isFilled('[Apresentação do artista: trajetória, há quanto tempo tatua.]')).toBe(false);
  });
  it('texto real conta, mesmo com colchetes no meio', () => {
    expect(isFilled('Tatuo desde 2015.')).toBe(true);
    expect(isFilled('Fine line [e blackwork] em Recife.')).toBe(true);
  });
});

describe('aboutParagraphs / aboutExcerpt', () => {
  const bio = 'Primeiro parágrafo curto.\r\n\r\nSegundo parágrafo\ncom quebra simples.';
  it('separa por linha em branco e junta quebras simples', () => {
    expect(aboutParagraphs(bio)).toEqual(['Primeiro parágrafo curto.', 'Segundo parágrafo com quebra simples.']);
  });
  it('resumo é o primeiro parágrafo e avisa que há mais', () => {
    expect(aboutExcerpt(bio)).toEqual({ text: 'Primeiro parágrafo curto.', more: true });
    expect(aboutExcerpt('Só um parágrafo.')).toEqual({ text: 'Só um parágrafo.', more: false });
  });
  it('corta parágrafo longo em palavra inteira', () => {
    const long = 'palavra '.repeat(60).trim();
    const r = aboutExcerpt(long, 50);
    expect(r.more).toBe(true);
    expect(r.text.endsWith('palavra…')).toBe(true);
    expect(r.text.length).toBeLessThanOrEqual(51);
  });
  it('sem texto cadastrado devolve vazio', () => {
    expect(aboutExcerpt('[texto modelo]')).toEqual({ text: '', more: false });
  });
});

describe('selectHomeFlash', () => {
  const f = (id: string, status: string) => ({ id, status });
  const flash = [f('r1', 'reservado'), f('d1', 'disponivel'), f('v1', 'vendido'), f('d2', 'disponivel'), f('r2', 'reservado'), f('d3', 'disponivel')];
  it('usa a escolha do painel, na ordem, sem já tatuados', () => {
    expect(selectHomeFlash(['r2', 'v1', 'd1'], flash).map((x) => x.id)).toEqual(['r2', 'd1']);
  });
  it('sem escolha: disponíveis primeiro, depois reservados, até 4', () => {
    expect(selectHomeFlash([], flash).map((x) => x.id)).toEqual(['d1', 'd2', 'd3', 'r1']);
    expect(selectHomeFlash(['nao-existe'], flash, 2).map((x) => x.id)).toEqual(['d1', 'd2']);
  });
  it('sem projetos visíveis devolve vazio', () => {
    expect(selectHomeFlash([], [f('v1', 'vendido'), f('a1', 'arquivado')])).toEqual([]);
  });
});
