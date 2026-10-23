import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { sessionClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Recebe o link do e-mail (recuperar senha), cria a sessão e segue para o painel. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get('next') ?? '/admin';
  const next = nextParam.startsWith('/admin') ? nextParam : '/admin'; // nunca redireciona para fora do site
  const supabase = sessionClient();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('link inválido') };
  if (error) return NextResponse.redirect(new URL('/admin/recuperar?erro=link', url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
