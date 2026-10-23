-- =====================================================================
-- Tattoin Line — esquema inicial
-- Um artista proprietário na V1; tudo é vinculado a artist_id para permitir
-- expansão futura sem reconstrução.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

-- ---------- Tipos ----------
create type public.appointment_status as enum (
  'solicitado',              -- orçamento aguardando avaliação do artista
  'aguardando_pagamento',    -- horário segurado temporariamente
  'confirmado',
  'reagendamento_solicitado',
  'cancelado',
  'expirado',
  'concluido'
);

create type public.payment_status as enum (
  'nao_iniciado',
  'pendente',
  'em_analise',
  'aprovado',
  'recusado',
  'cancelado',
  'expirado',
  'reembolso_solicitado',
  'reembolsado'
);

create type public.flash_status as enum ('disponivel', 'reservado', 'vendido', 'arquivado');
create type public.service_kind as enum ('personalizada', 'projeto', 'consulta');
create type public.publish_status as enum ('rascunho', 'publicado', 'arquivado');

-- ---------- Artista e perfis ----------
create table public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  timezone text not null default 'America/Recife',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

create table public.site_settings (
  artist_id uuid primary key references public.artists (id) on delete cascade,
  hero_title text not null default 'Arte que fica pra vida toda.',
  hero_subtitle text not null default '',
  about text not null default '',
  specialties text[] not null default '{}',
  accent_color text not null default '#a3342a' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  contact_email text,
  whatsapp text,
  instagram text,
  address text,
  city text,
  business_info text,
  deposit_percent int not null default 30 check (deposit_percent between 0 and 100),
  deposit_min_cents int not null default 10000 check (deposit_min_cents >= 0),
  allow_full_payment boolean not null default true,
  hold_minutes int not null default 30 check (hold_minutes between 10 and 1440),
  buffer_minutes int not null default 30 check (buffer_minutes between 0 and 240),
  min_session_cents int not null default 30000,
  hourly_rate_cents int,
  consult_enabled boolean not null default true,
  consult_price_cents int not null default 8000,
  consult_minutes int not null default 30,
  size_tiers jsonb not null default '[]',
  payment_methods_text text not null default 'PIX e cartão de crédito pelo Mercado Pago.',
  quote_rules_text text not null default '',
  cancellation_policy text not null default '',
  privacy_policy text not null default '',
  reschedule_min_hours int not null default 72,
  booking_window_days int not null default 90,
  updated_at timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table public.tattoo_styles (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  description text not null default '',
  sort int not null default 0,
  unique (artist_id, slug)
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  style_id uuid references public.tattoo_styles (id) on delete set null,
  body_region text,
  description text not null default '',
  year int check (year between 1990 and 2100),
  status public.publish_status not null default 'rascunho',
  featured boolean not null default false,
  client_consent boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_id, slug),
  -- só publica com autorização do cliente registrada
  constraint publish_requires_consent check (status <> 'publicado' or client_consent)
);

create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.portfolio_items (id) on delete cascade,
  storage_path text not null,
  alt text not null check (length(alt) between 3 and 300),
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table public.flash_projects (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  style_id uuid references public.tattoo_styles (id) on delete set null,
  description text not null default '',
  size_label text not null,
  body_region text,
  price_cents int not null check (price_cents > 0),
  duration_minutes int not null check (duration_minutes between 15 and 720),
  status public.flash_status not null default 'disponivel',
  image_path text,
  image_alt text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_id, slug)
);

