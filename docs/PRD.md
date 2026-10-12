# PRD — App Assessoria FS

Status: perguntas P1 a P12 respondidas pelo professor (2026-10-12).
Issues criadas no GitHub (01 a 20).

## Problema
O professor acompanha alunos à distância com planilhas, arquivos Word e
vídeos espalhados. O aluno não tem um lugar único para ver o treino,
aprender os movimentos e mandar feedback.

## Usuários
- **Aluno**: acessa treino, vídeos e envia feedback. Uso principal no
  celular, muitas vezes durante o treino.
- **Professor**: monta treinos, publica vídeos, responde alunos.

## Funcionalidades do aluno
1. **Planejamento de carga** — visão da progressão de cargas ao longo
   das semanas/ciclos.
2. **Lista de treino**
   - Esqueleto do treino (exercícios, séries, repetições, carga, descanso).
   - Campo de observações por treino/exercício.
   - Diálogo aluno ↔ professor (comentários no treino).
   - Link para o documento Word no Drive (ver pergunta P3).
3. **Prateleira de feedbacks** — aluno envia vídeos próprios treinando;
   professor comenta. Vídeos ficam arquivados para sempre (D4b).
4. **Prateleira de vídeos**
   - Consciência do movimento e treino.
   - Iniciando o treino: conexão com o corpo, alongamento, aquecimento.
   - Sequenciais de treino: básico (sequência 1, 2, 3…); nível 2
     (faixa amarela); próximos níveis.
   - Meditação e controle de ansiedade.
5. **Como funciona a assessoria**
   - Como entender a sequência das semanas de treino.
   - Metodologia de progressão dos três ciclos da planilha.

## Funcionalidades do professor (lacuna preenchida)
- Convidar, ativar e desativar alunos.
- Criar e editar treinos e planejamento de carga por aluno.
- Publicar vídeos e organizá-los em prateleiras/níveis.
- Ver e responder feedbacks e diálogos.
- Painel simples: o que tem de novo desde o último acesso.

## Requisitos não funcionais
- PWA instalável no celular; mobile-first.
- Usável durante o treino: botões grandes, pouco texto, alto contraste.
- Vídeos protegidos (só aluno logado e ativo assiste).
- Aluno desativado perde acesso imediatamente.
- LGPD: consentimento para uso de imagem nos vídeos enviados; dados de
  saúde tratados como sensíveis; aluno pode pedir exclusão.
- Custo dentro de D2.

## PAR-Q (questionário de prontidão para atividade física) — adicionado 2026-10-12
Fica no arquivo (cadastro) de cada aluno.
- O aluno preenche no app no primeiro acesso e a resposta é guardada com data. Pode refazer quando o professor pedir.
- Perguntas (rascunho baseado no PAR-Q brasileiro padrão; texto exato a confirmar com o professor), todas de sim/não:
  1. Algum médico já disse que você possui algum problema de coração e que só deveria realizar atividade física supervisionada por profissionais de saúde?
  2. Você sente dores no peito quando pratica atividade física?
  3. No último mês, você sentiu dores no peito quando praticava atividade física?
  4. Você apresenta desequilíbrio devido a tontura e/ou perda de consciência?
  5. Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?
  6. Você toma atualmente algum medicamento para pressão arterial e/ou problema de coração?
  7. Sabe de alguma outra razão pela qual você não deveria praticar atividade física?
- Se alguma resposta for "sim", o professor vê um alerta no cadastro do aluno.
- Dado de saúde = sensível (LGPD): só o aluno e o professor veem; entra na regra de apagar tudo após 6 meses de inatividade; consentimento explícito antes de enviar.
- A decidir: o "sim" apenas alerta o professor, ou bloqueia a ficha até liberação?

## Fora do escopo (v1)
- Pagamentos e cobrança (continuam fora do app).
- Chat em tempo real.
- App nativo nas lojas.

## Respostas do professor (2026-10-12)
- **P1:** o aluno anota sozinho as cargas (séries, repetições e peso) num campo de anotação.
- **P2:** cada aluno acessa uma planilha exclusiva, dividida na quantidade de treinos criada para ele. Formato de descrição: a escolher (ver conversa).
- **P2 (detalhe):** a maioria dos alunos tem treino A, B e C; boa parte tem só A e B. Os abdominais são uma parte separada, incluída nos dias de treino.
- **P2 (abdominais):** conteúdo comum a todos os alunos, com sequência de progressão própria, independente de A/B/C. Cada aluno segue a progressão individual, conforme tempo de experiência e treinos acumulados. Incluídos nos dias de treino, com a orientação de como progredir.
  v1 confirmado em 2026-10-12: página única de abdominais para todos + campo curto por aluno "em que etapa você está", preenchido pelo professor. Sem avanço automático.
