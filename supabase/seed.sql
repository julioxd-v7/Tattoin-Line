-- Dados DEMONSTRATIVOS — troque pelo conteúdo real no painel.
-- Rode depois da migração: supabase db reset  (ou cole no SQL Editor).

with a as (
  insert into public.artists (slug, name, timezone)
  values ('caio-martins', 'Caio Martins', 'America/Recife')
  on conflict (slug) do update set name = excluded.name
  returning id
)
insert into public.site_settings (
  artist_id, hero_title, hero_subtitle, about, specialties, contact_email, whatsapp, instagram, address, city, business_info,
  size_tiers, quote_rules_text, cancellation_policy, privacy_policy, hourly_rate_cents
)
select a.id,
  'Arte que fica pra vida toda.',
  'Tatuagem autoral. Cada desenho é criado junto com você.',
  '[Apresentação do artista: trajetória, há quanto tempo tatua, onde atende e o que o move.]',
  '{}',
  'contato@exemplo.com.br', '5581900000000', 'tattoinline', '[Endereço do estúdio]', 'Recife — PE', 'CNPJ [00.000.000/0000-00]',
  '[{"id":"p","label":"Até 5 cm","from_cents":30000,"minutes":60},{"id":"m","label":"5 a 10 cm","from_cents":42000,"minutes":150},{"id":"g","label":"10 a 20 cm","from_cents":65000,"minutes":240},{"id":"xg","label":"Maior que 20 cm","from_cents":null,"minutes":null}]',
  'Peças acima de 20 cm, fechamentos e coberturas dependem de avaliação. Envie ideia, região, tamanho e referências; a resposta vem em até 3 dias úteis.',
  'Reagendamento gratuito até 72 horas antes da sessão, uma vez. Cancelamento com mais de 72 horas: o sinal é devolvido. Com menos de 72 horas ou não comparecimento, o sinal não é devolvido.',
  'Coletamos apenas nome, e-mail, WhatsApp e as informações da sua ideia, usados para atender, agendar e enviar avisos da sessão. Você pode pedir acesso, correção ou exclusão pelo e-mail de contato; registros financeiros são mantidos pelo prazo legal.',
  22000
from a
on conflict (artist_id) do nothing;

insert into public.availability_rules (artist_id, weekday, start_time, end_time)
select id, d, '10:00', '20:00' from public.artists, generate_series(2, 6) d where slug = 'caio-martins';

-- Estilos, tatuagens e projetos NÃO vêm prontos: o artista cadastra os próprios pelo painel.

-- Para criar o acesso ao painel:
-- 1) Authentication > Users > Add user (e-mail e senha do tatuador)
-- 2) insert into public.profiles (id, artist_id, role)
--    select '<UUID-DO-USUARIO>', id, 'owner' from public.artists where slug = 'caio-martins';
