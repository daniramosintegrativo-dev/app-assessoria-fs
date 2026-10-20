import type { SupabaseClient } from '@supabase/supabase-js'

export type Resposta<T> = { ok: true; dados: T } | { ok: false; erro: string }

const ERRO_PADRAO = 'Algo deu errado. Tente de novo.'

// Chama a Edge Function gerenciar-aluno e devolve a mensagem de erro dela, se houver.
export async function chamarGerenciarAluno<T>(
  cliente: SupabaseClient,
  body: Record<string, unknown>,
): Promise<Resposta<T>> {
  try {
    const { data, error } = await cliente.functions.invoke('gerenciar-aluno', { body })
    if (!error) return { ok: true, dados: data as T }
    // Em resposta de erro HTTP, a mensagem amigável vem no corpo.
    const resposta = (error as { context?: { json?: () => Promise<{ erro?: unknown }> } }).context
    const corpo = await resposta?.json?.().catch(() => null)
    return { ok: false, erro: typeof corpo?.erro === 'string' ? corpo.erro : ERRO_PADRAO }
  } catch {
    return { ok: false, erro: ERRO_PADRAO }
  }
}

// Desativar corta o acesso na hora; reativar devolve o acesso com a mesma senha.
export const desativarAluno = (cliente: SupabaseClient, id: string) =>
  chamarGerenciarAluno<{ ok: true; aviso?: string }>(cliente, { acao: 'desativar', id })

export const ativarAluno = (cliente: SupabaseClient, id: string) =>
  chamarGerenciarAluno<{ ok: true }>(cliente, { acao: 'ativar', id })
