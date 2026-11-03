-- =====================================================================
-- Página inicial: seções "Simulador" e "Sobre o artista" (redesign, etapa 05).
-- Só adiciona colunas, sem valor obrigatório: nada existente muda.
-- =====================================================================

alter table public.site_settings
  -- frase curta de apresentação do artista, mostrada abaixo do nome
  add column about_headline text check (about_headline is null or length(about_headline) <= 160),
  -- imagem demonstrativa da faixa do simulador (enviada pelo artista no painel)
  add column sim_image_path text,
  add column sim_image_alt text check (sim_image_alt is null or length(sim_image_alt) <= 300);
