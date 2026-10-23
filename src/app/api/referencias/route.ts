import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { serviceClient } from '@/lib/supabase/admin';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  files: z.array(z.object({
    name: z.string().max(120),
    type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    size: z.number().int().positive().max(8 * 1024 * 1024)
  })).min(1).max(5)
});

/** Gera URLs assinadas para enviar referências direto ao armazenamento privado. */
export async function POST(req: Request) {
  if (!await rateLimit(`ref:${clientIp(req.headers)}`, 10, 10 * 60000)) return NextResponse.json({ error: 'Muitos envios. Aguarde alguns minutos.' }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Envie até 5 imagens JPG, PNG ou WebP de até 8 MB.' }, { status: 422 });
  const folder = crypto.randomUUID();
  const db = serviceClient();
  const out = [];
  for (const f of parsed.data.files) {
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `tmp/${folder}/${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const { data, error } = await db.storage.from('referencias').createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: 'Envio de imagens indisponível agora.' }, { status: 503 });
    out.push({ path, token: data.token, signedUrl: data.signedUrl });
  }
  return NextResponse.json({ uploads: out });
}
