-- Issue 02: perfis professor e aluno, com regras de acesso (RLS).
--
-- Regras:
-- - Toda conta criada no Supabase Auth ganha um perfil "aluno" DESATIVADO.
--   Só o convite do professor (issue 03, Edge Function) ou o painel ativa a conta.
--   Assim, uma conta criada por fora do convite nasce sem acesso a nada.
-- - O professor é promovido manualmente pelo painel do Supabase (ver docs/SUPABASE.md).
-- - Aluno ativo vê só o próprio perfil. Aluno desativado não vê nada.
-- - Professor ativo vê todos e pode mudar nome e status (ativo) dos perfis,
--   mas não pode desativar a si mesmo (evita se trancar fora do app).
-- - Ninguém muda o papel nem cria/apaga perfis pela API do app.

create type public.papel as enum ('professor', 'aluno');

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  papel public.papel not null default 'aluno',
  nome text not null default '',
  ativo boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- Privilégios: começa do zero e libera só o necessário.
revoke all on table public.perfis from anon, authenticated;
grant select on table public.perfis to authenticated;
grant update (nome, ativo) on table public.perfis to authenticated;

-- Quem está logado é professor ativo?
-- security definer: lê perfis sem passar pelo RLS (evita recursão nas políticas).
create function public.e_professor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'professor' and ativo
  );
$$;

revoke execute on function public.e_professor() from public, anon;
grant execute on function public.e_professor() to authenticated;

-- Quem está logado é aluno ativo?
-- Toda política de conteúdo futura deve usar e_aluno_ativo() ou e_professor(),
-- para que aluno desativado perca acesso na hora.
create function public.e_aluno_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'aluno' and ativo
  );
$$;

revoke execute on function public.e_aluno_ativo() from public, anon;
grant execute on function public.e_aluno_ativo() to authenticated;

create policy "perfis: aluno ativo vê o próprio, professor vê todos"
  on public.perfis for select
  to authenticated
  using ((id = (select auth.uid()) and ativo) or (select public.e_professor()));

create policy "perfis: só professor altera"
  on public.perfis for update
  to authenticated
  using ((select public.e_professor()))
  with check ((select public.e_professor()) and (id <> (select auth.uid()) or ativo));

-- Cria o perfil "aluno" quando uma conta nova nasce no Auth.
-- Ignora de propósito os metadados enviados pelo usuário (não confiáveis).
create function public.criar_perfil_para_nova_conta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, papel) values (new.id, 'aluno');
  return new;
end;
$$;

revoke execute on function public.criar_perfil_para_nova_conta() from public, anon, authenticated;

create trigger ao_criar_conta
  after insert on auth.users
  for each row execute function public.criar_perfil_para_nova_conta();
