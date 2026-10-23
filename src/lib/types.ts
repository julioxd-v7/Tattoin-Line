import type { SizeTier } from './pricing';

export type AppointmentStatus = 'solicitado' | 'aguardando_pagamento' | 'confirmado' | 'reagendamento_solicitado' | 'cancelado' | 'expirado' | 'concluido';
export type PaymentStatus = 'nao_iniciado' | 'pendente' | 'em_analise' | 'aprovado' | 'recusado' | 'cancelado' | 'expirado' | 'reembolso_solicitado' | 'reembolsado';
export type FlashStatus = 'disponivel' | 'reservado' | 'vendido' | 'arquivado';

export interface Artist { id: string; slug: string; name: string; timezone: string }

export interface Settings {
  artist_id: string;
  hero_title: string; hero_subtitle: string; about: string; specialties: string[];
  accent_color: string; contact_email: string | null; whatsapp: string | null; instagram: string | null;
  address: string | null; city: string | null; business_info: string | null;
  deposit_percent: number; deposit_min_cents: number; allow_full_payment: boolean;
  hold_minutes: number; buffer_minutes: number; min_session_cents: number; hourly_rate_cents: number | null;
  consult_enabled: boolean; consult_price_cents: number; consult_minutes: number;
  size_tiers: SizeTier[]; payment_methods_text: string; quote_rules_text: string;
  cancellation_policy: string; privacy_policy: string; reschedule_min_hours: number; booking_window_days: number;
  hero_image_path: string | null; hero_image_alt: string | null; hero_caption: string | null;
  about_image_path: string | null; about_image_alt: string | null; home_works: string[]; home_flash: string[];
  brand_name: string; seo_description: string | null; home_instagram: string[]; whatsapp_message: string | null;
}

export interface Testimonial {
  id: string; author_name: string; body: string; rating: number | null; work_id: string | null; source: string | null;
  consent_at: string; published: boolean; sort: number; created_at: string;
}

export interface Style { id: string; slug: string; name: string; description: string; sort: number }

export interface PortfolioImage { id: string; storage_path: string; alt: string; sort: number }
export interface PortfolioItem {
  id: string; slug: string; title: string; style_id: string | null; body_region: string | null;
  description: string; year: number | null; status: 'rascunho' | 'publicado' | 'arquivado';
  featured: boolean; client_consent: boolean; sort: number;
  style?: Style | null; images: PortfolioImage[];
}

export interface FlashProject {
  id: string; slug: string; name: string; style_id: string | null; description: string; size_label: string;
  body_region: string | null; price_cents: number; duration_minutes: number; status: FlashStatus;
  image_path: string | null; image_alt: string | null; sort: number; style?: Style | null;
  simulation_image_path?: string | null; simulation_enabled?: boolean;
}

export interface Appointment {
  id: string; artist_id: string; public_token: string; customer_name: string; customer_email: string; customer_phone: string;
  service: 'personalizada' | 'projeto' | 'consulta'; flash_project_id: string | null; style: string | null; body_region: string | null;
  size_label: string | null; idea: string | null; reference_paths: string[]; starts_at: string | null; ends_at: string | null;
  duration_minutes: number | null; buffer_minutes: number; total_cents: number | null; deposit_cents: number | null;
  balance_cents: number | null; amount_due_cents: number | null; is_estimate: boolean; charge_mode: 'sinal' | 'integral' | null;
  terms_snapshot: Record<string, unknown>; status: AppointmentStatus; payment_status: PaymentStatus; hold_expires_at: string | null;
  mp_preference_id: string | null; mp_checkout_url: string | null; needs_attention: boolean; attention_reason: string | null;
  reminder_sent_at: string | null; created_at: string; updated_at: string; client_id?: string | null;
  source?: 'site' | 'simulador' | 'painel';
}

export interface Payment {
  id: string; appointment_id: string; provider_payment_id: string | null; status: PaymentStatus; provider_status: string | null;
  provider_status_detail: string | null; amount_cents: number; method: string | null; live_mode: boolean | null; created_at: string; updated_at: string;
}

export const APPOINTMENT_LABEL: Record<AppointmentStatus, string> = {
  solicitado: 'Aguardando avaliação',
  aguardando_pagamento: 'Aguardando pagamento',
  confirmado: 'Confirmado',
  reagendamento_solicitado: 'Reagendamento solicitado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
  concluido: 'Concluído'
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  nao_iniciado: 'Não iniciado',
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
  reembolso_solicitado: 'Reembolso solicitado',
  reembolsado: 'Reembolsado'
};

export const FLASH_LABEL: Record<FlashStatus, string> = { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Já tatuado', arquivado: 'Arquivado' };

/** Status financeiros que contam como receita no painel. */
export const REVENUE_PAYMENT_STATUSES: PaymentStatus[] = ['aprovado'];
/** Status que ocupam a agenda. */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ['aguardando_pagamento', 'confirmado', 'reagendamento_solicitado'];
