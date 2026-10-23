import 'server-only';
import { env, integrations } from './env';
import { serviceClient } from './supabase/admin';
import { formatBRL, formatDuration } from './money';
import { formatDateTime } from './tz';
import type { Appointment } from './types';

export type Template =
  | 'solicitacao_recebida' | 'pagamento_aprovado' | 'agendamento_confirmado' | 'lembrete'
  | 'alteracao_horario' | 'cancelamento' | 'reembolso' | 'orcamento_pronto' | 'reserva_expirada' | 'aviso_admin';

interface Ctx { appointment: Appointment; tz: string; artistName: string; extra?: string }

function esc(s: string) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }

function content(t: Template, c: Ctx): { subject: string; lines: string[] } {
  const a = c.appointment;
  const when = a.starts_at ? formatDateTime(a.starts_at, c.tz) + ' (horário de Recife)' : 'data a combinar';
  const link = `${env.siteUrl()}/reserva/${a.public_token}`;
  const values = a.total_cents != null
    ? [`Valor ${a.is_estimate ? 'estimado (a partir de)' : 'total'}: ${formatBRL(a.total_cents)}`, `Pagamento agora: ${formatBRL(a.amount_due_cents)}`, `Saldo no dia: ${formatBRL(a.balance_cents)}`]
    : ['Valor: sob orçamento'];
  const base = [`Data: ${when}`, `Duração estimada: ${formatDuration(a.duration_minutes)}`, ...values, '', `Acompanhe sua reserva: ${link}`];
  switch (t) {
    case 'solicitacao_recebida':
      return a.status === 'solicitado'
        ? { subject: 'Recebemos sua ideia', lines: [`Olá, ${a.customer_name}!`, 'Seu pedido de orçamento chegou. Você recebe valor, duração e horários sugeridos em até 3 dias úteis.', '', `Acompanhe: ${link}`] }
        : { subject: 'Horário reservado — conclua o pagamento', lines: [`Olá, ${a.customer_name}!`, `Seu horário está reservado até ${a.hold_expires_at ? formatDateTime(a.hold_expires_at, c.tz, { timeStyle: 'short' }) : 'o fim do prazo'}. Ele só é confirmado depois que o pagamento for aprovado.`, '', ...base] };
    case 'pagamento_aprovado': return { subject: 'Pagamento aprovado', lines: [`Olá, ${a.customer_name}!`, 'Recebemos seu pagamento.', '', ...base] };
    case 'agendamento_confirmado': return { subject: 'Sessão confirmada', lines: [`Olá, ${a.customer_name}!`, 'Sua sessão está confirmada. Chegue 10 minutos antes e traga um documento com foto.', '', ...base] };
    case 'lembrete': return { subject: 'Lembrete: sua sessão é amanhã', lines: [`Olá, ${a.customer_name}!`, 'Passando para lembrar da sua sessão. Durma bem, coma antes de vir e evite álcool nas 24 h anteriores.', '', ...base] };
    case 'alteracao_horario': return { subject: 'Seu horário mudou', lines: [`Olá, ${a.customer_name}!`, 'Seu agendamento foi atualizado.', '', ...base] };
    case 'cancelamento': return { subject: 'Reserva cancelada', lines: [`Olá, ${a.customer_name}!`, 'Sua reserva foi cancelada.', c.extra ?? '', '', `Detalhes: ${link}`] };
    case 'reembolso': return { subject: 'Reembolso em andamento', lines: [`Olá, ${a.customer_name}!`, c.extra ?? 'Seu reembolso foi solicitado ao Mercado Pago e aparece no mesmo meio de pagamento em alguns dias.', '', `Detalhes: ${link}`] };
    case 'orcamento_pronto': return { subject: 'Seu orçamento está pronto', lines: [`Olá, ${a.customer_name}!`, 'Avaliei sua ideia. Para garantir o horário, pague o sinal pelo link abaixo.', '', ...base, a.mp_checkout_url ? `Pagar agora: ${a.mp_checkout_url}` : ''] };
    case 'reserva_expirada': return { subject: 'O prazo da sua reserva terminou', lines: [`Olá, ${a.customer_name}!`, 'O pagamento não foi concluído a tempo e o horário foi liberado. Nenhuma cobrança foi feita. Você pode escolher um novo horário quando quiser.', '', `${env.siteUrl()}/agendar`] };
    case 'aviso_admin': return { subject: `[Painel] ${c.extra ?? 'Atualização de agendamento'}`, lines: [`Cliente: ${a.customer_name} (${a.customer_email}, ${a.customer_phone})`, `Data: ${when}`, `Status: ${a.status} / ${a.payment_status}`, '', `${env.siteUrl()}/admin/agenda/${a.id}`] };
  }
}

async function record(appointmentId: string, channel: 'email' | 'whatsapp', template: Template, recipient: string, status: 'enviado' | 'falhou' | 'nao_configurado', providerId?: string, error?: string) {
  await serviceClient().from('customer_notifications').insert({ appointment_id: appointmentId, channel, template, recipient, status, provider_message_id: providerId ?? null, error: error ?? null });
}

async function sendEmail(to: string, subject: string, lines: string[]): Promise<{ ok: boolean; id?: string; error?: string }> {
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c1b19">${lines.map((l) => (l ? `<p style="margin:0 0 8px">${esc(l).replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>` : '<br>')).join('')}<p style="margin-top:24px;color:#5e5a53">Tattoin Line</p></div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.resendKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.emailFrom(), to: [to], subject, html, text: lines.join('\n') }),
      signal: AbortSignal.timeout(10000)
    });
    const body = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, id: body.id } : { ok: false, error: body?.message ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function sendWhatsApp(phone: string, text: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${env.whatsappPhoneId()}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.whatsappToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'template',
        template: { name: env.whatsappTemplate(), language: { code: 'pt_BR' }, components: [{ type: 'body', parameters: [{ type: 'text', text: text.slice(0, 1000) }] }] }
      }),
      signal: AbortSignal.timeout(10000)
    });
    const body = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, id: body?.messages?.[0]?.id } : { ok: false, error: body?.error?.message ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Envia (ou registra como não configurado) uma notificação. Nunca lança erro. */
export async function notify(template: Template, ctx: Ctx): Promise<void> {
  const a = ctx.appointment;
  const { subject, lines } = content(template, ctx);
  const to = template === 'aviso_admin' ? env.adminNotifyEmail() : a.customer_email;
  try {
    if (!to) return;
    if (!integrations.email()) {
      await record(a.id, 'email', template, to, 'nao_configurado');
    } else {
      const r = await sendEmail(to, subject, lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')));
      await record(a.id, 'email', template, to, r.ok ? 'enviado' : 'falhou', r.id, r.error);
    }
    if (template !== 'aviso_admin' && integrations.whatsapp()) {
      const r = await sendWhatsApp(a.customer_phone, `${subject}. ${lines.filter(Boolean).slice(1, 3).join(' ')}`);
      await record(a.id, 'whatsapp', template, a.customer_phone, r.ok ? 'enviado' : 'falhou', r.id, r.error);
    }
  } catch (e) {
    console.error('notify', template, (e as Error).message);
  }
}
