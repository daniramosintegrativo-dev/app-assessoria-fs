-- Issue 17 (D16): aceite do aviso de privacidade pelo aluno.
--
-- Enquanto o aluno não aceitar a versão ATUAL do texto, e_aluno_ativo() é
-- falso e nenhuma política de conteúdo o libera (o bloqueio é no banco).
-- Texto novo = mudar a versão em versao_privacidade_atual() (única fonte no
-- banco) e em src/lib/privacidade.ts; todo aluno terá de aceitar de novo.
-- O app não tem update nas colunas: só a função abaixo grava o aceite.

alter table public.perfis
  add column privacidade_versao text,
  add column privacidade_aceita_em timestamptz;

-- Única fonte da versão atual no banco (usada pelas duas funções abaixo).
create function public.versao_privacidade_atual()
returns text
language sql
immutable
set search_path = ''
as $$ select '2026-10-28'::text $$;

revoke execute on function public.versao_privacidade_atual() from public, anon;
grant execute on function public.versao_privacidade_atual() to authenticated;

-- Histórico de aceites (prova do consentimento). Só aceitar_privacidade()
-- grava; o app só lê: o aluno os próprios, o professor todos.
create table public.aceites_privacidade (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  versao text not null,
  aceito_em timestamptz not null default now()
);
alter table public.aceites_privacidade enable row level security;
revoke all on table public.aceites_privacidade from anon, authenticated;
grant all on table public.aceites_privacidade to service_role;
grant select on table public.aceites_privacidade to authenticated;
create policy aceites_privacidade_select on public.aceites_privacidade
  for select to authenticated
  using (public.e_professor() or aluno_id = auth.uid());

-- Grava o aceite do próprio usuário (e só dele). Recusa versão que não
-- seja a atual. security definer: o app não tem update nem insert.
create function public.aceitar_privacidade(versao text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if versao is distinct from public.versao_privacidade_atual() then
    raise exception 'versão do aviso de privacidade inválida';
  end if;
  update public.perfis
    set privacidade_versao = versao, privacidade_aceita_em = now()
    where id = auth.uid();
  -- Perfil inexistente (ou sem login): nada a registrar.
  if found then
    insert into public.aceites_privacidade (aluno_id, versao) values (auth.uid(), versao);
  end if;
end;
$$;

revoke execute on function public.aceitar_privacidade(text) from public, anon;
grant execute on function public.aceitar_privacidade(text) to authenticated;

-- Aluno ativo = ativo, sem troca de senha pendente e com a versão atual aceita.
-- O professor (e_professor) não precisa aceitar.
create or replace function public.e_aluno_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'aluno' and ativo and not precisa_trocar_senha
      and privacidade_versao = public.versao_privacidade_atual()
  );
$$;
