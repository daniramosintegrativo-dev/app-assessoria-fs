// Linha de public.perfis que o app lê (RLS: cada um só vê o que pode).
export type Perfil = {
  nome: string
  papel: 'professor' | 'aluno'
  ativo: boolean
  precisa_trocar_senha: boolean
}

export type Aluno = { id: string; nome: string; email: string; ativo: boolean }
