-- Testes de encerrar_sessoes (issue 04): derruba as sessões abertas de um aluno.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'alunoc1@teste'),
  ('00000000-0000-0000-0000-0000000000c2', 'alunoc2@teste');
insert into auth.sessions (user_id) values
  ('00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000c2');

-- 1. Só o serviço executa; visitante e usuário logado não.
do $$ begin
  assert not has_function_privilege('anon', 'public.encerrar_sessoes(uuid)', 'execute'),
    'anon não deveria executar encerrar_sessoes';
  assert not has_function_privilege('authenticated', 'public.encerrar_sessoes(uuid)', 'execute'),
    'authenticated não deveria executar encerrar_sessoes';
  assert has_function_privilege('service_role', 'public.encerrar_sessoes(uuid)', 'execute'),
    'service_role deveria executar encerrar_sessoes';
end $$;

-- 2. Na prática, authenticated é barrado ao chamar.
set role authenticated;
do $$ begin
  begin
    perform public.encerrar_sessoes('00000000-0000-0000-0000-0000000000c2');
    raise exception 'authenticated não deveria conseguir chamar';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. O serviço apaga só as sessões do alvo.
set role service_role;
select public.encerrar_sessoes('00000000-0000-0000-0000-0000000000c1');
reset role;
do $$ begin
  assert (select count(*) from auth.sessions
    where user_id = '00000000-0000-0000-0000-0000000000c1') = 0, 'sessões do alvo deveriam sumir';
  assert (select count(*) from auth.sessions
    where user_id = '00000000-0000-0000-0000-0000000000c2') = 1, 'sessões de outro não podem sumir';
end $$;

select 'OK: testes de encerrar sessões passaram' as resultado;
