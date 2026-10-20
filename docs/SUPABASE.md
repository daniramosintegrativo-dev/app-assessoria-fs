# Supabase — como aplicar o banco

As mudanças no banco ficam em `supabase/migrations/`, uma por arquivo, em ordem
de data. Cada uma é aplicada UMA vez, na ordem.

## Projeto (criado em 2026-10-12)
- Organização "Físico Sagrado", plano Free. Projeto `fisico-sagrado`, região São Paulo.
- Enable Data API: ligado. Automatically expose new tables: DESLIGADO
  (cada migração libera o acesso explicitamente). Enable automatic RLS: ligado.
- A senha do banco fica só com o dono da conta, nunca no repositório.

## Antes de tudo: desligar o cadastro público (obrigatório)
No painel do Supabase: **Authentication** → **Sign In / Providers** (o nome
pode variar um pouco):
- Desligue **Allow new users to sign up**.
- Desligue **Allow anonymous sign-ins**.

Mesmo que alguém religue isso por engano, toda conta nova nasce **desativada**
e não vê nada até o professor ativar (convite da issue 03 ou painel).

## Aplicar uma migração (pelo painel, sem instalar nada)
1. Abra o projeto em https://supabase.com/dashboard.
2. Menu da esquerda: **SQL Editor** → **New query**.
3. Cole o conteúdo inteiro do arquivo da migração e clique em **Run**.
4. Deve aparecer "Success. No rows returned". Se aparecer erro (por exemplo,
   falta de permissão no schema `auth`), copie a mensagem e não continue.

## Tornar o professor administrador (uma vez só)
Toda conta nova nasce como **aluno desativado**. Para promover o professor:
1. Crie a conta dele em **Authentication** → **Users** → **Add user**.
2. No **SQL Editor**, rode (troque o e-mail e o nome):

`update public.perfis set papel = 'professor', ativo = true, nome = 'Nome do Professor' where id = (select id from auth.users where email = 'email@do.professor');`

Deve aparecer "Success. 1 row affected" (ou "1 row").

## Regra para as próximas tabelas
Toda política de acesso a conteúdo usa `public.e_professor()` ou
`public.e_aluno_ativo()`. Assim, aluno desativado perde acesso na hora.

## Testar as regras de acesso localmente
`npm run test:db` cria um Postgres temporário, aplica as migrações e roda os
testes de `supabase/tests/`. Não toca no Supabase de verdade.

## Migrações aplicadas
| Arquivo | O que faz | Aplicada no Supabase? |
|---|---|---|
| `20261012000000_perfis.sql` | Perfis professor/aluno com RLS (issue 02) | sim, 2026-10-12 |
| `20261013000000_senha_provisoria.sql` | Marca de troca obrigatória de senha e `senha_trocada()` (issue 03) | sim, 2026-10-13 |
| `20261020000000_keepalive.sql` | Tabela mínima que o workflow keepalive consulta (issue 19) | sim, 2026-10-20 |
| `20261021000000_encerrar_sessoes.sql` | Função `encerrar_sessoes()` só para o serviço: derruba sessões abertas (issue 04) | pendente |
| `20261021000100_senha_provisoria_em.sql` | `senha_provisoria_em`: token antigo não zera a troca de senha (issue 04) | pendente |
| `20261021000200_ativo_so_pela_funcao.sql` | Tira do app o update direto de `ativo`: só a Edge Function ativa/desativa (issue 04) | pendente |

Depois de aplicar a migração, publique de novo a função `gerenciar-aluno`
(ela passou a chamar `encerrar_sessoes`).

## Exigir senha de 8+ caracteres (obrigatório)
O app já exige 8 caracteres na tela, mas a regra de verdade fica no Supabase:
**Authentication** → **Sign In / Providers** → **Email** → **Minimum password
length** = `8` (o padrão é 6). Salve. Feito em 2026-10-20.

## Edge Functions: publicação automática (recomendado)
O workflow `.github/workflows/deploy-functions.yml` publica as funções sempre
que algo em `supabase/functions/` muda na `main` (ou ao rodar manualmente em
GitHub → Actions → deploy-functions → Run workflow).
Configuração única:
1. Supabase → avatar (canto superior direito) → **Account preferences** →
   **Access Tokens** → **Generate new token** (nome: `github-deploy`).
   Escopo: **Project** → projeto `fisico-sagrado`; permissões: só
   **Edge Functions = Read-write**, todo o resto **None**. Copie.
   Se pedir validade, prefira uma data e troque o token quando vencer.
