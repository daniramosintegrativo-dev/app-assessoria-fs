import type { SupabaseClient } from '@supabase/supabase-js'
import type { Resposta } from './alunos'
import type { Treino } from './tipos'

export const LETRAS: Treino['letra'][] = ['A', 'B', 'C', 'D']

const ERRO_PADRAO = 'Algo deu errado. Tente de novo.'

// Acesso direto ao banco: quem protege é o RLS (só o professor escreve).
// Erros do banco não vão para a tela (podem expor detalhes); só a mensagem padrão.
async function executar<T>(consulta: PromiseLike<{ data: T | null; error: unknown }>): Promise<Resposta<T | null>> {
  try {
    const { data, error } = await consulta
    return error ? { ok: false, erro: ERRO_PADRAO } : { ok: true, dados: data }
  } catch {
    return { ok: false, erro: ERRO_PADRAO }
  }
}

export async function listarTreinos(cliente: SupabaseClient, alunoId: string): Promise<Resposta<Treino[]>> {
  const r = await executar<Treino[]>(
    cliente.from('treinos').select('letra, texto').eq('aluno_id', alunoId).order('letra'),
  )
  return r.ok ? { ok: true, dados: r.dados ?? [] } : r
}

export const criarTreino = (cliente: SupabaseClient, alunoId: string, letra: Treino['letra']) =>
  executar(cliente.from('treinos').insert({ aluno_id: alunoId, letra }))

export const salvarTreino = (cliente: SupabaseClient, alunoId: string, letra: Treino['letra'], texto: string) =>
  executar(
    cliente
      .from('treinos')
      .update({ texto, atualizado_em: new Date().toISOString() })
      .eq('aluno_id', alunoId)
      .eq('letra', letra),
  )

export const removerTreino = (cliente: SupabaseClient, alunoId: string, letra: Treino['letra']) =>
  executar(cliente.from('treinos').delete().eq('aluno_id', alunoId).eq('letra', letra))
