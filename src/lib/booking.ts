import 'server-only';
import { serviceClient } from './supabase/admin';
import { getArtist, getSettings } from './data';
import { quote, PricingError } from './pricing';
import { createPreference, getPayment, mapStatus, refundPayment, searchPaymentsByReference, type MpPayment } from './mercadopago';
import { integrations } from './env';
import { notify } from './notify';
import { appointmentEvent } from './audit';
import type { BookingInput } from './validation';
import { upsertClient } from './clients';
import type { Appointment, PaymentStatus } from './types';

export class BookingError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

const RPC_ERRORS: Record<string, string> = {
  HORARIO_OCUPADO: 'Esse horário acabou de ser reservado por outra pessoa. Escolha outro.',
  HORARIO_BLOQUEADO: 'Esse horário não está disponível. Escolha outro.',
  FORA_DO_HORARIO: 'Esse horário está fora do atendimento. Escolha outro.',
  HORARIO_PASSADO: 'Escolha um horário com pelo menos 2 horas de antecedência.',
  PROJETO_INDISPONIVEL: 'Este projeto acabou de ser reservado. Escolha outro desenho.',
  VALOR_DIVERGENTE: 'O valor do projeto mudou. Recarregue a página e tente novamente.'
};

function rpcError(message: string): BookingError {
  const code = Object.keys(RPC_ERRORS).find((k) => message.includes(k));
  if (code) return new BookingError(code, RPC_ERRORS[code], 409);
  console.error('create_booking_hold', message);
  return new BookingError('ERRO', 'Não foi possível concluir a reserva agora. Tente novamente em instantes.', 500);
}

export async function getAppointmentByToken(token: string): Promise<Appointment | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const { data } = await serviceClient().from('appointments').select('*').eq('public_token', token).maybeSingle();
  return (data as Appointment) ?? null;
}

async function ctx() {
  const [artist, settings] = await Promise.all([getArtist(), getSettings()]);
  return { artist, settings, tz: artist.timezone, artistName: artist.name };
}

