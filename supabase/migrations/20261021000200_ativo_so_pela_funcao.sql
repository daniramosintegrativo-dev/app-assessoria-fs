-- Issue 04 (revisão de segurança): ativar/desativar aluno passa a ser só pela
-- Edge Function gerenciar-aluno, que além de mudar o perfil aplica o bloqueio
-- no Auth (ban) e encerra as sessões abertas. Um update direto pelo app
-- só mudaria o perfil e deixaria o resto para trás.
-- O professor continua podendo renomear (nome).

revoke update (ativo) on public.perfis from authenticated;
