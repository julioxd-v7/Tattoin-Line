'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { sessionClient } from '@/lib/supabase/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import type { ActionState } from './actions';

function siteOrigin() {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : 'http://localhost:3000');
}

/** Envia o e-mail de redefinição. A resposta é sempre a mesma, exista ou não a conta. */
export async function requestPasswordReset(_: ActionState, f: FormData): Promise<ActionState> {
  const email = z.string().trim().toLowerCase().email().safeParse(String(f.get('email') ?? ''));
  if (!email.success) return { error: 'Informe um e-mail válido.' };
  if (!await rateLimit(`reset:${clientIp(headers())}`, 5, 30 * 60000)) return { error: 'Muitas tentativas. Aguarde alguns minutos.' };
  await sessionClient().auth.resetPasswordForEmail(email.data, { redirectTo: `${siteOrigin()}/auth/confirmar?next=/admin/nova-senha` });
  return { ok: 'Se este e-mail tiver acesso ao painel, você vai receber um link para criar uma nova senha. Abra o link neste mesmo navegador.' };
}

export async function updatePassword(_: ActionState, f: FormData): Promise<ActionState> {
  const password = String(f.get('password') ?? '');
  const confirm = String(f.get('confirm') ?? '');
  if (password.length < 10) return { error: 'Use pelo menos 10 caracteres.' };
  if (password !== confirm) return { error: 'As duas senhas não são iguais.' };
  const supabase = sessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: 'O link expirou. Peça um novo em “Esqueci minha senha”.' };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message.includes('different') ? 'A nova senha precisa ser diferente da anterior.' : 'Não foi possível trocar a senha. Tente de novo.' };
  redirect('/admin?senha=1');
}
