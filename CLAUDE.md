# App Assessoria FS

PWA para alunos de uma assessoria de treino (força, calistenia, musculação,
flexibilidade, mobilidade e meditação). O professor administra, o aluno acessa.

## Ritual de início de sessão (obrigatório)
1. Leia `docs/DECISOES.md` e apresente ao usuário, em poucas linhas, as
   decisões registradas. Pergunte se alguma mudou.
2. Leia as seções "Perguntas em aberto" de `docs/PRD.md` e `docs/DESIGN.md`.
   Enquanto houver perguntas sem resposta que bloqueiem a tarefa atual,
   resolva-as primeiro (use `/grill-me`) antes de escrever código.
3. Confira as issues abertas no GitHub e diga qual é a próxima.

## Sobre quem opera
- Não é programador. Explique em português simples, sem jargão.
- Uma etapa por vez. Aguarde confirmação antes de avançar.
- Comandos de terminal sempre em UMA linha (blocos multilinha geram alerta).
- Quando houver opção ousada e opção segura, mostre as duas e recomende.
- Se não souber algo com certeza, diga. Nunca invente.

## Fluxo de trabalho
DIALOGAR → PLANEJAR → CODAR, usando as skills:
- Dialogar: `/grill-me` (ou `/grill-with-docs`) até não haver ambiguidade.
- Planejar: `/to-spec` transforma a conversa em especificação (issue no
  GitHub) e atualiza o PRD; `/to-tickets` quebra em issues de fatia vertical.
- Codar: uma issue = uma branch = um PR. Implementar com `/tdd`.
Detalhes em `docs/SKILLS.md`.

## Multiagentes
Orquestrador: Opus (D11, revisada em 2026-10-13). Delegue a subagentes com o
modelo adequado a cada tarefa, conforme `docs/AGENTES.md`.
Nunca use um modelo mais caro do que a tarefa exige, nem um mais fraco
que vá gerar retrabalho.

## Stack
Vite + React + TypeScript + PWA · Supabase (Auth, Postgres, Edge Functions)
· Bunny Stream (vídeos) · Cloudflare Pages (hospedagem) · GitHub.
Justificativas em `docs/DECISOES.md`.

## Regras de segurança (inegociáveis)
- Nenhuma chave secreta no código ou no front. Só em secrets do Supabase,
  do GitHub e da Cloudflare. Manter `.env.example` sem valores reais.
- Chaves do Bunny ficam SOMENTE em Edge Functions.
- Toda tabela nasce com RLS ativado e política explícita.
- PRs que tocam auth, RLS, Edge Functions ou vídeo passam pelo agente
  `revisor-seguranca` antes do merge.
- Sem cadastro público: aluno só entra por convite do professor.

## Documentos
- `docs/PRD.md` — o que o app faz (requisitos)
- `docs/DESIGN.md` — diretrizes visuais
- `docs/DECISOES.md` — decisões tomadas e seus porquês
- `docs/AGENTES.md` — qual modelo faz o quê
- `docs/SKILLS.md` — skills a instalar e como usar

## Agent skills

### Issue tracker

Issues no GitHub (`daniramosintegrativo-dev/app-assessoria-fs`). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context (`GLOSSARY.md` e `docs/adr/` na raiz, criados quando precisar). See `docs/agents/domain.md`.