2. GitHub → repositório → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret**: nome `SUPABASE_ACCESS_TOKEN`,
   valor = o token. O token não fica em nenhum outro lugar.

## Edge Function gerenciar-aluno: como publicar pelo painel (alternativa manual)
Ela cadastra aluno, gera senha provisória e lista os alunos (só o professor
ativo consegue chamar). Passo a passo:
1. No repositório, rode `npm run build:function`. Isso gera o arquivo único
   `supabase/functions/gerenciar-aluno/PAINEL.ts` (função + módulo
   `_shared/aluno.ts` juntos; o editor do painel não garante vários arquivos).
   O `PAINEL.ts` também fica no GitHub, pronto para copiar.
2. No painel: **Edge Functions** → **Deploy a new function** → **Via Editor**.
3. Nome da função: `gerenciar-aluno` (exatamente assim).
4. Apague o código de exemplo, cole o conteúdo inteiro de `PAINEL.ts` e clique
   em **Deploy**.
5. Não precisa criar segredos: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
   `SUPABASE_SERVICE_ROLE_KEY` são injetadas pelo Supabase.
6. Deixe ligada a opção de verificar o JWT (padrão). Ela é uma camada extra;
   a função também confere se quem chama é professor ativo.
Sempre que mudar `supabase/functions/`, rode `npm run build:function` e
publique de novo.

## Endereço e chave pública do app (2026-10-20)
O endereço do projeto e a chave **publishable** (`sb_publishable_…`) ficam no
código, em `src/lib/supabase.ts`. São públicos por natureza (vão no navegador
de qualquer aluno); quem protege os dados é o RLS. Assim a Cloudflare não
precisa de variáveis do Supabase (só `NODE_VERSION = 22`).
NUNCA coloque a chave `secret` / `service_role` no código nem na Cloudflare.
Se a chave publishable for trocada no painel, atualize `src/lib/supabase.ts`
e `.github/workflows/supabase-keepalive.yml`.

## Projeto pausado
O plano gratuito pausa o projeto após ~7 dias sem uso (aconteceu em
2026-10-20). Para voltar: página inicial do projeto → **Resume project** (não
"Upgrade to Pro"). O workflow `supabase-keepalive` evita isso consultando a
tabela `keepalive` a cada 3 dias.

## Como o acesso funciona (D13)
- Professor cadastra o aluno no app (nome + e-mail) e recebe uma senha
  provisória, mostrada uma única vez. Envie pelo WhatsApp.
- No primeiro acesso o aluno é obrigado a criar a própria senha.
- "Esqueci a senha": o aluno avisa o professor, que usa **Gerar nova senha**
  na lista de alunos.

## Pendências de segurança (revisões das issues 02 e 03)
Issue 04 (ativar/desativar): desativar bloqueia no Auth (`ban_duration`) e encerra
as sessões; "Gerar nova senha" também encerra. Ficou para conferir no Supabase real:
- Se `encerrar_sessoes` consegue apagar de `auth.sessions` (função dona = `postgres`).
  Teste: desative um aluno logado e veja se ele cai ao renovar a sessão.
- O token de acesso (JWT) já emitido vale até expirar (padrão 1 hora), mas o RLS
  já bloqueia o conteúdo na hora porque o perfil fica inativo.
- Se o encerramento falhar (nova senha ou desativar), a tela avisa o professor.
  Ao desativar, o acesso já está bloqueado; sessões abertas podem durar até 1 hora.
- Políticas de tabelas futuras DEVEM usar `e_aluno_ativo()` / `e_professor()`; só
  assim o bloqueio de quem foi desativado vale na hora.
Para as issues de vídeo:
- A Edge Function do Bunny valida o token com `getUser()` e confere `e_aluno_ativo()`
  antes de assinar qualquer URL.
Para as issues 17/18 (LGPD):
- Falta o caminho de exclusão definitiva do aluno (apagar conta e dados a pedido).
Para depois:
- `senha_trocada()` poderia provar que a senha mudou (comparar hash). Hoje o impacto
  é baixo: com troca pendente, `e_aluno_ativo()` é falso e nenhum conteúdo é liberado.
- Professor pode desativar outro professor (aceitável com um professor só).
