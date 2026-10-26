-- Testes do aceite de privacidade (issue 17, D16).
\set ON_ERROR_STOP on

-- f1 e f2 alunos ativos e sem troca pendente, mas SEM aceite; f0 professor.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f0', 'proff0@teste'),
  ('00000000-0000-0000-0000-0000000000f1', 'alunof1@teste'),
  ('00000000-0000-0000-0000-0000000000f2', 'alunof2@teste');
update public.perfis set papel = 'professor', ativo = true
  where id = '00000000-0000-0000-0000-0000000000f0';
update public.perfis set ativo = true
  where id in ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f2');
insert into public.treinos (aluno_id, letra, texto) values
  ('00000000-0000-0000-0000-0000000000f1', 'A', 'agachamento 4x8');
insert into public.anotacoes (aluno_id, letra, data, texto) values
  ('00000000-0000-0000-0000-0000000000f1', 'A', '2026-10-01', 'supino 3x10');

-- 1. Sem aceite: não é aluno ativo e não lê treinos nem anotações.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1"}';
do $$ begin
  assert not public.e_aluno_ativo(), 'sem aceite não deveria ser aluno ativo';
  assert (select count(*) from public.treinos) = 0, 'sem aceite não lê treinos';
  assert (select count(*) from public.anotacoes) = 0, 'sem aceite não lê anotações';
  assert (select count(*) from public.perfis) = 1, 'o próprio perfil continua visível';
end $$;

-- 2. Versão errada é recusada e nada é gravado.
do $$ begin
  begin
    perform public.aceitar_privacidade('1999-01-01');
    raise exception 'não deveria aceitar versão errada';
  exception when others then
    assert sqlerrm like '%versão%', 'erro deveria falar da versão: ' || sqlerrm;
  end;
  assert (select privacidade_versao is null from public.perfis where id = auth.uid()),
    'versão errada não pode gravar';
end $$;

-- 3. Aluno não altera as colunas por update direto.
do $$ begin
  begin
    update public.perfis set privacidade_versao = '2026-10-27' where id = auth.uid();
    raise exception 'aluno não deveria mudar privacidade_versao';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.perfis set privacidade_aceita_em = now() where id = auth.uid();
    raise exception 'aluno não deveria mudar privacidade_aceita_em';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 4. Aceitar a versão atual libera o conteúdo.
select public.aceitar_privacidade('2026-10-27');
do $$ begin
  assert public.e_aluno_ativo(), 'após aceitar deveria ser aluno ativo';
  assert (select count(*) from public.treinos) = 1, 'após aceitar lê treinos';
  assert (select count(*) from public.anotacoes) = 1, 'após aceitar lê anotações';
end $$;
reset role;

-- 5. Aceitar grava versão e data só no próprio perfil.
do $$ begin
  assert (select privacidade_versao from public.perfis
    where id = '00000000-0000-0000-0000-0000000000f1') = '2026-10-27', 'versão gravada';
  assert (select privacidade_aceita_em is not null from public.perfis
    where id = '00000000-0000-0000-0000-0000000000f1'), 'data gravada';
  assert (select privacidade_versao is null and privacidade_aceita_em is null from public.perfis
    where id = '00000000-0000-0000-0000-0000000000f2'), 'perfil de outro não pode mudar';
end $$;

-- 6. Versão antiga (aceite de texto anterior) bloqueia de novo.
update public.perfis set privacidade_versao = '2020-01-01'
  where id = '00000000-0000-0000-0000-0000000000f1';
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f1"}';
do $$ begin
  assert not public.e_aluno_ativo(), 'versão antiga exige novo aceite';
end $$;
reset role;

-- 7. Sem login (anon) não executa; sem uid nada muda.
do $$ begin
  assert not has_function_privilege('anon', 'public.aceitar_privacidade(text)', 'execute'),
    'anon não deveria executar aceitar_privacidade';
  assert has_function_privilege('authenticated', 'public.aceitar_privacidade(text)', 'execute'),
    'authenticated deveria executar aceitar_privacidade';
end $$;
set role authenticated;
set request.jwt.claims = '{}';
select public.aceitar_privacidade('2026-10-27');
reset role;
do $$ begin
  assert (select privacidade_versao from public.perfis
    where id = '00000000-0000-0000-0000-0000000000f1') = '2020-01-01',
    'chamada sem uid não pode mudar ninguém';
end $$;

-- 8. Professor não precisa aceitar.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000f0"}';
do $$ begin
  assert public.e_professor(), 'professor continua professor sem aceite';
end $$;
reset role;

-- Limpa o que semeei: os testes seguintes contam linhas de treinos/anotações.
delete from public.treinos where aluno_id = '00000000-0000-0000-0000-0000000000f1';
delete from public.anotacoes where aluno_id = '00000000-0000-0000-0000-0000000000f1';

select 'OK: testes de privacidade passaram' as resultado;
