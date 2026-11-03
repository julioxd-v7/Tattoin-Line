-- =====================================================================
-- Rodapé: outras redes sociais do artista (redesign, etapa 07).
-- Só adiciona colunas opcionais: nada existente muda.
-- Aceitam link completo (https://…) ou @perfil; o site monta o link.
-- =====================================================================

alter table public.site_settings
  add column social_tiktok text check (social_tiktok is null or length(social_tiktok) <= 200),
  add column social_youtube text check (social_youtube is null or length(social_youtube) <= 200),
  add column social_facebook text check (social_facebook is null or length(social_facebook) <= 200);
