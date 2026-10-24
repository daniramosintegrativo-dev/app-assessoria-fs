// Linha de public.perfis que o app lê (RLS: cada um só vê o que pode).
export type Perfil = {
  nome: string
  papel: 'professor' | 'aluno'
  ativo: boolean
  precisa_trocar_senha: boolean
}

export type Aluno = { id: string; nome: string; email: string; ativo: boolean }

// Treino de um aluno: texto livre, identificado pela letra (A a D).
export type Treino = { letra: 'A' | 'B' | 'C' | 'D'; texto: string }

// Anotação de carga do aluno: um dia de treino (data AAAA-MM-DD), ligada a um treino.
export type Anotacao = { id: string; letra: Treino['letra']; data: string; texto: string }
