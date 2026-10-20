-- Issue 04 (revisão de segurança): um JWT emitido ANTES de uma nova senha
-- provisória não pode zerar a troca obrigatória.
--
-- A Edge Function grava senha_provisoria_em ao criar o aluno e ao gerar nova
-- senha. senha_trocada() só zera a flag se o token foi emitido (claim iat) no
-- mesmo segundo ou depois desse momento, ou seja, com a senha provisória.
-- O app não tem update nesta coluna (o grant continua só em nome, ativo).

alter table public.perfis add column senha_provisoria_em timestamptz;

create or replace function public.senha_trocada()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfis set precisa_trocar_senha = false
  where id = auth.uid()
    and (
      senha_provisoria_em is null
      or ((auth.jwt() ->> 'iat')::bigint) >= floor(extract(epoch from senha_provisoria_em))
    );
$$;

-- create or replace preserva os grants; repetidos por garantia.
revoke execute on function public.senha_trocada() from public, anon;
grant execute on function public.senha_trocada() to authenticated;
