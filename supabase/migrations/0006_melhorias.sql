-- =====================================================================
-- Melhorias: identidade editável, faixa do Instagram, depoimentos,
-- saldo recebido no estúdio e limite de tentativas compartilhado.
-- =====================================================================

-- Identidade do site (nada fixo no código)
alter table public.site_settings
  add column brand_name text not null default 'Tattoin Line' check (length(brand_name) between 2 and 60),
  add column seo_description text check (seo_description is null or length(seo_description) <= 300),
  add column home_instagram uuid[] not null default '{}',
  add column whatsapp_message text check (whatsapp_message is null or length(whatsapp_message) <= 300);

-- Saldo pago no estúdio (para o resumo financeiro)
alter table public.appointments add column balance_paid_at timestamptz;

-- Depoimentos reais, cadastrados pelo artista com autorização do cliente
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  author_name text not null check (length(author_name) between 2 and 80),
  body text not null check (length(body) between 10 and 600),
  rating smallint check (rating is null or rating between 1 and 5),
  work_id uuid references public.portfolio_items (id) on delete set null,
  source text check (source is null or length(source) <= 80),        -- ex.: "Google", "Instagram"
  consent_at timestamptz not null,                                   -- autorização para publicar
  published boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index testimonials_artist on public.testimonials (artist_id, published, sort);
alter table public.testimonials enable row level security;
create policy "admin testimonials" on public.testimonials for all
  using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
grant all on public.testimonials to service_role;
grant select, insert, update, delete on public.testimonials to authenticated;

-- Limite de tentativas compartilhado entre servidores (anti-spam).
-- A chave já chega com o IP embaralhado (hash), nunca o IP puro.
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 1,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security; -- sem políticas: só o servidor acessa
grant all on public.rate_limits to service_role;

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
begin
  insert into public.rate_limits (key, window_start) values (p_key, v_start)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
revoke all on function public.rate_limit_hit from public, anon, authenticated;
grant execute on function public.rate_limit_hit to service_role;