- **P2 (formato):** cada treino (A, B, C) é um bloco de texto escrito pelo professor, com campo de anotação de cargas do aluno embaixo. Confirmado em 2026-10-12.
- **P2 (estrutura pronta para A, B, C e D):** o app deve suportar treinos A, B, C e D desde a v1. O professor define quantos cada aluno tem (de 1 a 4), sem mudar o app.
- **Vídeos (v1, confirmado em 2026-10-12):** 4 tipos: treino e consciência (prateleiras do professor); feedback do aluno e feedback do professor (privados entre os dois). Feedback do professor fica ligado ao vídeo do aluno e também pode ser avulso.
- **P5 (2026-10-12):** conversa GERAL por aluno com o professor, separada do vídeo de feedback. Serve para dúvidas de toda sorte: exercícios, energia gasta (pouca/muita), treino longo ou curto, e também assuntos emocionais, mentais e de estresse. Conteúdo sensível: privado entre aluno e professor (LGPD).
- **P6:** sim, o aluno é avisado quando o professor responde ou publica algo (no iPhone só com o app instalado na tela inicial).
- **P9:** 5 vídeos do professor, média de 15 min cada.
- **P10:** FS = Físico Sagrado, metodologia do professor. Existem duas logos (uma criada por ele, mais autoral; outra do Instagram, feita por designer com cores sugeridas por ele, que ele quer refinar). Falta receber os arquivos.
- **P11:** não, só o professor administra.
- **P12:** mantém o histórico enquanto ativo; após 6 meses de inatividade, TUDO é apagado (planilha, conversa e vídeos de feedback). Confirmado em 2026-10-12.
- **P3:** campo de anotação simples, tipo bloco de notas, dentro do app (preferido). Sem depender do Word.
- **P4:** v1 só o básico. Sem divisão por níveis/faixas/evolução. Prioridade: (1) local da planilha; (2) vídeos e subclasses: treino, consciência, feedback do aluno para o professor, feedback do professor para o aluno.
- **P7:** login por e-mail e senha (convite do professor continua obrigatório). Sem e-mail automático: senha provisória enviada pelo professor (D13).

- **P8:** cada vídeo de feedback tem no máximo 1 minuto e cada aluno pode enviar até 6 por semana.

## Perguntas originais (todas respondidas em 2026-10-12; ver "Respostas do professor")
- **P1 — Planejamento de carga:** o que o aluno registra? Só vê a carga
  prescrita ou também anota a carga que usou em cada série?
- **P2 — Estrutura do treino:** como é hoje um treino típico? (Pedir um
  exemplo real da planilha.) Existem divisões A/B/C? Semanas? Ciclos?
- **P3 — Word no Drive:** o Word continua existindo ou o conteúdo passa
  a viver dentro do app? (Recomendação: migrar para o app; manter o link
  só na transição.)
- **P4 — Níveis/faixas:** os vídeos de nível 2 (faixa amarela) ficam
  bloqueados até o professor liberar? Quais são todas as faixas?
- **P5 — Diálogo:** comentários por treino, por exercício ou uma
  conversa geral por aluno?
- **P6 — Notificações:** o aluno deve ser avisado quando o professor
  responde ou publica treino? (Push em PWA funciona, mas no iPhone só
  com o app instalado na tela inicial.)
- **P7 — Login:** link mágico por e-mail (sem senha) ou e-mail + senha?
  (Recomendação: link mágico — mais simples e seguro.)
- **P8 — Feedbacks:** limite de duração/tamanho por vídeo? Quantos por
  semana?
- **P9 — Vídeos do professor:** quantos existem hoje e qual o tamanho
  total aproximado? Já estão gravados?
- **P10 — Nome e marca:** "FS" significa o quê? Existe logo?
- **P11 — Mais alguém administra** além do professor (assistente)?
- **P12 — Aluno inativo:** mantém histórico ou apaga após X meses?
