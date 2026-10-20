// Edge Function gerenciar-aluno (issue 03): só o professor ativo chama.
// Ações: criar aluno, gerar nova senha provisória, listar alunos.
// As chaves vêm do ambiente (o Supabase injeta); nada fica no código.
import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
import { gerarSenhaProvisoria, lerPedido } from '../_shared/aluno.ts'

// A autorização é pelo token (não por cookie), então aceitar qualquer origem é seguro.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// no-store: a resposta pode conter a senha provisória.
function responder(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return responder({ erro: 'Método não permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const servico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !servico) return responder({ erro: 'Servidor mal configurado.' }, 500)

  // 1. Quem chama? Valida o token no Auth (não confia só no conteúdo do JWT).
  const autorizacao = req.headers.get('Authorization')
  if (!autorizacao) return responder({ erro: 'Faça login.' }, 401)
  const cliente = createClient(url, anon, { global: { headers: { Authorization: autorizacao } } })
  const { data: dadosUsuario, error: erroUsuario } = await cliente.auth.getUser()
  if (erroUsuario || !dadosUsuario.user) return responder({ erro: 'Faça login.' }, 401)

  // 2. Precisa ser professor ATIVO. Cliente de serviço ignora o RLS: usar com cuidado.
  const admin = createClient(url, servico, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: quem } = await admin
    .from('perfis')
    .select('papel, ativo')
    .eq('id', dadosUsuario.user.id)
    .maybeSingle()
  if (!quem || quem.papel !== 'professor' || !quem.ativo) {
    return responder({ erro: 'Acesso negado.' }, 403)
  }

  // 3. Pedido.
  let corpo: unknown
  try {
    corpo = await req.json()
  } catch {
    return responder({ erro: 'Pedido inválido.' }, 400)
  }
  const lido = lerPedido(corpo)
  if (!lido.ok) return responder({ erro: lido.erro }, 400)
  const pedido = lido.pedido

  try {
    if (pedido.acao === 'criar') {
      const senha = gerarSenhaProvisoria()
      const { data, error } = await admin.auth.admin.createUser({
        email: pedido.email,
        password: senha,
        email_confirm: true,
      })
      if (error || !data.user) {
        if (error?.code === 'email_exists') {
          return responder({ erro: 'Já existe uma conta com esse e-mail.' }, 409)
        }
        return responder({ erro: 'Não foi possível cadastrar o aluno.' }, 500)
      }
      // O gatilho do banco já criou o perfil (aluno, desativado): ativa e exige troca.
      const { error: erroPerfil } = await admin
        .from('perfis')
        .update({ nome: pedido.nome, ativo: true, precisa_trocar_senha: true })
        .eq('id', data.user.id)
      if (erroPerfil) {
        // Desfaz a conta para não sobrar aluno sem nome e sem troca obrigatória.
        await admin.auth.admin.deleteUser(data.user.id)
        return responder({ erro: 'Não foi possível cadastrar o aluno.' }, 500)
      }
      return responder({ id: data.user.id, senha_provisoria: senha })
    }

    if (pedido.acao === 'nova_senha') {
      const { data: alvo } = await admin
        .from('perfis')
        .select('papel')
        .eq('id', pedido.id)
        .maybeSingle()
      // Só alunos: a senha do professor não é gerada por aqui.
      if (!alvo || alvo.papel !== 'aluno') return responder({ erro: 'Aluno não encontrado.' }, 404)
      const senha = gerarSenhaProvisoria()
      // Liga a troca obrigatória ANTES de mudar a senha (falha no meio não deixa brecha).
      const { error: erroFlag } = await admin
        .from('perfis')
        .update({ precisa_trocar_senha: true })
        .eq('id', pedido.id)
      if (erroFlag) return responder({ erro: 'Não foi possível gerar a senha.' }, 500)
      const { error } = await admin.auth.admin.updateUserById(pedido.id, { password: senha })
      if (error) return responder({ erro: 'Não foi possível gerar a senha.' }, 500)
      return responder({ senha_provisoria: senha })
    }

    // listar: nome/ativo vêm de perfis; o e-mail só existe no Auth.
    const { data: perfis, error: erroPerfis } = await admin
      .from('perfis')
      .select('id, nome, ativo')
      .eq('papel', 'aluno')
      .order('nome')
    if (erroPerfis) return responder({ erro: 'Não foi possível listar.' }, 500)
    // Escala de até 40 alunos (D1): uma página de 1000 basta.
    const { data: contas, error: erroContas } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (erroContas) return responder({ erro: 'Não foi possível listar.' }, 500)
    const emails = new Map(contas.users.map((u) => [u.id, u.email ?? '']))
    return responder({
      alunos: perfis.map((p) => ({ ...p, email: emails.get(p.id) ?? '' })),
    })
  } catch {
    // Sem detalhes na resposta: erros internos não vazam.
    return responder({ erro: 'Erro inesperado.' }, 500)
  }
})
