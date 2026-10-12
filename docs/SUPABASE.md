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
| `20261012000000_perfis.sql` | Perfis professor/aluno com RLS (issue 02) | pendente |
