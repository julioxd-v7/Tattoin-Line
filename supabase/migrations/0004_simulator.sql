-- =====================================================================
-- Simulador de tatuagens: imagem própria para sobreposição em cada projeto
-- e preferências (opcionais) levadas ao agendamento.
-- A foto do cliente NUNCA é enviada ao servidor nesta versão.
-- =====================================================================

alter table public.flash_projects
  add column simulation_image_path text,
  add column simulation_enabled boolean not null default true;

alter table public.appointments
  add column source text not null default 'site' check (source in ('site', 'simulador', 'painel')),
  add column simulation_prefs jsonb check (
    simulation_prefs is null or (
      jsonb_typeof(simulation_prefs) = 'object'
      and (simulation_prefs->>'x')::numeric between 0 and 1
      and (simulation_prefs->>'y')::numeric between 0 and 1
      and (simulation_prefs->>'scale')::numeric between 0.02 and 3
      and (simulation_prefs->>'rotation')::numeric between -360 and 360
      and (simulation_prefs->>'opacity')::numeric between 0.1 and 1
    )
  );

-- Desenhos para simulação: públicos para leitura (o artista autoriza ao enviar),
-- escrita só pelo painel. Só PNG/WebP, que preservam transparência.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('simulacao', 'simulacao', true, 8388608, array['image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin write simulacao bucket" on storage.objects for all
  using (bucket_id = 'simulacao' and exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (bucket_id = 'simulacao' and exists (select 1 from public.profiles p where p.id = auth.uid()));
