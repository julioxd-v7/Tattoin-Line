import { NextResponse } from 'next/server';
import { fichaSchema } from '@/lib/validation';
import { getClientByToken } from '@/lib/clients';
import { serviceClient } from '@/lib/supabase/admin';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** O cliente completa ou atualiza a própria ficha pelo link secreto. */
export async function PUT(req: Request, { params }: { params: { token: string } }) {
  if (!await rateLimit(`ficha:${clientIp(req.headers)}`, 20, 15 * 60000)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
  const client = await getClientByToken(params.token);
  if (!client) return NextResponse.json({ error: 'Ficha não encontrada.' }, { status: 404 });
  const parsed = fichaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return NextResponse.json({ error: i?.message ?? 'Dados inválidos.', field: i?.path.join('.') }, { status: 422 });
  }
  const v = parsed.data;
  const hasHealth = Boolean(v.allergies || v.medications || v.conditions || v.healthNotes);
  const { error } = await serviceClient().from('clients').update({
    full_name: v.name, email: v.email, birth_date: v.birthDate, instagram: v.instagram?.replace('@', '') ?? null,
    allergies: v.allergies, medications: v.medications, conditions: v.conditions, health_notes: v.healthNotes,
    health_consent_at: hasHealth ? client.health_consent_at ?? new Date().toISOString() : null,
    ficha_completed_at: new Date().toISOString(), privacy_accepted_at: client.privacy_accepted_at ?? new Date().toISOString()
  }).eq('id', client.id);
  if (error) return NextResponse.json({ error: 'Não foi possível salvar agora. Tente novamente.' }, { status: 500 });
  return NextResponse.json({ ok: true, message: 'Ficha salva. Obrigado!' });
}

/** Pedido de exclusão dos dados (LGPD). O artista conclui pelo painel. */
export async function POST(req: Request, { params }: { params: { token: string } }) {
  if (!await rateLimit(`ficha-del:${clientIp(req.headers)}`, 3, 15 * 60000)) return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 });
  const client = await getClientByToken(params.token);
  if (!client) return NextResponse.json({ error: 'Ficha não encontrada.' }, { status: 404 });
  await serviceClient().from('clients').update({ deletion_requested_at: new Date().toISOString() }).eq('id', client.id);
  return NextResponse.json({ ok: true, message: 'Pedido recebido. Seus dados serão excluídos, mantendo apenas os registros financeiros exigidos por lei.' });
}
