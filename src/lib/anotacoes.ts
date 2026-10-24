import type { SupabaseClient } from '@supabase/supabase-js'
import type { Resposta } from './alunos'
import type { Anotacao, Treino } from './tipos'
import { executar, executarAfetando } from './treinos'

const LIMITE = 100
const COLUNAS = 'id, letra, data, texto'

// Data de hoje (AAAA-MM-DD) no fuso de São Paulo, não no do aparelho nem UTC.
export const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

// '2026-10-22' -> '22/10/2026' (sem passar por Date, que mudaria o dia pelo fuso).
export const formatarData = (data: string) => data.split('-').reverse().join('/')

// Mais recentes primeiro. Com letra: só as daquele treino. O RLS já limita ao
// próprio aluno (ou a todos, para o professor); o filtro por aluno é explícito.
export async function listarAnotacoes(
  cliente: SupabaseClient,
  alunoId: string,
  letra?: Treino['letra'],
): Promise<Resposta<Anotacao[]>> {
  let consulta = cliente.from('anotacoes').select(COLUNAS).eq('aluno_id', alunoId)
  if (letra) consulta = consulta.eq('letra', letra)
  const r = await executar<Anotacao[]>(
    consulta.order('data', { ascending: false }).order('criado_em', { ascending: false }).limit(LIMITE),
  )
  return r.ok ? { ok: true, dados: r.dados ?? [] } : r
}

// Não envia aluno_id: o banco usa o usuário logado (e o app nem tem permissão
// de escolher o dono). criado_em/atualizado_em também são do banco.
export const criarAnotacao = (cliente: SupabaseClient, nova: Pick<Anotacao, 'letra' | 'data' | 'texto'>) =>
  executar(cliente.from('anotacoes').insert(nova))

// Só data e texto mudam depois de criada.
export const salvarAnotacao = (cliente: SupabaseClient, id: string, mudancas: Pick<Anotacao, 'data' | 'texto'>) =>
  executarAfetando(cliente.from('anotacoes').update(mudancas).eq('id', id).select('id'))

export const removerAnotacao = (cliente: SupabaseClient, id: string) =>
  executarAfetando(cliente.from('anotacoes').delete().eq('id', id).select('id'))