-- ---------- Agenda ----------
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete restrict,
  -- token longo e aleatório para a página do cliente (nunca sequencial)
  public_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  customer_name text not null check (length(customer_name) between 3 and 120),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text not null check (length(customer_phone) between 10 and 20),
  service public.service_kind not null,
  flash_project_id uuid references public.flash_projects (id) on delete restrict,
  style text,
  body_region text,
  size_label text,
  idea text,
  reference_paths text[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes int,
  buffer_minutes int not null default 0,
  blocked_range tstzrange,
  -- cópia dos valores no momento da reserva (não muda se a tabela de preços mudar)
  total_cents int,
  deposit_cents int,
  balance_cents int,
  amount_due_cents int,
  is_estimate boolean not null default false,
  charge_mode text check (charge_mode in ('sinal', 'integral')),
  terms_snapshot jsonb not null,
  accepted_terms_at timestamptz not null,
  status public.appointment_status not null,
  payment_status public.payment_status not null default 'nao_iniciado',
  hold_expires_at timestamptz,
  mp_preference_id text,
  mp_checkout_url text,
  needs_attention boolean not null default false,
  attention_reason text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (service <> 'projeto' or flash_project_id is not null),
  check (status in ('solicitado', 'cancelado', 'expirado') or starts_at is not null),
  -- impede dois atendimentos ativos no mesmo intervalo (inclui o intervalo entre sessões)
  constraint appointments_no_overlap exclude using gist (artist_id with =, blocked_range with &&)
    where (status in ('aguardando_pagamento', 'confirmado', 'reagendamento_solicitado') and blocked_range is not null)
);

create index appointments_artist_starts on public.appointments (artist_id, starts_at);
create index appointments_status on public.appointments (status, hold_expires_at);
-- um projeto autoral só pode ter um agendamento ativo por vez
create unique index appointments_one_active_per_flash on public.appointments (flash_project_id)
  where flash_project_id is not null and status in ('aguardando_pagamento', 'confirmado', 'reagendamento_solicitado');

create table public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  type text not null,
  from_status text,
  to_status text,
  actor text not null default 'sistema',
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index appointment_events_appt on public.appointment_events (appointment_id, created_at);

-- ---------- Pagamentos ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete restrict,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  preference_id text,
  status public.payment_status not null,
  provider_status text,
  provider_status_detail text,
  amount_cents int not null,
  method text,
  live_mode boolean,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index payments_appt on public.payments (appointment_id);

create table public.payment_events (
  id bigint generated always as identity primary key,
  provider text not null default 'mercadopago',
  request_id text,
  topic text,
  resource_id text,
  signature_valid boolean not null,
  payload jsonb not null,
  result text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, request_id)
);

