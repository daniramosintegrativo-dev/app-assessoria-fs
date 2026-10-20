-- Issue 19 / D8: tabela mínima que o workflow supabase-keepalive consulta a
-- cada 3 dias, para o projeto gratuito não pausar por inatividade.
-- Não guarda nenhum dado de aluno: só uma linha fixa.

create table public.keepalive (
  id smallint primary key
);

insert into public.keepalive (id) values (1);

alter table public.keepalive enable row level security;

revoke all on table public.keepalive from anon, authenticated;
grant select on table public.keepalive to anon;

create policy "keepalive: leitura pública"
  on public.keepalive for select
  to anon
  using (true);
