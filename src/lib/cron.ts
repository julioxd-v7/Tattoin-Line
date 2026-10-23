import 'server-only';
import { env } from './env';

export function authorizedCron(req: Request): boolean {
  const secret = env.cronSecret();
  if (!secret) return false;
  const h = req.headers.get('authorization');
  return h === `Bearer ${secret}` || new URL(req.url).searchParams.get('key') === secret;
}
