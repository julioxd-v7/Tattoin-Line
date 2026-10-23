import { APPOINTMENT_LABEL, PAYMENT_LABEL, type AppointmentStatus, type PaymentStatus } from '@/lib/types';

const A: Record<AppointmentStatus, string> = { solicitado: 'tag-info', aguardando_pagamento: 'tag-warn', confirmado: 'tag-ok', reagendamento_solicitado: 'tag-info', cancelado: 'tag-off', expirado: 'tag-off', concluido: 'tag-ok' };
const P: Record<PaymentStatus, string> = { nao_iniciado: 'tag-off', pendente: 'tag-warn', em_analise: 'tag-warn', aprovado: 'tag-ok', recusado: 'tag-bad', cancelado: 'tag-off', expirado: 'tag-off', reembolso_solicitado: 'tag-info', reembolsado: 'tag-info' };

export const AppointmentTag = ({ s }: { s: AppointmentStatus }) => <span className={`tag ${A[s]}`}>{APPOINTMENT_LABEL[s]}</span>;
export const PaymentTag = ({ s }: { s: PaymentStatus }) => <span className={`tag ${P[s]}`}>{PAYMENT_LABEL[s]}</span>;
