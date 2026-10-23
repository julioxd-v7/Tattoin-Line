import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

let client: SupabaseClient | null = null;

/** Cliente com a chave de serviço. Usar SOMENTE no servidor, depois de validar a entrada. */
export function serviceClient(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}
