import { NextResponse } from 'next/server';
import { authorizedCron } from '@/lib/cron';
import { reconcileStaleHolds } from '@/lib/booking';
import { cleanupRateLimits } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!authorizedCron(req)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });
  const r = await reconcileStaleHolds();
  await cleanupRateLimits().catch(() => undefined);
  return NextResponse.json(r);
}
