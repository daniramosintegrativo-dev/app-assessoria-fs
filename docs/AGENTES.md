# Estratégia multiagente

Regra de ouro: o modelo mais barato que resolve **de primeira**.
Retrabalho custa mais que usar o modelo certo.
Definições dos subagentes em `.claude/agents/`.

| Agente | Modelo | Quando usar |
|---|---|---|
| Orquestrador (sessão principal) | Sonnet, esforço máximo | Conversa com o usuário, grilling, planejamento, delegação, integração |
| `explorador` | Haiku | Ler/buscar no código e na documentação, resumir arquivos, achar onde algo está |
| `documentador` | Haiku | Atualizar docs, descrição de PR, changelog, textos da interface já definidos |
| `implementador` | Sonnet | Implementar uma issue com TDD (front, Edge Functions, SQL simples) |
| `arquiteto` | Opus | Modelo de dados, políticas RLS, fluxo de vídeo (tokens Bunny), decisões estruturais. Uso pontual |
| `revisor-seguranca` | Opus | Revisar PRs que tocam auth, RLS, Edge Functions, vídeo ou dados pessoais |

## Por que não usar Fable
Fable é do nível Mythos: mais caro que Opus e com salvaguardas extras em
cibersegurança, que podem atrapalhar justamente revisões de segurança.
Para um PWA simples, Opus cobre com folga o que é difícil.

## Regras de delegação
- Tarefa de leitura ou texto mecânico → Haiku. Se o Haiku errar duas
  vezes, subir para Sonnet (não insistir).
- Código de issue → Sonnet.
- Qualquer coisa que, se errada, expõe dados ou vídeo pago → Opus.
- O orquestrador não escreve código grande: delega e revisa.
- Rodar agentes em paralelo só quando as tarefas não tocam os mesmos
  arquivos.