/** Cria a solicitação/reserva temporária e, se houver valor, a cobrança no Mercado Pago. */
export async function createBooking(input: BookingInput): Promise<{ token: string; checkoutUrl: string | null; status: string }> {
  const { artist, settings, tz, artistName } = await ctx();
  const db = serviceClient();

  type FlashRow = { id: string; name: string; price_cents: number; duration_minutes: number; size_label: string; style: { name: string } | null };
  let flash: FlashRow | null = null;
  if (input.service === 'projeto') {
    const { data } = await db.from('flash_projects').select('id, name, price_cents, duration_minutes, size_label, status, style:tattoo_styles(name)')
      .eq('artist_id', artist.id).eq('slug', input.flashSlug!).maybeSingle();
    if (!data || data.status !== 'disponivel') throw new BookingError('PROJETO_INDISPONIVEL', RPC_ERRORS.PROJETO_INDISPONIVEL, 409);
    flash = data as unknown as FlashRow;
  }

  let q;
  try {
    q = quote(settings, { service: input.service, sizeId: input.sizeId, flash, chargeMode: input.chargeMode });
  } catch (e) {
    if (e instanceof PricingError) throw new BookingError(e.message, 'Opção de serviço inválida.');
    throw e;
  }

  const startsAt = q.needsEvaluation ? null : input.startsAt;
  if (!q.needsEvaluation) {
    if (!startsAt) throw new BookingError('DATA_OBRIGATORIA', 'Escolha uma data e um horário.');
    const max = Date.now() + settings.booking_window_days * 86400000;
    if (new Date(startsAt).getTime() > max) throw new BookingError('DATA_DISTANTE', 'Essa data ainda não está aberta para agendamento.');
    if (!integrations.payments()) throw new BookingError('PAGAMENTO_INDISPONIVEL', 'O pagamento online está indisponível no momento. Fale com o estúdio pelo WhatsApp.', 503);
    // libera reservas vencidas (após validar no Mercado Pago) antes de tentar o horário
    await reconcileStaleHolds(artist.id);
  }

  const terms = {
    version: 1,
    captured_at: new Date().toISOString(),
    cancellation_policy: settings.cancellation_policy,
    reschedule_min_hours: settings.reschedule_min_hours,
    deposit_percent: settings.deposit_percent,
    deposit_min_cents: settings.deposit_min_cents,
    quote_label: q.label,
    is_estimate: q.isEstimate
  };

  const { data: row, error } = await db.rpc('create_booking_hold', {
    p_artist: artist.id,
    p_service: input.service,
    p_flash: flash?.id ?? null,
    p_starts: startsAt,
    p_duration: q.durationMinutes,
    p_buffer: settings.buffer_minutes,
    p_hold_minutes: settings.hold_minutes,
    p_customer: input.customer,
    p_details: {
      style: input.service === 'projeto' ? flash?.style?.name ?? null : input.style ?? null,
      body_region: input.bodyRegion ?? null,
      size_label: input.service === 'projeto' ? flash?.size_label : settings.size_tiers.find((t) => t.id === input.sizeId)?.label ?? null,
      idea: input.idea ?? null,
      reference_paths: input.referencePaths
    },
    p_pricing: {
      total_cents: q.totalCents, deposit_cents: q.depositCents, balance_cents: q.balanceCents,
      amount_due_cents: q.amountDueCents, is_estimate: q.isEstimate, charge_mode: q.chargeMode
    },
    p_terms: terms
  });
  if (error) throw rpcError(error.message);
  const appt = row as Appointment;

  // origem (só estatística para o painel; preço e horário já foram validados acima)
  if (input.origin === 'simulador' && input.service === 'projeto') {
    await db.from('appointments').update({ source: 'simulador' }).eq('id', appt.id);
  }

  // cria ou completa a ficha do cliente (falha aqui não impede a reserva)
  try {
    const clientId = await upsertClient(artist.id, input.customer.name, input.customer.phone, input.customer.email, 'agendamento');
    await db.from('appointments').update({ client_id: clientId }).eq('id', appt.id);
  } catch (e) {
    console.error('upsertClient', (e as Error).message);
  }

  if (appt.status === 'solicitado') {
    await Promise.all([
      notify('solicitacao_recebida', { appointment: appt, tz, artistName }),
      notify('aviso_admin', { appointment: appt, tz, artistName, extra: 'Novo pedido de orçamento' })
    ]);
    return { token: appt.public_token, checkoutUrl: null, status: appt.status };
  }

  try {
    const pref = await createPreference({
      appointmentId: appt.id, publicToken: appt.public_token,
      title: `${q.label} — ${q.chargeMode === 'integral' ? 'pagamento integral' : 'sinal'}`,
      amountCents: appt.amount_due_cents!, payerEmail: appt.customer_email, payerName: appt.customer_name,
      expiresAt: new Date(appt.hold_expires_at!)
    });
    const { data: updated } = await db.from('appointments').update({ mp_preference_id: pref.id, mp_checkout_url: pref.checkoutUrl }).eq('id', appt.id).select('*').single();
    const a = (updated as Appointment) ?? appt;
    await Promise.all([
      notify('solicitacao_recebida', { appointment: a, tz, artistName }),
      notify('aviso_admin', { appointment: a, tz, artistName, extra: 'Nova reserva aguardando pagamento' })
    ]);
    return { token: appt.public_token, checkoutUrl: pref.checkoutUrl, status: appt.status };
  } catch (e) {
    // sem cobrança não há reserva: libera o horário imediatamente
    console.error('createPreference', (e as Error).message);
    await db.from('appointments').update({ status: 'cancelado', payment_status: 'cancelado', attention_reason: 'Falha ao criar cobrança' }).eq('id', appt.id);
    if (appt.flash_project_id) await db.rpc('release_flash_if_free', { p_flash: appt.flash_project_id });
    throw new BookingError('PAGAMENTO_INDISPONIVEL', 'O pagamento online está indisponível no momento. Nada foi cobrado; tente novamente em alguns minutos.', 503);
  }
}

/**
 * Aplica o estado real de um pagamento consultado no Mercado Pago.
 * Idempotente: pode ser chamado várias vezes para o mesmo pagamento.
 */
