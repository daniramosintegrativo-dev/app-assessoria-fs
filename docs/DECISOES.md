# Decisões registradas

Revisar com o usuário no início de cada sessão. Ao mudar uma decisão,
não apague: marque como substituída e registre a nova com data.

## D1 — Escala
Até 40 alunos. Acima disso, a arquitetura e os custos devem ser repensados
antes de crescer.

## D2 — Orçamento
Meta: R$ 0/mês. Teto: R$ 50/mês. Qualquer serviço pago precisa de
aprovação explícita e estimativa de custo.

## D3 — Vídeos do professor: Bunny Stream
Conteúdo pago, portanto não pode ser YouTube (links vazam).
Bunny Stream com: autenticação por token (URL assinada com expiração),
restrição de domínio e rede de volume (mais barata para o Brasil).
Custo estimado: US$ 2 a 6/mês. Mínimo de US$ 1/mês.

## D4 — Vídeos dos alunos: upload direto para o Bunny  [SUBSTITUÍDA PARCIALMENTE em 2026-10-10 por D4b: a regra de apagar após 60 dias foi cancelada]
Aluno envia pelo app (upload retomável TUS). Uma Edge Function gera a
assinatura de upload; a chave nunca vai ao navegador.
Vídeos de feedback são apagados automaticamente após 60 dias
(pg_cron no Supabase chamando uma Edge Function).
Alternativa descartada: link do Drive (professor sai do app e o controle
de acesso depende do aluno).

## D5 — Login
Supabase Auth, apenas por convite do professor. Sem cadastro público.
Perfis: `professor` e `aluno`. Método: e-mail + senha (decidido em 2026-10-12; recomendação inicial era link mágico).

## D6 — Segurança dos dados
RLS no Supabase: aluno vê só os próprios dados; professor vê todos.

## D7 — Hospedagem: Cloudflare Pages
A Vercel gratuita não permite uso comercial. Cloudflare Pages é gratuita,
permite uso comercial e integra com GitHub.

## D8 — Manter o Supabase acordado
Projetos gratuitos pausam após ~7 dias sem uso. Workflow
`.github/workflows/supabase-keepalive.yml` faz uma consulta leve a cada
3 dias. Atenção: o GitHub desativa agendamentos em repositórios sem
atividade por 60 dias; se isso acontecer, reativar na aba Actions ou
migrar o ping para um Cron Trigger da Cloudflare.

## D9 — Stack de front
Vite + React + TypeScript + vite-plugin-pwa. SPA estática (combina com
Cloudflare Pages); o que precisa de servidor vai para Edge Functions.

## D10 — Trabalho no GitHub
Uma issue = uma branch = um PR. Issues geradas por `/to-issues`.

## D11 — Modelos  [REVISADA em 2026-10-13: ver D11b]
Orquestrador Sonnet (esforço máximo). Fable não é usado neste projeto
(ver `docs/AGENTES.md`).

## D4b — Vídeos de feedback ficam arquivados para sempre (2026-10-10)
Substitui a parte "apagar após 60 dias" da D4. O upload direto para o Bunny continua.
Exceção (P12): se o aluno ficar 6 meses inativo, tudo dele é apagado, vídeos incluídos.
Consequência: o armazenamento só cresce, então o custo mensal sobe com o tempo.
A estimar quando soubermos duração/tamanho dos vídeos (P8) e nº de alunos.

## D2 — nota (2026-10-10)
Professor ainda não sabe se aceitará algum custo. Manter meta R$ 0 e teto R$ 50 até ele decidir.

## Escopo v1 (2026-10-12)
Só o básico funcionando: (1) planilha exclusiva por aluno, com campo de anotação de cargas; (2) vídeos com subclasses: treino, consciência, feedback do aluno e feedback do professor. Sem níveis/faixas nem divisão de evolução.

## Investimento total estimado (2026-10-12)
Estimativa; preços conferidos nos sites em 12/10/2026. Câmbio suposto R$ 5,50/US$.
| Item | Custo |
|---|---|
| Cloudflare Pages, GitHub, Supabase (plano gratuito: 500 MB banco, 50 mil usuários ativos) | R$ 0 |
| Bunny Stream: armazenamento a partir de US$ 0,01/GB, entrega a partir de US$ 0,005/GB, codificação grátis, mínimo US$ 1/mês | ~US$ 2 a 6/mês (~R$ 11 a 33) |
| Domínio próprio (opcional) | ~R$ 40/ano (~R$ 3,50/mês) |
| **Total** | **~R$ 15 a 37/mês, dentro do teto de R$ 50 (D2)** |
Atenção: com vídeos para sempre (D4b), o armazenamento cresce. Com o limite de 6 vídeos de 1 min por aluno por semana (2026-10-12), no pior caso (40 alunos usando tudo, ~25 MB por vídeo, suposição) são ~300 GB/ano, ou cerca de US$ 3/mês a mais a cada ano. Uso real tende a ser bem menor. Supabase Pro (US$ 25/mês) só se o gratuito deixar de bastar.

