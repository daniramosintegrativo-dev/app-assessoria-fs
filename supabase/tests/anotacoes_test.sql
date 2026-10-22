-- Testes das anotações de carga (issue 07). Roda depois dos demais (ordem alfabética).
\set ON_ERROR_STOP on

-- e0 professor; e1 e e2 alunos ativos; e3 desativado; e4 com troca de senha pendente.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e0', 'profe0@teste'),
  ('00000000-0000-0000-0000-0000000000e1', 'alunoe1@teste'),
  ('00000000-0000-0000-0000-0000000000e2', 'alunoe2@teste'),
  ('00000000-0000-0000-0000-0000000000e3', 'alunoe3@teste'),
  ('00000000-0000-0000-0000-0000000000e4', 'alunoe4@teste');
update public.perfis set papel = 'professor', ativo = true
  where id = '00000000-0000-0000-0000-0000000000e0';
update public.perfis set ativo = true
  where id in ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e2');
update public.perfis set ativo = true, precisa_trocar_senha = true
  where id = '00000000-0000-0000-0000-0000000000e4';
-- Anotações semeadas pelo serviço (ignora o RLS). A do e2 serve de "alheia".
insert into public.anotacoes (aluno_id, letra, data, texto, atualizado_em) values
  ('00000000-0000-0000-0000-0000000000e2', 'A', '2026-10-01', 'supino 3x10 40kg', '2000-01-01'),
  ('00000000-0000-0000-0000-0000000000e3', 'A', '2026-10-01', 'barra 3x5', now()),
  ('00000000-0000-0000-0000-0000000000e4', 'A', '2026-10-01', 'remada 3x10', now());

-- 1. Aluno cria (sem informar aluno_id: o banco usa o dele), edita e apaga.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1"}';
insert into public.anotacoes (letra, data, texto) values ('A', current_date, 'agachamento 3x10 40kg');
do $$ begin
  assert (select count(*) from public.anotacoes) = 1, 'aluno deveria ver só a própria';
  assert (select aluno_id from public.anotacoes) = '00000000-0000-0000-0000-0000000000e1',
    'aluno_id deveria ser o de quem criou';
end $$;
update public.anotacoes set texto = 'agachamento 3x10 45kg', data = current_date - 1;
do $$ begin
  assert (select texto from public.anotacoes) = 'agachamento 3x10 45kg', 'aluno deveria editar';
  assert (select data from public.anotacoes) = current_date - 1, 'aluno deveria mudar a data';
  -- gatilho: atualizado_em renovado pelo servidor
  assert (select atualizado_em from public.anotacoes) > now() - interval '1 minute',
    'atualizado_em deveria ser do servidor';
end $$;
delete from public.anotacoes;
do $$ begin
  assert (select count(*) from public.anotacoes) = 0, 'aluno deveria apagar a própria';
end $$;

-- 1b. Hoje + 1 (fuso à frente) e 2020-01-01 são aceitos.
insert into public.anotacoes (letra, data, texto) values
  ('B', current_date + 1, 'amanhã vale'),
  ('B', date '2020-01-01', 'limite inferior');
delete from public.anotacoes;

-- 1c. Gatilho de verdade: linha antiga (2000) é renovada pela edição do aluno.
reset role;
insert into public.anotacoes (aluno_id, letra, data, texto, atualizado_em)
  values ('00000000-0000-0000-0000-0000000000e1', 'D', '2026-10-03', 'antiga', '2000-01-01');
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1"}';
update public.anotacoes set texto = 'antiga editada' where texto = 'antiga';
do $$ begin
  assert (select atualizado_em from public.anotacoes where texto = 'antiga editada') > '2000-01-01',
    'gatilho deveria renovar atualizado_em';
end $$;
delete from public.anotacoes where texto = 'antiga editada';

-- 2. Aluno não lê, edita nem apaga as de outro.
reset role;
insert into public.anotacoes (aluno_id, letra, data, texto)
  values ('00000000-0000-0000-0000-0000000000e1', 'C', '2026-10-02', 'minha');
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1"}';
do $$ begin
  assert (select count(*) from public.anotacoes
    where aluno_id = '00000000-0000-0000-0000-0000000000e2') = 0, 'aluno não lê de outro';
end $$;
update public.anotacoes set texto = 'hackeado' where aluno_id = '00000000-0000-0000-0000-0000000000e2';
delete from public.anotacoes where aluno_id = '00000000-0000-0000-0000-0000000000e2';
reset role;
do $$ begin
  assert (select texto from public.anotacoes
    where aluno_id = '00000000-0000-0000-0000-0000000000e2') = 'supino 3x10 40kg',
    'aluno não pode editar nem apagar anotação de outro';
end $$;
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1"}';