export async function applyPayment(p: MpPayment): Promise<string> {
  const db = serviceClient();
  if (!p.external_reference) return 'sem_referencia';
  const { data: apptRow } = await db.from('appointments').select('*').eq('id', p.external_reference).maybeSingle();
  if (!apptRow) return 'agendamento_inexistente';
  const appt = apptRow as Appointment;
  const status = mapStatus(p.status);
  const amountCents = Math.round(p.transaction_amount * 100);

  await db.from('payments').upsert({
    appointment_id: appt.id, provider: 'mercadopago', provider_payment_id: String(p.id), preference_id: appt.mp_preference_id,
    status, provider_status: p.status, provider_status_detail: p.status_detail, amount_cents: amountCents,
    method: p.payment_method_id ?? p.payment_type_id, live_mode: p.live_mode, raw: p
  }, { onConflict: 'provider,provider_payment_id' });

  const { tz, artistName } = await ctx();
  const amountOk = p.currency_id === 'BRL' && amountCents === appt.amount_due_cents;

  if (status === 'aprovado') {
    if (!amountOk) {
      await db.from('appointments').update({ needs_attention: true, attention_reason: `Pagamento ${p.id} com valor divergente (${amountCents} centavos)` }).eq('id', appt.id);
      await notify('aviso_admin', { appointment: appt, tz, artistName, extra: 'Pagamento com valor divergente' });
      return 'valor_divergente';
    }
    if (appt.status === 'aguardando_pagamento') {
      const { data: u } = await db.from('appointments').update({ status: 'confirmado', payment_status: 'aprovado', hold_expires_at: null })
        .eq('id', appt.id).eq('status', 'aguardando_pagamento').select('*').maybeSingle();
      if (u) {
        await notify('agendamento_confirmado', { appointment: u as Appointment, tz, artistName });
        await notify('aviso_admin', { appointment: u as Appointment, tz, artistName, extra: 'Sessão confirmada (pagamento aprovado)' });
        return 'confirmado';
      }
      return 'ja_processado';
    }
    if (appt.status === 'expirado' || appt.status === 'cancelado') {
      // pagamento aprovado depois da expiração: só confirma se o horário e o projeto ainda estiverem livres
      if (appt.payment_status === 'aprovado' || appt.payment_status === 'reembolso_solicitado' || appt.payment_status === 'reembolsado') return 'ja_processado';
      let flashOk = true;
      if (appt.flash_project_id) {
        const { data: f } = await db.from('flash_projects').update({ status: 'reservado' }).eq('id', appt.flash_project_id).eq('status', 'disponivel').select('id').maybeSingle();
        flashOk = Boolean(f);
      }
      if (flashOk) {
        const { data: u, error } = await db.from('appointments').update({ status: 'confirmado', payment_status: 'aprovado', hold_expires_at: null })
          .eq('id', appt.id).in('status', ['expirado', 'cancelado']).select('*').maybeSingle();
        if (!error && u) {
          await appointmentEvent(appt.id, 'reconciliado', 'sistema', { payment_id: p.id });
          await notify('agendamento_confirmado', { appointment: u as Appointment, tz, artistName });
          return 'reativado';
        }
        if (appt.flash_project_id) await db.rpc('release_flash_if_free', { p_flash: appt.flash_project_id });
      }
      await db.from('appointments').update({
        payment_status: 'aprovado', needs_attention: true,
        attention_reason: 'Pagamento aprovado após a reserva expirar e o horário/projeto já foi atribuído a outra pessoa. Ofereça novo horário ou reembolse.'
      }).eq('id', appt.id);
      await notify('aviso_admin', { appointment: appt, tz, artistName, extra: 'Pagamento tardio precisa de reconciliação' });
      return 'conflito_reconciliacao';
    }
    if (appt.payment_status !== 'aprovado') await db.from('appointments').update({ payment_status: 'aprovado' }).eq('id', appt.id);
    return 'atualizado';
  }

  if (status === 'reembolsado') {
    if (appt.payment_status !== 'reembolsado') {
      const nextStatus = appt.status === 'concluido' ? 'concluido' : 'cancelado';
      const { data: u } = await db.from('appointments').update({ payment_status: 'reembolsado', status: nextStatus, needs_attention: false }).eq('id', appt.id).select('*').single();
      if (appt.flash_project_id) await db.rpc('release_flash_if_free', { p_flash: appt.flash_project_id });
      await notify('reembolso', { appointment: u as Appointment, tz, artistName, extra: 'Seu reembolso foi processado pelo Mercado Pago.' });
    }
    return 'reembolsado';
  }

  // pendente, em análise, recusado ou cancelado: não confirma nada; a reserva segue até o prazo
  if (appt.status === 'aguardando_pagamento' && appt.payment_status !== status) {
    await db.from('appointments').update({ payment_status: status as PaymentStatus }).eq('id', appt.id).eq('status', 'aguardando_pagamento');
  }
  return status;
}