create table public.customer_notifications (
  id bigint generated always as identity primary key,
  appointment_id uuid references public.appointments (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp')),
  template text not null,
  recipient text not null,
  status text not null check (status in ('enviado', 'falhou', 'nao_configurado')),
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  artist_id uuid references public.artists (id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Gatilhos ----------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger t_settings before update on public.site_settings for each row execute function public.touch_updated_at();
create trigger t_portfolio before update on public.portfolio_items for each row execute function public.touch_updated_at();
create trigger t_flash before update on public.flash_projects for each row execute function public.touch_updated_at();
create trigger t_appointments before update on public.appointments for each row execute function public.touch_updated_at();
create trigger t_payments before update on public.payments for each row execute function public.touch_updated_at();

-- mantém o intervalo bloqueado (sessão + intervalo entre sessões)
create or replace function public.appointments_set_range() returns trigger language plpgsql as $$
begin
  if new.starts_at is null or new.ends_at is null then
    new.blocked_range := null;
  else
    new.blocked_range := tstzrange(new.starts_at, new.ends_at + make_interval(mins => new.buffer_minutes), '[)');
  end if;
  return new;
end $$;
create trigger t_appointments_range before insert or update of starts_at, ends_at, buffer_minutes
  on public.appointments for each row execute function public.appointments_set_range();

-- registra toda mudança de status
create or replace function public.appointments_log_status() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_events (appointment_id, type, to_status, data)
    values (new.id, 'criado', new.status::text, jsonb_build_object('payment_status', new.payment_status));
  elsif new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    insert into public.appointment_events (appointment_id, type, from_status, to_status, data)
    values (new.id, 'status', old.status::text, new.status::text,
            jsonb_build_object('payment_from', old.payment_status, 'payment_to', new.payment_status));
  end if;
  return new;
end $$;
create trigger t_appointments_log after insert or update on public.appointments
  for each row execute function public.appointments_log_status();

-- ---------- Reserva temporária (atômica) ----------
-- Chamada somente pelo servidor (service role). Valida horário de atendimento,
-- bloqueios e disponibilidade do projeto, e cria o agendamento numa transação.
create or replace function public.create_booking_hold(
  p_artist uuid,
  p_service public.service_kind,
  p_flash uuid,
  p_starts timestamptz,
  p_duration int,
  p_buffer int,
  p_hold_minutes int,
  p_customer jsonb,
  p_details jsonb,
  p_pricing jsonb,
  p_terms jsonb
) returns public.appointments
language plpgsql security definer set search_path = public as $$
declare
  v_tz text;
  v_local timestamp;
  v_end timestamptz;
  v_flash public.flash_projects;
  v_row public.appointments;
  v_status public.appointment_status;
begin
  -- serializa reservas do mesmo artista
  perform pg_advisory_xact_lock(hashtext(p_artist::text));

  select timezone into v_tz from public.artists where id = p_artist;
  if v_tz is null then raise exception 'ARTISTA_INVALIDO'; end if;

  if p_starts is not null then
    if p_starts < now() + interval '2 hours' then raise exception 'HORARIO_PASSADO'; end if;
    v_end := p_starts + make_interval(mins => p_duration);
    v_local := p_starts at time zone v_tz;
    -- precisa caber inteiro numa janela de atendimento do dia
    if not exists (
      select 1 from public.availability_rules r
      where r.artist_id = p_artist
        and r.weekday = extract(dow from v_local)::int
        and v_local::time >= r.start_time
        and (v_end at time zone v_tz)::time <= r.end_time
        and (v_end at time zone v_tz)::date = v_local::date
    ) then raise exception 'FORA_DO_HORARIO'; end if;
    if exists (
      select 1 from public.blocked_slots b
      where b.artist_id = p_artist and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts, v_end, '[)')
    ) then raise exception 'HORARIO_BLOQUEADO'; end if;
  end if;

  if p_service = 'projeto' then
    select * into v_flash from public.flash_projects where id = p_flash and artist_id = p_artist for update;
    if not found or v_flash.status <> 'disponivel' then raise exception 'PROJETO_INDISPONIVEL'; end if;
    if (p_pricing->>'total_cents')::int <> v_flash.price_cents then raise exception 'VALOR_DIVERGENTE'; end if;
    update public.flash_projects set status = 'reservado' where id = v_flash.id;
  end if;

  v_status := case when p_starts is null then 'solicitado'::public.appointment_status else 'aguardando_pagamento'::public.appointment_status end;

  insert into public.appointments (
    artist_id, customer_name, customer_email, customer_phone, service, flash_project_id,
    style, body_region, size_label, idea, reference_paths,
    starts_at, ends_at, duration_minutes, buffer_minutes,
    total_cents, deposit_cents, balance_cents, amount_due_cents, is_estimate, charge_mode,
    terms_snapshot, accepted_terms_at, status, payment_status, hold_expires_at
  ) values (
    p_artist, p_customer->>'name', lower(p_customer->>'email'), p_customer->>'phone', p_service, p_flash,
    p_details->>'style', p_details->>'body_region', p_details->>'size_label', p_details->>'idea',
    coalesce(array(select jsonb_array_elements_text(p_details->'reference_paths')), '{}'),
    p_starts, v_end, p_duration, coalesce(p_buffer, 0),
    (p_pricing->>'total_cents')::int, (p_pricing->>'deposit_cents')::int, (p_pricing->>'balance_cents')::int,
    (p_pricing->>'amount_due_cents')::int, coalesce((p_pricing->>'is_estimate')::boolean, false), p_pricing->>'charge_mode',
    p_terms, now(), v_status,
    case when p_starts is null then 'nao_iniciado'::public.payment_status else 'pendente'::public.payment_status end,
    case when p_starts is null then null else now() + make_interval(mins => p_hold_minutes) end
  ) returning * into v_row;

  return v_row;
exception
  when exclusion_violation then raise exception 'HORARIO_OCUPADO';
  when unique_violation then raise exception 'PROJETO_INDISPONIVEL';
end $$;

revoke all on function public.create_booking_hold from public, anon, authenticated;

-- libera o projeto autoral quando não há agendamento ativo
create or replace function public.release_flash_if_free(p_flash uuid) returns void
language sql security definer set search_path = public as $$
  update public.flash_projects f set status = 'disponivel'
  where f.id = p_flash and f.status = 'reservado'
    and not exists (
      select 1 from public.appointments a
      where a.flash_project_id = p_flash and a.status in ('aguardando_pagamento', 'confirmado', 'reagendamento_solicitado')
    );
$$;
revoke all on function public.release_flash_if_free from public, anon, authenticated;

-- ---------- Segurança (RLS) ----------
create or replace function public.is_artist_admin(p_artist uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.artist_id = p_artist);
$$;

alter table public.artists enable row level security;
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.tattoo_styles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.flash_projects enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.admin_audit_log enable row level security;

-- leitura pública apenas do conteúdo do site
create policy "public read artists" on public.artists for select using (true);
create policy "public read settings" on public.site_settings for select using (true);
create policy "public read styles" on public.tattoo_styles for select using (true);
create policy "public read published items" on public.portfolio_items for select using (status = 'publicado' or public.is_artist_admin(artist_id));
create policy "public read images of published" on public.portfolio_images for select using (
  exists (select 1 from public.portfolio_items i where i.id = item_id and (i.status = 'publicado' or public.is_artist_admin(i.artist_id))));
create policy "public read flash" on public.flash_projects for select using (status <> 'arquivado' or public.is_artist_admin(artist_id));
create policy "public read availability" on public.availability_rules for select using (true);

-- administração: somente o responsável autorizado
create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "admin settings" on public.site_settings for all using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
create policy "admin styles" on public.tattoo_styles for all using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
create policy "admin items" on public.portfolio_items for all using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
create policy "admin images" on public.portfolio_images for all using (
  exists (select 1 from public.portfolio_items i where i.id = item_id and public.is_artist_admin(i.artist_id)))
  with check (exists (select 1 from public.portfolio_items i where i.id = item_id and public.is_artist_admin(i.artist_id)));
create policy "admin flash" on public.flash_projects for all using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
create policy "admin availability" on public.availability_rules for all using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
create policy "admin blocked" on public.blocked_slots for all using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));
create policy "admin read appointments" on public.appointments for select using (public.is_artist_admin(artist_id));
create policy "admin read events" on public.appointment_events for select using (
  exists (select 1 from public.appointments a where a.id = appointment_id and public.is_artist_admin(a.artist_id)));
create policy "admin read payments" on public.payments for select using (
  exists (select 1 from public.appointments a where a.id = appointment_id and public.is_artist_admin(a.artist_id)));
create policy "admin read notifications" on public.customer_notifications for select using (
  exists (select 1 from public.appointments a where a.id = appointment_id and public.is_artist_admin(a.artist_id)));
create policy "admin read audit" on public.admin_audit_log for select using (public.is_artist_admin(artist_id));
-- appointments, payments e eventos são escritos apenas pelo servidor (service role).

-- ---------- Armazenamento ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio', 'portfolio', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('referencias', 'referencias', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin write portfolio bucket" on storage.objects for all
  using (bucket_id = 'portfolio' and exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (bucket_id = 'portfolio' and exists (select 1 from public.profiles p where p.id = auth.uid()));
create policy "admin read references" on storage.objects for select
  using (bucket_id = 'referencias' and exists (select 1 from public.profiles p where p.id = auth.uid()));
-- uploads de referências usam URL assinada criada pelo servidor
