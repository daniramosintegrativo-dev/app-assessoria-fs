-- Issue 17 (D16): aceite do aviso de privacidade pelo aluno.
--
-- Enquanto o aluno não aceitar a versão ATUAL do texto, e_aluno_ativo() é
-- falso e nenhuma política de conteúdo o libera (o bloqueio é no banco).
-- Texto novo = mudar a versão aqui (nas duas funções) e em
-- src/lib/privacidade.ts; todo aluno terá de aceitar de novo.
-- O app não tem update nas colunas: só a função abaixo grava o aceite.

alter table public.perfis
  add column privacidade_versao text,
  add column privacidade_aceita_em timestamptz;

-- Grava o aceite do próprio usuário (e só dele). Recusa versão que não
-- seja a atual. security definer: o app não tem update nas colunas.
create function public.aceitar_privacidade(versao text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if versao is distinct from '2026-10-27' then
    raise exception 'versão do aviso de privacidade inválida';
  end if;
  update public.perfis
    set privacidade_versao = versao, privacidade_aceita_em = now()
    where id = auth.uid();
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
      and privacidade_versao = '2026-10-27'
  );
$$;
