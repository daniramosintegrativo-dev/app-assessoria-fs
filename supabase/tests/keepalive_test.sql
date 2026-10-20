-- Testes da tabela keepalive (issue 19).
\set ON_ERROR_STOP on

-- 1. Visitante sem login lê a linha fixa.
set role anon;
do $$ begin
  assert (select count(*) from public.keepalive) = 1, 'anon deveria ler a linha do keepalive';
end $$;

-- 2. Visitante não escreve nem apaga.
do $$ begin
  begin
    insert into public.keepalive (id) values (2);
    raise exception 'anon não deveria inserir no keepalive';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.keepalive;
    raise exception 'anon não deveria apagar o keepalive';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 3. Usuário logado não precisa de acesso.
do $$ begin
  assert not has_table_privilege('authenticated', 'public.keepalive', 'insert'),
    'authenticated não deveria inserir no keepalive';
end $$;

select 'OK: testes de keepalive passaram' as resultado;
