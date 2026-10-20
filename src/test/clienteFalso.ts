import type { SupabaseClient } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { Perfil } from '../lib/tipos'

type Opcoes = {
  sessao?: boolean
  perfil?: Perfil | null
  erroPerfil?: boolean
}

// Cliente do Supabase de mentira, só com o que o app usa.
export function criarClienteFalso({ sessao = false, perfil = null, erroPerfil = false }: Opcoes = {}) {
  const sessaoAtual = sessao ? { user: { id: 'u1', email: 'a@x.com' } } : null
  const falso = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: sessaoAtual } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve(
              erroPerfil ? { data: null, error: { message: 'falhou' } } : { data: perfil, error: null },
            ),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { alunos: [] }, error: null }) },
  }
  return { falso, cliente: falso as unknown as SupabaseClient }
}
