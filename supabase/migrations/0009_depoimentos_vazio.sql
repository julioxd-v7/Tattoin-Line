-- =====================================================================
-- Depoimentos na página inicial (redesign, etapa 06).
-- Só adiciona uma coluna com valor padrão: nada existente muda.
-- =====================================================================

alter table public.site_settings
  -- sem depoimentos publicados: false = esconde a seção (padrão) · true = mostra a seção com aviso discreto
  add column testimonials_show_empty boolean not null default false;
