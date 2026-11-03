/**
 * fetch para o Supabase que NUNCA usa o cache de dados do Next.
 *
 * No Next 14, fetch() no servidor é guardado por padrão — inclusive POST e inclusive em rotas
 * com `dynamic = 'force-dynamic'`. Sem isto, a função anti-spam (rate_limit_hit), a agenda,
 * o painel e a checagem de login respondiam com o primeiro resultado guardado (até 1 ano).
 * É a mesma proteção que src/lib/mercadopago.ts já usa nas chamadas ao Mercado Pago.
 */
export const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });
