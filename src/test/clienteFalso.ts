import type { SupabaseClient } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { Perfil, Treino } from '../lib/tipos'

type Opcoes = {
  sessao?: boolean
  perfil?: Perfil | null
  erroPerfil?: boolean
  // Treinos já salvos (de um aluno só). falhaTreinos: gravar/apagar devolve erro.
  treinos?: Treino[]
  falhaTreinos?: boolean
  // Gravar/apagar não afeta linha nenhuma, sem erro (como o RLS faz ao bloquear).
  semEfeitoTreinos?: boolean
}

// Cliente do Supabase de mentira, só com o que o app usa.
export function criarClienteFalso({
  sessao = false,
  perfil = null,
  erroPerfil = false,
  treinos = [],
  falhaTreinos = false,
  semEfeitoTreinos = false,
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
        ? tabelaTreinosFalsa(treinos, falhaTreinos, semEfeitoTreinos)
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
function tabelaTreinosFalsa(guardados: Treino[], falha: boolean, semEfeito: boolean) {
  const consulta = (operacao: 'select' | 'insert' | 'update' | 'delete', dados?: Record<string, unknown>) => {
    const filtros: Record<string, unknown> = {}
    const executar = () => {
      const erro = { message: 'falhou' }
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
