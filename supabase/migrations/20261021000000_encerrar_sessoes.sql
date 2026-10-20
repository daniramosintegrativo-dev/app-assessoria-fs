-- Issue 04: ativar/desativar aluno.
--
-- encerrar_sessoes(alvo) apaga as sessões abertas do usuário no Auth; os
-- refresh tokens caem em cascata. Assim, quem foi desativado (ou teve a senha
-- trocada) não renova o acesso. Só a Edge Function (service_role) executa.

create function public.encerrar_sessoes(alvo uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.sessions where user_id = alvo;
$$;

revoke execute on function public.encerrar_sessoes(uuid) from public, anon, authenticated;
grant execute on function public.encerrar_sessoes(uuid) to service_role;
