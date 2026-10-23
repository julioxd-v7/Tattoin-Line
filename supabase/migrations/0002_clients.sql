-- =====================================================================
-- Clientes: cadastro simples pelo site, ficha completa depois e
-- criação automática a partir dos agendamentos.
-- Dados de saúde são sensíveis (LGPD, art. 11): só com consentimento.
-- =====================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  full_name text not null check (length(full_name) between 3 and 120),
  phone text not null check (phone ~ '^[0-9]{10,15}$'),            -- só dígitos, com DDD
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  birth_date date check (birth_date is null or birth_date > date '1900-01-01'),
  instagram text check (instagram is null or length(instagram) <= 60),
  -- saúde (opcional; exige consentimento registrado)
  allergies text check (allergies is null or length(allergies) <= 1000),
  medications text check (medications is null or length(medications) <= 1000),
  conditions text check (conditions is null or length(conditions) <= 1000),
  health_notes text check (health_notes is null or length(health_notes) <= 2000),
  health_consent_at timestamptz,
  -- somente o artista vê
  internal_notes text check (internal_notes is null or length(internal_notes) <= 5000),
  source text not null default 'painel' check (source in ('site', 'agendamento', 'painel')),
  ficha_token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  ficha_completed_at timestamptz,
  privacy_accepted_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (artist_id, phone),
  constraint health_requires_consent check (
    health_consent_at is not null
    or (allergies is null and medications is null and conditions is null and health_notes is null)
  )
);

create index clients_artist_name on public.clients (artist_id, lower(full_name));
create index clients_artist_email on public.clients (artist_id, lower(email));

create trigger t_clients before update on public.clients for each row execute function public.touch_updated_at();

alter table public.appointments add column client_id uuid references public.clients (id) on delete set null;
create index appointments_client on public.appointments (client_id);

alter table public.clients enable row level security;
create policy "admin clients" on public.clients for all
  using (public.is_artist_admin(artist_id)) with check (public.is_artist_admin(artist_id));

-- Cria ou atualiza o cliente pelo telefone (chamado só pelo servidor).
-- Nunca apaga dados já preenchidos: só completa o que estiver vazio.
create or replace function public.upsert_client(
  p_artist uuid, p_name text, p_phone text, p_email text, p_source text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.clients (artist_id, full_name, phone, email, source)
  values (p_artist, p_name, p_phone, nullif(lower(p_email), ''), p_source)
  on conflict (artist_id, phone) do update
    set email = coalesce(public.clients.email, excluded.email),
        full_name = case when length(excluded.full_name) > length(public.clients.full_name) then excluded.full_name else public.clients.full_name end
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.upsert_client from public, anon, authenticated;
