-- =====================================================================
-- Primeira dobra da página inicial (redesign, etapa 03).
-- Só adiciona colunas, todas com valor padrão: nada existente muda.
-- =====================================================================

alter table public.site_settings
  -- texto pequeno acima do título (vazio = usa o nome do site)
  add column hero_eyebrow text check (hero_eyebrow is null or length(hero_eyebrow) <= 60),
  -- 'lateral': foto ocupa a lateral direita · 'fundo': foto atrás de todo o conteúdo
  add column hero_layout text not null default 'lateral' check (hero_layout in ('lateral', 'fundo')),
  -- escurecimento sobre a foto, em %
  add column hero_overlay smallint not null default 30 check (hero_overlay between 0 and 85),
  -- ponto de foco da foto (posição do enquadramento), em % da largura e da altura
  add column hero_focus_x smallint not null default 50 check (hero_focus_x between 0 and 100),
  add column hero_focus_y smallint not null default 50 check (hero_focus_y between 0 and 100),
  -- aproximação da foto, em % (100 = sem zoom)
  add column hero_zoom smallint not null default 100 check (hero_zoom between 100 and 200);

-- título do exemplo novo para instalações que ainda usam o texto padrão antigo
update public.site_settings
  set hero_title = E'Arte na pele.\nCom propósito.'
  where hero_title = 'Arte que fica pra vida toda.';
