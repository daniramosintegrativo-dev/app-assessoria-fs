# Lista de tarefas (rascunho para virar issues no GitHub)

Cada item é uma fatia pequena e testável. Ordem sugerida. Quando o GitHub estiver
conectado, cada uma vira uma issue (uma issue = uma branch = um PR).
Itens marcados [SEG] passam pelo agente `revisor-seguranca`.

## Fundação
1. Projeto base: Vite + React + TypeScript, instalável no celular (PWA), tema claro com bordas finas nas cores da logo, hospedado na Cloudflare Pages.
2. [SEG] Banco no Supabase com perfis `professor` e `aluno`, regras de acesso (RLS) em todas as tabelas.
3. [SEG] Login por e-mail e senha; sem cadastro público; professor convida o aluno; recuperar senha.
4. [SEG] Professor ativa/desativa aluno; desativado perde acesso na hora.

## Planilha
5. Professor cria a ficha do aluno: treinos A, B, C, D (1 a 4), cada um em bloco de texto.
6. Aluno vê só a própria ficha, por treino.
7. Aluno anota cargas (séries, repetições, peso) em campo de anotação por treino.
8. Página única de abdominais (todos veem) + campo "etapa atual" por aluno, editado pelo professor.

## Vídeos
9. [SEG] Conexão com o Bunny por Edge Function (chaves só no servidor); links assinados que expiram.
10. [SEG] Prateleira de vídeos de treino/exercícios (professor publica, aluno assiste).
11. [SEG] Prateleira de vídeos de consciência (mesma estrutura).
12. [SEG] Feedback do aluno: envio de vídeo até 1 min, até 6 por semana; só o professor e o próprio aluno veem.
13. [SEG] Feedback do professor: resposta ligada ao vídeo do aluno e vídeo avulso; só o aluno destinatário vê.

## Conversa e avisos
14. [SEG] Conversa geral aluno-professor (texto), privada.
15. Avisos (push) quando o professor responde ou publica algo.
16. Painel do professor: o que há de novo desde o último acesso.

## Privacidade e manutenção
17. [SEG] Consentimento de uso de imagem no primeiro envio de vídeo; aluno pode pedir exclusão.
18. [SEG] Apagar tudo de aluno inativo há 6 meses (aviso por e-mail 30 dias antes).
19. Aviso automático a cada 3 dias para o Supabase não pausar.
