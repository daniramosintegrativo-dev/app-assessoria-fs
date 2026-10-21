-- Issue 05: ficha de treinos do aluno (treinos A, B, C e D).
--
-- Regras:
-- - Cada treino é um bloco de texto livre (o professor escreve como num bloco
--   de notas). Cada aluno tem de 1 a 4 treinos, uma linha por letra.
-- - Só o professor cria, edita e apaga. O aluno ativo lê só os próprios
--   (a tela do aluno vem na issue 06, mas a regra já nasce certa).
-- - Treino só existe para quem tem papel "aluno".

create table public.treinos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  letra text not null check (letra in ('A', 'B', 'C', 'D')),
  texto text not null default '' check (char_length(texto) <= 20000),
  atualizado_em timestamptz not null default now(),
  unique (aluno_id, letra)
);

alter table public.treinos enable row level security;

-- Privilégios: começa do zero. O app só muda o texto; aluno_id e letra não
-- mudam depois de criados e a data é do servidor (gatilho abaixo).
revoke all on table public.treinos from anon, authenticated;
grant all on table public.treinos to service_role;
grant select, insert, delete on table public.treinos to authenticated;
grant update (texto) on table public.treinos to authenticated;

-- Renova a data a cada edição (o app não consegue gravar atualizado_em).
create function public.treinos_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

revoke execute on function public.treinos_atualizado_em() from public, anon, authenticated;

create trigger ao_editar_treino
  before update on public.treinos
  for each row execute function public.treinos_atualizado_em();

-- Esse perfil é de um aluno? Só responde a professor (a quem não é, sempre false).
-- security definer: lê perfis sem passar pelo RLS (evita recursão nas políticas).
create function public.e_perfil_aluno(perfil uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.e_professor() and exists (
    select 1 from public.perfis where id = perfil and papel = 'aluno'
  );
$$;

revoke execute on function public.e_perfil_aluno(uuid) from public, anon;
grant execute on function public.e_perfil_aluno(uuid) to authenticated;

create policy "treinos: professor vê todos, aluno ativo vê os seus"
  on public.treinos for select
  to authenticated
  using (
    (select public.e_professor())
    or (aluno_id = (select auth.uid()) and (select public.e_aluno_ativo()))
  );

create policy "treinos: só professor cria, para aluno"
  on public.treinos for insert
  to authenticated
  with check ((select public.e_professor()) and public.e_perfil_aluno(aluno_id));

create policy "treinos: só professor edita"
  on public.treinos for update
  to authenticated
  using ((select public.e_professor()))
  with check ((select public.e_professor()));

create policy "treinos: só professor apaga"
  on public.treinos for delete
  to authenticated
  using ((select public.e_professor()));
