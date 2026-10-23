-- Projetos novos do Supabase não liberam mais as tabelas automaticamente para a API.
-- O servidor do site usa a service_role; o painel (logado) passa pelas políticas RLS.
-- O visitante anônimo não acessa nenhuma tabela diretamente.
grant usage on schema public to service_role, authenticated, anon;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
