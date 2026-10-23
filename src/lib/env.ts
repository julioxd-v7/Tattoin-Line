import 'server-only';

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export const env = {
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  supabaseUrl: () => req('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => req('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: () => req('SUPABASE_SERVICE_ROLE_KEY'),
  artistSlug: () => process.env.ARTIST_SLUG || 'caio-martins',
  mpAccessToken: () => process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  mpWebhookSecret: () => process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  mpEnv: () => (process.env.MERCADOPAGO_ENV === 'production' ? 'production' : 'test') as 'production' | 'test',
  resendKey: () => process.env.RESEND_API_KEY || '',
  emailFrom: () => process.env.EMAIL_FROM || '',
  adminNotifyEmail: () => process.env.ADMIN_NOTIFY_EMAIL || '',
  whatsappToken: () => process.env.WHATSAPP_TOKEN || '',
  whatsappPhoneId: () => process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappTemplate: () => process.env.WHATSAPP_TEMPLATE_STATUS || '',
  cronSecret: () => process.env.CRON_SECRET || ''
};

export const integrations = {
  payments: () => Boolean(env.mpAccessToken()),
  webhookSigned: () => Boolean(env.mpWebhookSecret()),
  email: () => Boolean(env.resendKey() && env.emailFrom()),
  whatsapp: () => Boolean(env.whatsappToken() && env.whatsappPhoneId() && env.whatsappTemplate())
};