-- 3. Aluno não cria em nome de outro (nem escolhe aluno_id).
do $$ begin
  begin
    insert into public.anotacoes (aluno_id, letra, data, texto)
      values ('00000000-0000-0000-0000-0000000000e2', 'A', current_date, 'falso');
    raise exception 'não deveria criar em nome de outro';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 4. Campos que o app não altera: aluno_id, criado_em, atualizado_em.
do $$ begin
  begin
    update public.anotacoes set aluno_id = '00000000-0000-0000-0000-0000000000e2';
    raise exception 'não deveria mudar aluno_id';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.anotacoes set criado_em = '2000-01-01';
    raise exception 'não deveria gravar criado_em';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.anotacoes set atualizado_em = '2000-01-01';
    raise exception 'não deveria gravar atualizado_em';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.anotacoes set letra = 'D';
    raise exception 'não deveria mudar a letra';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 5. Regras de conteúdo: texto, letra e data.
do $$ begin
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', current_date, '');
    raise exception 'texto vazio deveria ser recusado';
  exception when check_violation then null;
  end;
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', current_date, repeat('x', 5001));
    raise exception 'texto de 5001 caracteres deveria ser recusado';
  exception when check_violation then null;
  end;
  insert into public.anotacoes (letra, data, texto) values ('A', current_date, repeat('x', 5000));
  begin
    insert into public.anotacoes (letra, data, texto) values ('E', current_date, 'x');
    raise exception 'letra E deveria ser recusada';
  exception when check_violation then null;
  end;
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', current_date + 2, 'x');
    raise exception 'data além de amanhã deveria ser recusada';
  exception when insufficient_privilege or check_violation then null;
  end;
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', date '2019-12-31', 'x');
    raise exception 'data antes de 2020 deveria ser recusada';
  exception when insufficient_privilege or check_violation then null;
  end;
  begin
    update public.anotacoes set data = current_date + 2 where texto = 'minha';
    raise exception 'editar para data futura deveria ser recusado';
  exception when insufficient_privilege or check_violation then null;
  end;
  begin
    update public.anotacoes set texto = '' where texto = 'minha';
    raise exception 'editar para vazio deveria ser recusado';
  exception when check_violation then null;
  end;
end $$;
reset role;
do $$ begin
  assert (select texto from public.anotacoes
    where aluno_id = '00000000-0000-0000-0000-0000000000e2') = 'supino 3x10 40kg',
    'anotação de outro aluno não pode mudar nem sumir';
end $$;
delete from public.anotacoes where aluno_id = '00000000-0000-0000-0000-0000000000e1' and texto <> 'minha';

-- 6. Professor lê todas, mas não escreve.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e0"}';
do $$ begin
  assert (select count(*) from public.anotacoes) = 4, 'professor deveria ler todas';
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', current_date, 'do professor');
    raise exception 'professor não deveria criar';
  exception when insufficient_privilege then null;
  end;
end $$;
update public.anotacoes set texto = 'editado pelo professor';
delete from public.anotacoes;
reset role;
do $$ begin
  assert (select count(*) from public.anotacoes) = 4, 'professor não apaga';
  assert (select count(*) from public.anotacoes where texto = 'editado pelo professor') = 0,
    'professor não edita';
end $$;

-- 7. Desativado e com troca de senha pendente não leem nem escrevem.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e3"}';
do $$ begin
  assert (select count(*) from public.anotacoes) = 0, 'desativado não deveria ler';
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', current_date, 'x');
    raise exception 'desativado não deveria criar';
  exception when insufficient_privilege then null;
  end;
end $$;
update public.anotacoes set texto = 'x';
delete from public.anotacoes;
reset role;
do $$ begin
  assert (select count(*) from public.anotacoes
    where aluno_id = '00000000-0000-0000-0000-0000000000e3' and texto = 'barra 3x5') = 1,
    'desativado não edita nem apaga';
end $$;
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e4"}';
do $$ begin
  assert (select count(*) from public.anotacoes) = 0, 'troca pendente não deveria ler';
  begin
    insert into public.anotacoes (letra, data, texto) values ('A', current_date, 'x');
    raise exception 'troca pendente não deveria criar';
  exception when insufficient_privilege then null;
  end;
end $$;
update public.anotacoes set texto = 'x';
delete from public.anotacoes;
reset role;
do $$ begin
  assert (select count(*) from public.anotacoes
    where aluno_id = '00000000-0000-0000-0000-0000000000e4' and texto = 'remada 3x10') = 1,
    'troca pendente não edita nem apaga';
end $$;

-- 8. Visitante (anon) não tem acesso à tabela.
set role anon;
do $$ begin
  begin
    perform count(*) from public.anotacoes;
    raise exception 'anon não deveria ler';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Limpa (este teste roda antes dos de perfis, que contam linhas).
delete from auth.users where id::text like '00000000-0000-0000-0000-0000000000e_';
do $$ begin
  assert (select count(*) from public.anotacoes) = 0, 'anotações somem com o perfil';
end $$;

select 'OK: testes de anotações passaram' as resultado;