## D12 — Contas nascem desativadas (2026-10-12)
Toda conta nova no Supabase vira perfil `aluno` com `ativo = false`. Só o convite
do professor (issue 03) ou o painel ativa. O cadastro público do Supabase fica
desligado, e essa regra é a segunda proteção caso alguém religue por engano.
O professor não pode desativar a si mesmo pelo app. Toda tabela de conteúdo usa
`e_professor()` ou `e_aluno_ativo()` nas regras de acesso.
Origem: revisão de segurança da issue 02.

## D13 — Acesso sem e-mail automático (2026-10-12)
O Supabase gratuito praticamente não envia e-mails para quem não é da equipe.
Decisão (opção A): o professor cadastra o aluno no app (nome + e-mail); o app gera
uma senha provisória que o professor envia pelo WhatsApp; no primeiro acesso o
aluno é obrigado a criar a própria senha. "Esqueci a senha": o aluno pede ao
professor, que gera nova senha provisória no app. Custo R$ 0.
Pode evoluir depois para convite/recuperação por e-mail (serviço de e-mail +
domínio próprio, ~R$ 40/ano) sem perder nada.

## D11b — Orquestrador Opus (2026-10-13)
Substitui o orquestrador Sonnet da D11. Por orientação do mentor (Tiago), a
sessão principal usa Opus 5.5 para planejar e coordenar, e delega a
subagentes com o modelo mais adequado a cada tarefa (tabela em
`docs/AGENTES.md`). Fable continua fora.

## D14 — Ficha de treinos em texto livre (2026-10-21)
Cada aluno tem de 1 a 4 treinos (A a D), cada um num bloco de texto livre, como
um bloco de notas. Sem campos estruturados (exercício, séries, carga): é o que
o professor já faz hoje e o app suporta de 1 a 4 sem mudar código. Só o
professor escreve; o aluno ativo lê só os próprios.
LGPD: o texto é livre, então o professor deve ser orientado a NÃO escrever
diagnósticos nem dados de saúde na ficha (dado sensível). A política de
privacidade (issue 17/18) deve citar a ficha de treinos entre os dados tratados.
Origem: issue 05 e revisão de segurança.

## D15 — Anotação de cargas em formato diário (2026-10-22)
A cada dia de treino o aluno cria uma anotação nova, com data, ligada a um
treino (A a D). As anotações formam o histórico. O aluno cria, edita e apaga só
as próprias; o professor só lê. A data padrão é hoje (fuso America/Sao_Paulo) e
o aluno pode mudar (registrar depois). Texto livre (séries, repetições, peso),
até 5000 caracteres. O banco recusa datas antes de 2020 ou depois de amanhã.
LGPD: texto livre; orientar o aluno a não escrever dados de saúde. A política de
privacidade (issue 17/18) deve citar as anotações; elas entram na limpeza de 6
meses de inatividade (P12).
Origem: issue 07 (resposta do professor à P1).

## D16 — Aceite de privacidade obrigatório e versionado (2026-10-27)
O aluno só acessa o conteúdo depois de aceitar a versão atual do aviso de
privacidade (`docs/PRIVACIDADE.md`). O aceite (versão + data) fica no perfil e
o bloqueio é no banco: `e_aluno_ativo()` exige a versão atual, então sem aceite
nenhuma política de conteúdo libera nada. Só a função `aceitar_privacidade()`
grava o aceite, e só para o próprio usuário. Texto novo = mudar a versão na
migração e em `src/lib/privacidade.ts`; todo aluno aceita de novo. O professor
não precisa aceitar. O consentimento de uso de imagem fica para quando existir
vídeo. Texto revisável por profissional de direito; e-mail de contato a definir.
Origem: issue 17.

Atualização (2026-10-28): versão do texto passou a 2026-10-28 (retenção e
"quem vê" corrigidos; responsável identificado). A versão no banco tem uma
fonte só, `versao_privacidade_atual()`. Cada aceite entra em
`aceites_privacidade` (histórico: aluno, versão, data), gravado só por
`aceitar_privacidade()`; aluno vê os próprios, professor vê todos.
Base legal: execução do serviço de assessoria contratado (não consentimento
livre); por isso o texto diz que sem os dados não é possível usar o app.
Pendências: preencher responsável, CPF/CNPJ e e-mail (e religar o teste
`it.skip`); revisão por profissional de direito; a limpeza automática de 6
meses ainda não existe.
