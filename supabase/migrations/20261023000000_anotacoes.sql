-- Issue 07: anotações de carga do aluno (formato diário, D15).
--
-- Regras:
-- - A cada dia de treino o aluno cria uma anotação nova (data + treino A–D +
--   texto livre). O conjunto forma o histórico.
-- - Só o aluno ativo cria, edita e apaga as PRÓPRIAS. O professor só lê.

create table public.anotacoes (
  id uuid primary key default gen_random_uuid(),
  -- default auth.uid(): o app nem informa o dono; o banco decide.
  aluno_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  letra text not null check (letra in ('A', 'B', 'C', 'D')),
  -- Evita datas absurdas: até amanhã (folga de fuso) e a partir de 2020.
  data date not null check (data >= date '2020-01-01' and data <= current_date + 1),
  texto text not null check (char_length(texto) between 1 and 5000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index anotacoes_aluno_data_idx on public.anotacoes (aluno_id, data desc);

alter table public.anotacoes enable row level security;

-- Privilégios: começa do zero. aluno_id não entra no insert: sem privilégio na
-- coluna, o app não escolhe o dono e o default auth.uid() vale.
-- Depois de criada, só data e texto mudam; criado_em/atualizado_em são do servidor.
revoke all on table public.anotacoes from anon, authenticated;
grant all on table public.anotacoes to service_role;
grant select, delete on table public.anotacoes to authenticated;
grant insert (letra, data, texto) on table public.anotacoes to authenticated;
grant update (data, texto) on table public.anotacoes to authenticated;

-- Renova a data a cada edição (o app não consegue gravar atualizado_em).
create function public.anotacoes_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

revoke execute on function public.anotacoes_atualizado_em() from public, anon, authenticated;

create trigger ao_editar_anotacao
  before update on public.anotacoes
  for each row execute function public.anotacoes_atualizado_em();

create policy "anotacoes: professor vê todas, aluno ativo vê as suas"
  on public.anotacoes for select
  to authenticated
  using (
    (select public.e_professor())
    or (aluno_id = (select auth.uid()) and (select public.e_aluno_ativo()))
  );

create policy "anotacoes: só aluno ativo cria as suas"
  on public.anotacoes for insert
  to authenticated
  with check (aluno_id = (select auth.uid()) and (select public.e_aluno_ativo()));

create policy "anotacoes: só aluno ativo edita as suas"
  on public.anotacoes for update
  to authenticated
  using (aluno_id = (select auth.uid()) and (select public.e_aluno_ativo()))
  with check (aluno_id = (select auth.uid()) and (select public.e_aluno_ativo()));

create policy "anotacoes: só aluno ativo apaga as suas"
  on public.anotacoes for delete
  to authenticated
  using (aluno_id = (select auth.uid()) and (select public.e_aluno_ativo()));
