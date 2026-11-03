import { afterEach, describe, expect, it, vi } from 'vitest';

// Garante que as consultas ao Supabase nunca usem o cache de dados do Next (veja src/lib/supabase/fetch.ts).
const created: { options: { global?: { fetch?: typeof fetch } } }[] = [];
vi.mock('@supabase/supabase-js', () => ({ createClient: (_u: string, _k: string, options: never) => { created.push({ options }); return {}; } }));

describe('cliente Supabase do servidor', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('o fetch usado pelo cliente de serviço sempre manda cache: no-store', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'x');
    const spy = vi.fn().mockResolvedValue(new Response('true'));
    vi.stubGlobal('fetch', spy);
    const { serviceClient } = await import('../src/lib/supabase/admin');
    serviceClient();
    const f = created[0].options.global?.fetch;
    expect(f).toBeTypeOf('function');
    await f!('http://localhost:54321/rest/v1/rpc/rate_limit_hit', { method: 'POST', body: '{}' });
    expect(spy).toHaveBeenCalledWith('http://localhost:54321/rest/v1/rpc/rate_limit_hit', expect.objectContaining({ method: 'POST', cache: 'no-store' }));
  });

  it('noStoreFetch sobrescreve qualquer cache pedido', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(''));
    vi.stubGlobal('fetch', spy);
    const { noStoreFetch } = await import('../src/lib/supabase/fetch');
    await noStoreFetch('http://x', { cache: 'force-cache' });
    expect(spy.mock.calls[0][1].cache).toBe('no-store');
  });
});
