import { z } from 'zod';

const phone = z.string().trim().transform((v) => v.replace(/[^\d+]/g, '')).refine((v) => v.replace(/\D/g, '').length >= 10 && v.length <= 16, 'Informe o WhatsApp com DDD.');

export const customerSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(160),
  phone
});

export const bookingSchema = z.object({
  service: z.enum(['personalizada', 'projeto', 'consulta']),
  flashSlug: z.string().max(80).optional().nullable(),
  sizeId: z.string().max(10).optional().nullable(),
  chargeMode: z.enum(['sinal', 'integral']).default('sinal'),
  startsAt: z.string().datetime().optional().nullable(),
  customer: customerSchema,
  style: z.string().trim().max(60).optional().nullable(),
  bodyRegion: z.string().trim().max(80).optional().nullable(),
  idea: z.string().trim().max(2000).optional().nullable(),
  referencePaths: z.array(z.string().regex(/^tmp\/[0-9a-f-]{36}\/[a-z0-9._-]{1,80}$/i)).max(5).default([]),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'É preciso concordar com as condições.' }) }),
  origin: z.enum(['site', 'simulador']).default('site'),
  website: z.string().max(0).optional() // honeypot: precisa ficar vazio
}).superRefine((v, ctx) => {
  if (v.service === 'projeto' && !v.flashSlug) ctx.addIssue({ code: 'custom', path: ['flashSlug'], message: 'Escolha um projeto.' });
  if (v.service === 'personalizada' && !v.sizeId) ctx.addIssue({ code: 'custom', path: ['sizeId'], message: 'Informe o tamanho.' });
  if (v.service !== 'projeto' && (!v.idea || v.idea.length < 10)) ctx.addIssue({ code: 'custom', path: ['idea'], message: 'Descreva a ideia em pelo menos uma frase.' });
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const clientRequestSchema = z.object({
  action: z.enum(['reagendar', 'cancelar']),
  email: z.string().trim().toLowerCase().email(),
  message: z.string().trim().max(1000).optional().default('')
});

// ---------- Clientes ----------
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));

export const signupSchema = z.object({
  name: z.string().trim().min(5, 'Informe seu nome completo.').max(120).refine((v) => v.includes(' '), 'Informe nome e sobrenome.'),
  phone: z.string().trim().refine((v) => { const d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13; }, 'Informe o telefone com DDD.'),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'É preciso aceitar a política de privacidade.' }) }),
  website: z.string().max(0).optional()
});

export const fichaSchema = z.object({
  name: z.string().trim().min(5, 'Informe seu nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(160).or(z.literal('')).transform((v) => v || null),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').or(z.literal('')).transform((v) => v || null),
  instagram: optText(60),
  allergies: optText(1000),
  medications: optText(1000),
  conditions: optText(1000),
  healthNotes: optText(2000),
  healthConsent: z.boolean().default(false)
}).superRefine((v, ctx) => {
  const hasHealth = v.allergies || v.medications || v.conditions || v.healthNotes;
  if (hasHealth && !v.healthConsent) ctx.addIssue({ code: 'custom', path: ['healthConsent'], message: 'Para guardar dados de saúde, marque o consentimento.' });
  if (v.birthDate) {
    const d = new Date(v.birthDate + 'T12:00:00Z');
    if (Number.isNaN(d.getTime()) || d > new Date() || d.getUTCFullYear() < 1900) ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'Data de nascimento inválida.' });
  }
});
export type FichaInput = z.infer<typeof fichaSchema>;
