-- Testes da ficha de treinos (issue 05). Roda depois dos demais (ordem alfabética).
\set ON_ERROR_STOP on

-- d0 professor; d1 e d2 alunos ativos; d3 desativado; d4 com troca de senha pendente.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d0', 'profd0@teste'),
  ('00000000-0000-0000-0000-0000000000d1', 'alunod1@teste'),
  ('00000000-0000-0000-0000-0000000000d2', 'alunod2@teste'),
  ('00000000-0000-0000-0000-0000000000d3', 'alunod3@teste'),
  ('00000000-0000-0000-0000-0000000000d4', 'alunod4@teste');
update public.perfis set papel = 'professor', ativo = true
  where id = '00000000-0000-0000-0000-0000000000d0';
update public.perfis set ativo = true, privacidade_versao = '2026-10-28'
  where id in ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2');
-- d3 segue desativado, mas com aceite: assim o teste de desativação vale de fato.
update public.perfis set privacidade_versao = '2026-10-28'
  where id = '00000000-0000-0000-0000-0000000000d3';
update public.perfis set ativo = true, precisa_trocar_senha = true, privacidade_versao = '2026-10-28'
  where id = '00000000-0000-0000-0000-0000000000d4';
-- Treinos semeados pelo serviço (ignora o RLS).
insert into public.treinos (aluno_id, letra, texto, atualizado_em) values
  ('00000000-0000-0000-0000-0000000000d1', 'A', 'agachamento 4x8', '2000-01-01'),
  ('00000000-0000-0000-0000-0000000000d2', 'A', 'supino 4x8', now()),
  ('00000000-0000-0000-0000-0000000000d3', 'A', 'barra 3x5', now()),
  ('00000000-0000-0000-0000-0000000000d4', 'A', 'remada 3x10', now());

-- 1. Professor cria, edita e apaga.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d0"}';
insert into public.treinos (aluno_id, letra, texto)
  values ('00000000-0000-0000-0000-0000000000d1', 'B', 'terra 5x5');
update public.treinos set texto = 'terra 5x3'
  where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'B';
do $$ begin
  assert (select texto from public.treinos
    where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'B') = 'terra 5x3',
    'professor deveria editar o texto';
  assert (select count(*) from public.treinos) = 5, 'professor deveria ver todos';
end $$;
delete from public.treinos
  where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'B';
do $$ begin
  assert (select count(*) from public.treinos) = 4, 'professor deveria apagar';
end $$;

-- 1b. Atualizar o texto muda atualizado_em (o servidor decide a data).
update public.treinos set texto = 'agachamento 5x5'
  where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'A';
do $$ begin
  assert (select atualizado_em from public.treinos
    where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'A') > '2000-01-02',
    'atualizado_em deveria ser renovado pelo gatilho';
end $$;
update public.treinos set texto = 'agachamento 4x8'
  where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'A';

-- 2. Professor não muda de quem é o treino, nem a data (só o texto).
do $$ begin
  begin
    update public.treinos set atualizado_em = '2000-01-01'
      where aluno_id = '00000000-0000-0000-0000-0000000000d1';
    raise exception 'não deveria gravar atualizado_em';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.treinos set aluno_id = '00000000-0000-0000-0000-0000000000d2'
      where aluno_id = '00000000-0000-0000-0000-0000000000d1';
    raise exception 'não deveria mudar aluno_id';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 3. Não dá para criar treino para um professor.
do $$ begin
  begin
    insert into public.treinos (aluno_id, letra)
      values ('00000000-0000-0000-0000-0000000000d0', 'A');
    raise exception 'treino para professor deveria ser recusado';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 3b. Para o professor, e_perfil_aluno distingue aluno de professor.
do $$ begin
  assert public.e_perfil_aluno('00000000-0000-0000-0000-0000000000d2'), 'd2 é aluno';
  assert not public.e_perfil_aluno('00000000-0000-0000-0000-0000000000d0'), 'd0 é professor';
end $$;

-- 4. Letra inválida, texto grande demais e letra repetida são recusados.
do $$ begin
  begin
    insert into public.treinos (aluno_id, letra)
      values ('00000000-0000-0000-0000-0000000000d1', 'E');
    raise exception 'letra E deveria ser recusada';
  exception when check_violation then null;
  end;
  begin
    insert into public.treinos (aluno_id, letra, texto)
      values ('00000000-0000-0000-0000-0000000000d1', 'C', repeat('x', 20001));
    raise exception 'texto de 20001 caracteres deveria ser recusado';
  exception when check_violation then null;
  end;
  insert into public.treinos (aluno_id, letra, texto)
    values ('00000000-0000-0000-0000-0000000000d1', 'C', repeat('x', 20000));
  begin
    insert into public.treinos (aluno_id, letra)
      values ('00000000-0000-0000-0000-0000000000d1', 'A');
    raise exception 'letra repetida deveria ser recusada';
  exception when unique_violation then null;
  end;
end $$;
reset role;
delete from public.treinos
  where aluno_id = '00000000-0000-0000-0000-0000000000d1' and letra = 'C';

-- 5. Aluno ativo lê só os próprios treinos.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d1"}';
do $$ begin
  assert (select count(*) from public.treinos) = 1, 'aluno deveria ver só 1 treino';
  assert (select count(*) from public.treinos
    where aluno_id = '00000000-0000-0000-0000-0000000000d2') = 0, 'aluno não lê de outro';
end $$;

-- 5b. e_perfil_aluno não diz nada útil a quem não é professor.
do $$ begin
  assert not public.e_perfil_aluno('00000000-0000-0000-0000-0000000000d2'),
    'aluno chamando e_perfil_aluno deveria receber false';
end $$;

-- 6. Aluno não escreve (nem no próprio treino).
do $$ begin
  begin
    insert into public.treinos (aluno_id, letra)
      values ('00000000-0000-0000-0000-0000000000d1', 'D');
    raise exception 'aluno não deveria criar treino';
  exception when insufficient_privilege then null;
  end;
end $$;
update public.treinos set texto = 'hackeado';
delete from public.treinos;
reset role;
do $$ begin
  assert (select texto from public.treinos
    where aluno_id = '00000000-0000-0000-0000-0000000000d1') = 'agachamento 4x8',
    'aluno não pode alterar nem apagar';
  assert (select count(*) from public.treinos) = 4, 'aluno não pode apagar';
end $$;

-- 7. Aluno desativado e aluno com troca de senha pendente não leem nada.
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d3"}';
do $$ begin
  assert (select count(*) from public.treinos) = 0, 'desativado não deveria ler';
end $$;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000d4"}';
do $$ begin
  assert (select count(*) from public.treinos) = 0, 'troca pendente não deveria ler';
end $$;
reset role;

-- 8. Visitante (anon) não tem acesso à tabela.
set role anon;
do $$ begin
  begin
    perform count(*) from public.treinos;
    raise exception 'anon não deveria ler';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'OK: testes de treinos passaram' as resultado;
