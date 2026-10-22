import type { SupabaseClient } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { Anotacao, Perfil, Treino } from '../lib/tipos'

type Opcoes = {
  sessao?: boolean
  perfil?: Perfil | null
  erroPerfil?: boolean
  // Treinos já salvos (de um aluno só). falhaTreinos: gravar/apagar devolve erro.
  treinos?: Treino[]
  falhaTreinos?: boolean
  // Gravar/apagar não afeta linha nenhuma, sem erro (como o RLS faz ao bloquear).
  semEfeitoTreinos?: boolean
  // Ler os treinos devolve erro.
  falhaConsulta?: boolean
  // Anotações já salvas (de um aluno só), mesmas chaves de falha dos treinos.
  anotacoes?: Anotacao[]
  falhaAnotacoes?: boolean
  semEfeitoAnotacoes?: boolean
  falhaConsultaAnotacoes?: boolean
}

// Cliente do Supabase de mentira, só com o que o app usa.
export function criarClienteFalso({
  sessao = false,
  perfil = null,
  erroPerfil = false,
  treinos = [],
  falhaTreinos = false,
  semEfeitoTreinos = false,
  falhaConsulta = false,
  anotacoes = [],
  falhaAnotacoes = false,
  semEfeitoAnotacoes = false,
  falhaConsultaAnotacoes = false,
}: Opcoes = {}) {
  const sessaoAtual = sessao ? { user: { id: 'u1', email: 'a@x.com' } } : null
  const falso = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: sessaoAtual } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn((tabela: string) =>
      tabela === 'treinos'
        ? tabelaTreinosFalsa(treinos, falhaTreinos, semEfeitoTreinos, falhaConsulta)
        : tabela === 'anotacoes'
        ? tabelaAnotacoesFalsa(anotacoes, falhaAnotacoes, semEfeitoAnotacoes, falhaConsultaAnotacoes)
        : {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve(
                    erroPerfil ? { data: null, error: { message: 'falhou' } } : { data: perfil, error: null },
                  ),
              }),
            }),
          },
    ),
    rpc: vi.fn().mockResolvedValue({ error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { alunos: [] }, error: null }) },
  }
  return { falso, cliente: falso as unknown as SupabaseClient }
}

// Tabela treinos de mentira, na memória: aceita select/insert/update/delete
// encadeados com .eq() e .order(), como o supabase-js.
function tabelaTreinosFalsa(guardados: Treino[], falha: boolean, semEfeito: boolean, falhaLeitura: boolean) {
  const consulta = (operacao: 'select' | 'insert' | 'update' | 'delete', dados?: Record<string, unknown>) => {
    const filtros: Record<string, unknown> = {}
    const executar = () => {
      const erro = { message: 'falhou' }
      if (operacao === 'select' && falhaLeitura) return { data: null, error: erro }
      if (operacao === 'select') return { data: [...guardados].sort((a, b) => a.letra.localeCompare(b.letra)), error: null }
      if (falha) return { data: null, error: erro }
      if (operacao === 'insert') guardados.push({ letra: dados!.letra as Treino['letra'], texto: '' })
      const alvo = semEfeito ? -1 : guardados.findIndex((t) => t.letra === filtros.letra)
      if (operacao === 'update' && alvo >= 0) guardados[alvo].texto = dados!.texto as string
      if (operacao === 'delete' && alvo >= 0) guardados.splice(alvo, 1)
      // Com .select(), update/delete devolvem as linhas afetadas (vazio se nenhuma).
      return { data: operacao === 'insert' ? null : alvo >= 0 ? [{ letra: filtros.letra }] : [], error: null }
    }
    const api = {
      eq: (coluna: string, valor: unknown) => ((filtros[coluna] = valor), api),
      select: () => api,
      order: () => api,
      then: (ok: (r: ReturnType<typeof executar>) => unknown) => Promise.resolve(executar()).then(ok),
    }
    return api
  }
  return {
    select: () => consulta('select'),
    insert: (dados: Record<string, unknown>) => consulta('insert', dados),
    update: (dados: Record<string, unknown>) => consulta('update', dados),
    delete: () => consulta('delete'),
  }
}

// Tabela anotacoes de mentira, na memória. Como o banco: insert recebe só
// letra/data/texto; select ordena por data (mais recente primeiro) e filtra por letra.
function tabelaAnotacoesFalsa(guardadas: Anotacao[], falha: boolean, semEfeito: boolean, falhaLeitura: boolean) {
  let contador = 0
  const consulta = (operacao: 'select' | 'insert' | 'update' | 'delete', dados?: Record<string, unknown>) => {
    const filtros: Record<string, unknown> = {}
    const executar = () => {
      const erro = { message: 'falhou' }
      if (operacao === 'select' && falhaLeitura) return { data: null, error: erro }
      if (operacao === 'select') {
        const lista = guardadas.filter((a) => !filtros.letra || a.letra === filtros.letra)
        return { data: lista.sort((a, b) => b.data.localeCompare(a.data)), error: null }
      }
      if (falha) return { data: null, error: erro }
      if (operacao === 'insert') {
        guardadas.push({ id: `novo${++contador}`, ...(dados as Omit<Anotacao, 'id'>) })
        return { data: null, error: null }
      }
      const alvo = semEfeito ? -1 : guardadas.findIndex((a) => a.id === filtros.id)
      if (operacao === 'update' && alvo >= 0) Object.assign(guardadas[alvo], dados)
      if (operacao === 'delete' && alvo >= 0) guardadas.splice(alvo, 1)
      return { data: alvo >= 0 ? [{ id: filtros.id }] : [], error: null }
    }
    const api = {
      eq: (coluna: string, valor: unknown) => ((filtros[coluna] = valor), api),
      select: () => api,
      order: () => api,
      limit: () => api,
      then: (ok: (r: ReturnType<typeof executar>) => unknown) => Promise.resolve(executar()).then(ok),
    }
    return api
  }
  return {
    select: () => consulta('select'),
    insert: (dados: Record<string, unknown>) => consulta('insert', dados),
    update: (dados: Record<string, unknown>) => consulta('update', dados),
    delete: () => consulta('delete'),
  }
}
