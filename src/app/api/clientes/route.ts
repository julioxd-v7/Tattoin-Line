import { NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation';
import { normalizePhone, upsertClient } from '@/lib/clients';
import { serviceClient } from '@/lib/supabase/admin';
import { getArtist } from '@/lib/data';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Cadastro simples pelo site: nome completo + telefone. */
export async function POST(req: Request) {
  if (!await rateLimit(`signup:${clientIp(req.headers)}`, 5, 15 * 60000)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
  const parsed = signupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return NextResponse.json({ error: i?.message ?? 'Dados inválidos.', field: i?.path.join('.') }, { status: 422 });
  }
  if (parsed.data.website) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  try {
    const artist = await getArtist();
    const db = serviceClient();
    const phone = normalizePhone(parsed.data.phone);
    const { data: existing } = await db.from('clients').select('id').eq('artist_id', artist.id).eq('phone', phone).maybeSingle();
    if (existing) {
      // não revela nem devolve a ficha de quem já existe: o estúdio envia o link
      return NextResponse.json({ status: 'existente', message: 'Este telefone já tem cadastro. O estúdio vai te enviar o link da sua ficha pelo WhatsApp.' });
    }
    const id = await upsertClient(artist.id, parsed.data.name, phone, null, 'site');
    const { data } = await db.from('clients').update({ privacy_accepted_at: new Date().toISOString() }).eq('id', id).select('ficha_token').single();
    return NextResponse.json({ status: 'criado', token: data?.ficha_token }, { status: 201 });
  } catch (e) {
    console.error('clientes', (e as Error).message);
    return NextResponse.json({ error: 'Não foi possível concluir o cadastro agora. Tente novamente.' }, { status: 500 });
  }
}
