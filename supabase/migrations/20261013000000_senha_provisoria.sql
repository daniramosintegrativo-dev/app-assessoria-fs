-- Issue 03: troca obrigatória de senha no primeiro acesso (D13).
--
-- A Edge Function gerenciar-aluno liga a flag ao criar o aluno ou gerar nova
-- senha provisória. O aluno só a desliga chamando senha_trocada() depois de
-- criar a própria senha. Nenhum update direto da coluna é permitido ao app:
-- o grant de update em perfis continua só em (nome, ativo).

alter table public.perfis
  add column precisa_trocar_senha boolean not null default false;

-- Zera a flag do próprio usuário (e só dele).
-- security definer: o app não tem update na coluna.
create function public.senha_trocada()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfis set precisa_trocar_senha = false where id = auth.uid();
$$;

revoke execute on function public.senha_trocada() from public, anon;
grant execute on function public.senha_trocada() to authenticated;
