# Skills

O repositório `mattpocock/skills` muda com frequência. Antes de instalar,
o Claude Code deve conferir no GitHub se os nomes abaixo ainda existem e
avisar o usuário sobre qualquer diferença.

## Instalação (feita em 2026-10-13)
Copiadas de `mattpocock/skills` (commit `49dd158`, licença MIT em
`.claude/skills/LICENSE-mattpocock`) para `.claude/skills/`, sem os arquivos
`agents/openai.yaml` (são do Codex). Ficam no repositório: qualquer sessão do
Claude Code neste projeto já as encontra. Configuração equivalente ao
`/setup-matt-pocock-skills` já feita: GitHub como rastreador
(`docs/agents/issue-tracker.md`), domínio single-context (`docs/agents/domain.md`).
Para atualizar: comparar com o repositório original e copiar de novo, lendo
as mudanças antes.

## Do Matt Pocock
| Skill | Para quê |
|---|---|
| `grill-me` | Interrogatório até resolver toda ambiguidade (etapa DIALOGAR) |
| `grill-with-docs` | Igual, mas atualiza CONTEXT.md e decisões enquanto conversa |
| `to-spec` | Transforma a conversa em especificação no GitHub (etapa PLANEJAR; antigo `to-prd`) |
| `to-tickets` | Quebra a especificação em issues de fatia vertical (antigo `to-issues`) |
| `tdd` | Implementa com teste primeiro (etapa CODAR) |
| `prototype` | Protótipo descartável de tela para testar uma ideia |
| `diagnosing-bugs` | Investigação estruturada de bugs |
| `handoff` | Resume a sessão para continuar em um chat novo |
| `grilling`, `domain-modeling`, `codebase-design` | Usadas por dentro de `grill-me`, `grill-with-docs` e `tdd` |
| `setup-matt-pocock-skills` | Reconfigura rastreador de issues e docs de domínio |

Não instalada: `git-guardrails-claude-code` (mexe em hooks do Claude Code;
avaliar à parte).

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
3. `/to-spec` para consolidar.
4. `/to-tickets` para criar as issues.
5. Por issue: `implementador` com `/tdd` → PR → `revisor-seguranca`
   quando aplicável → merge.