/** Consulta o Mercado Pago e aplica todos os pagamentos de um agendamento. */
export async function refreshFromProvider(appointmentId: string): Promise<number> {
  if (!integrations.payments()) return 0;
  const list = await searchPaymentsByReference(appointmentId);
  // aplica do mais antigo para o mais novo
  for (const p of list.slice().reverse()) await applyPayment(p);
  return list.length;
}

export async function applyPaymentById(id: string): Promise<string> {
  return applyPayment(await getPayment(id));
}

/**
 * Libera reservas temporárias vencidas, validando antes o estado real no Mercado Pago.
 * Pagamentos pendentes recebem 15 minutos de tolerância.
 */
export async function reconcileStaleHolds(artistId?: string): Promise<{ expired: number; confirmed: number }> {
  const db = serviceClient();
  let q = db.from('appointments').select('*').eq('status', 'aguardando_pagamento').lt('hold_expires_at', new Date().toISOString()).limit(50);
  if (artistId) q = q.eq('artist_id', artistId);
  const { data } = await q;
  let expired = 0, confirmed = 0;
  const { tz, artistName } = await ctx();
  for (const appt of (data ?? []) as Appointment[]) {
    let pending = false;
    try {
      const list = integrations.payments() ? await searchPaymentsByReference(appt.id) : [];
      for (const p of list.slice().reverse()) {
        const r = await applyPayment(p);
        if (r === 'confirmado') confirmed++;
      }
      pending = list.some((p) => ['pending', 'in_process', 'authorized'].includes(p.status));
    } catch (e) {
      // sem confirmação do provedor não libera, a menos que a reserva esteja muito antiga
      console.error('reconcile', appt.id, (e as Error).message);
      if (Date.now() - new Date(appt.hold_expires_at!).getTime() < 24 * 3600000) continue;
    }
    const grace = pending ? 15 * 60000 : 0;
    if (Date.now() < new Date(appt.hold_expires_at!).getTime() + grace) continue;
    const { data: u } = await db.from('appointments').update({ status: 'expirado', payment_status: 'expirado' })
      .eq('id', appt.id).eq('status', 'aguardando_pagamento').select('*').maybeSingle();
    if (u) {
      expired++;
      if (appt.flash_project_id) await db.rpc('release_flash_if_free', { p_flash: appt.flash_project_id });
      await notify('reserva_expirada', { appointment: u as Appointment, tz, artistName });
    }
  }
  return { expired, confirmed };
}

/** Cancela um agendamento. Com refund=true, pede o reembolso do pagamento aprovado. */
export async function cancelAppointment(appt: Appointment, opts: { refund: boolean; actor: string; reason?: string }) {
  const db = serviceClient();
  const { tz, artistName } = await ctx();
  let paymentStatus: PaymentStatus = appt.payment_status === 'aprovado' ? 'aprovado' : appt.payment_status === 'pendente' ? 'cancelado' : appt.payment_status;
  if (opts.refund && appt.payment_status === 'aprovado') {
    const { data: pays } = await db.from('payments').select('provider_payment_id').eq('appointment_id', appt.id).eq('status', 'aprovado');
    for (const p of pays ?? []) {
      if (p.provider_payment_id) await refundPayment(p.provider_payment_id, null, `refund-${appt.id}-${p.provider_payment_id}`);
    }
    paymentStatus = 'reembolso_solicitado';
  }
  const { data: u } = await db.from('appointments').update({ status: 'cancelado', payment_status: paymentStatus, hold_expires_at: null })
    .eq('id', appt.id).not('status', 'in', '(cancelado,concluido)').select('*').maybeSingle();
  if (!u) throw new BookingError('JA_ENCERRADO', 'Este agendamento já está encerrado.');
  await appointmentEvent(appt.id, 'cancelamento', opts.actor, { refund: opts.refund, reason: opts.reason ?? '' });
  if (appt.flash_project_id) await db.rpc('release_flash_if_free', { p_flash: appt.flash_project_id });
  const extra = paymentStatus === 'reembolso_solicitado'
    ? 'O reembolso do valor pago foi solicitado e aparece no mesmo meio de pagamento em alguns dias.'
    : appt.payment_status === 'aprovado' ? 'Conforme a política de cancelamento, o sinal não é devolvido.' : 'Nenhuma cobrança foi feita.';
  await notify('cancelamento', { appointment: u as Appointment, tz, artistName, extra });
  return u as Appointment;
}

export function hoursUntil(iso: string | null): number {
  return iso ? (new Date(iso).getTime() - Date.now()) / 3600000 : Infinity;
}
