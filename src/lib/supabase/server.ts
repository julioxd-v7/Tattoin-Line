import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env } from '../env';

/** Cliente com a sessão do usuário (cookies) — respeita as políticas RLS. */
export function sessionClient() {
  const store = cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // chamado em Server Component: o middleware renova a sessão
        }
      }
    }
  });
}
