-- Testes da troca obrigatória de senha (issue 03).
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b1', 'alunob1@teste'),
  ('00000000-0000-0000-0000-0000000000b2', 'alunob2@teste');
-- Os dois ativos e com troca pendente (como a Edge Function deixa).
update public.perfis set ativo = true, precisa_trocar_senha = true
  where id in ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2');

-- 1. A coluna nasce falsa por padrão.
do $$ begin
  assert (select not precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-000000000001'), 'padrão deveria ser false';
end $$;

-- 2. Aluno não muda a flag por update direto.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1"}';
do $$ begin
  begin
    update public.perfis set precisa_trocar_senha = false where id = auth.uid();
    raise exception 'aluno não deveria mudar precisa_trocar_senha';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 3a. Com troca pendente, não é aluno ativo (conteúdo fica bloqueado).
do $$ begin
  assert not public.e_aluno_ativo(), 'troca pendente não deveria liberar conteúdo';
end $$;

-- 3. senha_trocada() zera só a flag do próprio usuário.
select public.senha_trocada();
do $$ begin
  assert public.e_aluno_ativo(), 'após trocar a senha deveria ser aluno ativo';
end $$;
reset role;
do $$ begin
  assert not (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b1'), 'própria flag deveria zerar';
  assert (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b2'), 'flag de outro não pode mudar';
end $$;

-- 4. Visitante sem login não executa senha_trocada().
do $$ begin
  assert not has_function_privilege('anon', 'public.senha_trocada()', 'execute'),
    'anon não deveria executar senha_trocada';
  assert has_function_privilege('authenticated', 'public.senha_trocada()', 'execute'),
    'authenticated deveria executar senha_trocada';
end $$;

-- 5. Sem login, auth.uid() é nulo e nada muda.
set role authenticated;
set request.jwt.claims = '{}';
select public.senha_trocada();
reset role;
do $$ begin
  assert (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b2'), 'chamada sem uid não pode mudar nada';
end $$;

-- 6. JWT emitido ANTES da senha provisória não zera a flag (iat 1000 < 2000).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000b3', 'alunob3@teste');
update public.perfis
  set ativo = true, precisa_trocar_senha = true, senha_provisoria_em = to_timestamp(2000.5)
  where id = '00000000-0000-0000-0000-0000000000b3';
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b3","iat":1000}';
select public.senha_trocada();
reset role;
do $$ begin
  assert (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b3'), 'JWT antigo não pode zerar a flag';
end $$;

-- 7. JWT emitido no mesmo segundo da senha provisória zera.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b3","iat":2000}';
select public.senha_trocada();
reset role;
do $$ begin
  assert not (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b3'), 'JWT do mesmo segundo deveria zerar';
end $$;

-- 8. JWT posterior também zera; e senha_provisoria_em nulo funciona como antes.
update public.perfis set precisa_trocar_senha = true, senha_provisoria_em = to_timestamp(2000)
  where id = '00000000-0000-0000-0000-0000000000b3';
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b3","iat":3000}';
select public.senha_trocada();
reset role;
do $$ begin
  assert not (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b3'), 'JWT posterior deveria zerar';
end $$;
update public.perfis set precisa_trocar_senha = true, senha_provisoria_em = null
  where id = '00000000-0000-0000-0000-0000000000b3';
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b3","iat":1}';
select public.senha_trocada();
reset role;
do $$ begin
  assert not (select precisa_trocar_senha from public.perfis
    where id = '00000000-0000-0000-0000-0000000000b3'), 'sem senha_provisoria_em deveria zerar';
end $$;

-- 9. O app não grava senha_provisoria_em.
do $$ begin
  assert not has_column_privilege('authenticated', 'public.perfis', 'senha_provisoria_em', 'update'),
    'authenticated não deveria atualizar senha_provisoria_em';
end $$;

select 'OK: testes de senha provisória passaram' as resultado;
