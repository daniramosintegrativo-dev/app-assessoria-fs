# Skills

O repositório `mattpocock/skills` muda com frequência. Antes de instalar,
o Claude Code deve conferir no GitHub se os nomes abaixo ainda existem e
avisar o usuário sobre qualquer diferença.

## Instalação (rodar na raiz do projeto, uma linha por vez)
Instalador interativo, marcando as skills da lista:
`npx skills@latest add mattpocock/skills`

Em seguida, uma vez por repositório, rodar `/setup-matt-pocock-skills`
e escolher **GitHub** como rastreador de issues.

## Do Matt Pocock
| Skill | Para quê |
|---|---|
| `grill-me` | Interrogatório até resolver toda ambiguidade (etapa DIALOGAR) |
| `grill-with-docs` | Igual, mas atualiza CONTEXT.md e decisões enquanto conversa |
| `to-prd` | Transforma a conversa em PRD (etapa PLANEJAR) |
| `to-issues` | Quebra o PRD em issues de fatia vertical no GitHub |
| `tdd` | Implementa com teste primeiro (etapa CODAR) |
| `prototype` | Protótipo descartável de tela para testar uma ideia |
| `diagnosing-bugs` | Investigação estruturada de bugs |
| `handoff` | Resume a sessão para continuar em um chat novo |
| `git-guardrails-claude-code` | Bloqueia comandos git perigosos (ex.: push --force) |

Pocock não tem skill de design visual (`design-an-interface` é sobre
código). Para visual, usar a da Anthropic abaixo.

## Da Anthropic
| Skill | Para quê |
|---|---|
| `frontend-design` | Direção visual, tipografia e paleta sem cara de template |
Fonte: repositório `anthropics/skills` (conferir o caminho atual).

## Ordem de uso no projeto
1. `/grill-me` com as perguntas abertas do PRD e do DESIGN.
2. `frontend-design` para propor as direções visuais.
3. `/to-prd` para consolidar.
4. `/to-issues` para criar as issues.
5. Por issue: `implementador` com `/tdd` → PR → `revisor-seguranca`
   quando aplicável → merge.
