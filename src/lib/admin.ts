import 'server-only';
import { redirect } from 'next/navigation';
import { sessionClient } from './supabase/server';
import { serviceClient } from './supabase/admin';

export interface AdminContext { userId: string; email: string | null; artistId: string }

/** Garante que quem acessa é o responsável autorizado do artista. */
export async function requireAdmin(): Promise<AdminContext> {
  const { data } = await sessionClient().auth.getUser();
  if (!data.user) redirect('/admin/login');
  const { data: profile } = await serviceClient().from('profiles').select('artist_id').eq('id', data.user.id).maybeSingle();
  if (!profile) redirect('/admin/login?erro=sem-acesso');
  return { userId: data.user.id, email: data.user.email ?? null, artistId: profile.artist_id };
}
