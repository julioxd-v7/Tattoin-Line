-- Página inicial montada pelo artista: cada espaço só aparece quando ele envia/escolhe uma arte.
alter table public.site_settings
  add column hero_image_path text,
  add column hero_image_alt text check (hero_image_alt is null or length(hero_image_alt) <= 300),
  add column hero_caption text check (hero_caption is null or length(hero_caption) <= 120),
  add column about_image_path text,
  add column about_image_alt text check (about_image_alt is null or length(about_image_alt) <= 300),
  add column home_works uuid[] not null default '{}' check (cardinality(home_works) <= 8),
  add column home_flash uuid[] not null default '{}' check (cardinality(home_flash) <= 8);
