-- Testes de acesso à tabela perfis (issue 02).
-- Cada bloco falha com erro se a regra de segurança não for respeitada.
\set ON_ERROR_STOP on

-- Usuários de teste (como o Supabase faria ao criar contas).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'prof@teste', '{}'),
  ('00000000-0000-0000-0000-000000000001', 'aluno1@teste', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'aluno2@teste', '{"papel":"professor"}');

-- 1. Toda conta nova vira "aluno", mesmo se tentar se dizer professor nos metadados.
do $$ begin
  assert (select count(*) from public.perfis) = 3, 'perfil deveria ser criado para cada conta';
  assert (select papel from public.perfis where id = '00000000-0000-0000-0000-000000000002') = 'aluno',
    'metadados não podem promover a professor';
end $$;

-- 1b. Conta nova nasce desativada (sem acesso até o convite ativar).
do $$ begin
  assert not exists (select 1 from public.perfis where ativo), 'conta nova deveria nascer desativada';
end $$;

-- 1c. Conta desativada recém-criada não vê nada.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
do $$ begin
  assert (select count(*) from public.perfis) = 0, 'conta não ativada não deveria ver nada';
  assert not public.e_aluno_ativo(), 'conta não ativada não é aluno ativo';
end $$;
reset role;

-- O professor é promovido manualmente e os alunos são ativados (convite/painel).
update public.perfis set papel = 'professor', ativo = true where id = '00000000-0000-0000-0000-00000000000a';
-- (marca também o aceite de privacidade, exigido por e_aluno_ativo)
update public.perfis set ativo = true, privacidade_versao = '2026-10-28' where papel = 'aluno';

-- 2. RLS ligado na tabela.
do $$ begin
  assert (select relrowsecurity from pg_class where oid = 'public.perfis'::regclass),
    'RLS deve estar ativo em perfis';
end $$;

-- 3. Visitante sem login não acessa nada.
set role anon;
do $$ begin
  begin
    perform 1 from public.perfis;
    raise exception 'anon não deveria ler perfis';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 4. Aluno vê só o próprio perfil.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
do $$ begin
  assert public.e_aluno_ativo(), 'aluno ativado deveria ser aluno ativo';
  assert not public.e_professor(), 'aluno não é professor';
  assert (select count(*) from public.perfis) = 1, 'aluno deveria ver só 1 perfil';
  assert (select id from public.perfis) = '00000000-0000-0000-0000-000000000001', 'aluno deveria ver o próprio perfil';
end $$;

-- 5. Aluno não altera o próprio papel nem o próprio status.
do $$ declare n int; begin
  begin
    update public.perfis set papel = 'professor' where id = auth.uid();
    raise exception 'aluno não deveria poder mudar o papel';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.perfis set id = '00000000-0000-0000-0000-000000000009' where id = auth.uid();
    raise exception 'aluno não deveria poder mudar o id';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.perfis set criado_em = now() where id = auth.uid();
    raise exception 'aluno não deveria poder mudar criado_em';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.criar_perfil_para_nova_conta();
    raise exception 'aluno não deveria executar a função do gatilho';
  exception when insufficient_privilege or feature_not_supported then null;
  end;
  begin
    update public.perfis set ativo = false where id = auth.uid();
    raise exception 'aluno não deveria poder mudar o próprio status';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 6. Aluno não cria nem apaga perfis.
do $$ begin
  begin
    insert into public.perfis (id) values ('00000000-0000-0000-0000-000000000003');
    raise exception 'aluno não deveria inserir perfil';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.perfis where id = '00000000-0000-0000-0000-000000000002';
    raise exception 'aluno não deveria apagar perfil';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 7. Professor vê todos e pode renomear aluno, mas não mudar papel nem ativo
-- (ativar/desativar é só pela Edge Function: também aplica ban e encerra sessões).
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
do $$ declare n int; begin
  assert (select count(*) from public.perfis) = 3, 'professor deveria ver todos os perfis';
  update public.perfis set nome = 'Aluno Dois' where id = '00000000-0000-0000-0000-000000000002';
  get diagnostics n = row_count;
  assert n = 1, 'professor deveria poder renomear aluno';
  begin
    update public.perfis set ativo = false where id = '00000000-0000-0000-0000-000000000002';
    raise exception 'professor não deveria desativar aluno por update direto';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.perfis set papel = 'professor' where id = '00000000-0000-0000-0000-000000000001';
    raise exception 'professor não deveria mudar papel pela API';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.perfis set ativo = false where id = auth.uid();
    raise exception 'professor não deveria conseguir se desativar';
  exception when insufficient_privilege then null;
  end;
  update public.perfis set nome = 'Professor' where id = auth.uid();
  get diagnostics n = row_count;
  assert n = 1, 'professor deveria poder mudar o próprio nome';
end $$;

-- 8. Aluno desativado (pelo serviço, como a Edge Function faz) não vê nem o próprio perfil.
reset role;
update public.perfis set ativo = false where id = '00000000-0000-0000-0000-000000000002';
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002"}';
do $$ begin
  assert (select count(*) from public.perfis) = 0, 'aluno desativado não deveria ver nada';
  assert not public.e_aluno_ativo(), 'aluno desativado não é aluno ativo';
end $$;

-- 9. Professor desativado perde os poderes de professor.
reset role;
update public.perfis set ativo = false where id = '00000000-0000-0000-0000-00000000000a';
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a"}';
do $$ begin
  assert (select count(*) from public.perfis) = 0, 'professor desativado não deveria ver perfis';
end $$;
reset role;

-- 10. Toda tabela do schema public tem RLS ativo.
do $$ begin
  assert not exists (
    select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  ), 'existe tabela em public sem RLS';
end $$;

-- 11. A função e_professor não é chamável por visitante sem login.
do $$ begin
  assert not has_function_privilege('anon', 'public.e_professor()', 'execute'),
    'anon não deveria executar e_professor';
  assert not has_function_privilege('anon', 'public.e_aluno_ativo()', 'execute'),
    'anon não deveria executar e_aluno_ativo';
end $$;

select 'OK: todos os testes de perfis passaram' as resultado;
