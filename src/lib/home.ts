/** Quantos trabalhos cabem no mosaico da página inicial (igual aos espaços do painel). */
export const HOME_WORKS_MAX = 4;

/**
 * Trabalhos do mosaico "Trabalhos selecionados".
 * 1) Os escolhidos em Painel → Página inicial, na ordem escolhida (ignora o que não está mais publicado).
 * 2) Sem escolha válida: os marcados como destaque e depois os demais, na ordem do portfólio.
 * Só entram trabalhos publicados com foto (a lista recebida já vem assim de getPublishedWorks).
 */
export function selectHomeWorks<T extends { id: string; featured?: boolean }>(chosenIds: readonly string[] | null | undefined, works: readonly T[], max: number = HOME_WORKS_MAX): T[] {
  const chosen = (chosenIds ?? [])
    .map((id) => works.find((w) => w.id === id))
    .filter((w, i, a): w is T => Boolean(w) && a.indexOf(w) === i);
  if (chosen.length) return chosen.slice(0, max);
  return [...works.filter((w) => w.featured), ...works.filter((w) => !w.featured)].slice(0, max);
}

/**
 * Texto realmente cadastrado pelo artista?
 * Vazio ou texto-modelo entre colchetes (ex.: "[Apresentação do artista…]", do banco de demonstração) não conta.
 */
export function isFilled(text: string | null | undefined): text is string {
  const t = (text ?? '').trim();
  return t.length > 0 && !/^\[[\s\S]*\]$/.test(t);
}

/** Parágrafos do "Sobre mim" (separados por linha em branco). */
export function aboutParagraphs(text: string | null | undefined): string[] {
  if (!isFilled(text)) return [];
  return text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}

/** Resumo para a página inicial: primeiro parágrafo, cortado em palavra inteira. `more` indica que há mais texto. */
export function aboutExcerpt(text: string | null | undefined, max = 320): { text: string; more: boolean } {
  const paras = aboutParagraphs(text);
  if (!paras.length) return { text: '', more: false };
  const first = paras[0];
  if (first.length <= max) return { text: first, more: paras.length > 1 };
  const cut = first.slice(0, max + 1);
  const at = cut.lastIndexOf(' ');
  return { text: `${(at > max * 0.6 ? cut.slice(0, at) : first.slice(0, max)).replace(/[\s,;:.–—-]+$/, '')}…`, more: true };
}

/** Quantos projetos (flash) cabem na galeria da página inicial (igual aos espaços do painel). */
export const HOME_FLASH_MAX = 4;

/**
 * Projetos da galeria "Desenhos exclusivos".
 * 1) Os escolhidos em Painel → Página inicial, na ordem escolhida (só os que ainda aparecem no site).
 * 2) Sem escolha válida: os disponíveis primeiro, depois os reservados, na ordem do cadastro.
 * Já tatuados ("vendido") e arquivados nunca entram; a lista recebida já vem sem eles.
 */
export function selectHomeFlash<T extends { id: string; status: string }>(chosenIds: readonly string[] | null | undefined, flash: readonly T[], max: number = HOME_FLASH_MAX): T[] {
  const visible = flash.filter((f) => f.status === 'disponivel' || f.status === 'reservado');
  const chosen = (chosenIds ?? [])
    .map((id) => visible.find((f) => f.id === id))
    .filter((f, i, a): f is T => Boolean(f) && a.indexOf(f) === i);
  if (chosen.length) return chosen.slice(0, max);
  return [...visible.filter((f) => f.status === 'disponivel'), ...visible.filter((f) => f.status !== 'disponivel')].slice(0, max);
}
