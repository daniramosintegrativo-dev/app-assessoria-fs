import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Perfil } from './lib/tipos'
import { criarClienteFalso } from './test/clienteFalso'

// O módulo do cliente é trocado por um que o teste controla.
const h = vi.hoisted(() => ({ cliente: null as unknown }))
vi.mock('./lib/supabase', () => ({
  get supabase() {
    return h.cliente
  },
}))

import App from './App'

const aluno: Perfil = { nome: 'Carla', papel: 'aluno', ativo: true, precisa_trocar_senha: false }
const professor: Perfil = { nome: 'Prof', papel: 'professor', ativo: true, precisa_trocar_senha: false }

function abrir(opcoes: Parameters<typeof criarClienteFalso>[0]) {
  const { cliente, falso } = criarClienteFalso(opcoes)
  h.cliente = cliente
  render(<App />)
  return falso
}

beforeEach(() => {
  h.cliente = null
})

describe('App', () => {
  it('avisa com clareza quando falta a configuração do Supabase', () => {
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent(/sem configuração do Supabase/)
  })

  it('sem sessão mostra o login', async () => {
    abrir({ sessao: false })
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('aluno ativo vê "Olá", a própria ficha e não vê a área do professor', async () => {
    abrir({ sessao: true, perfil: aluno, treinos: [{ letra: 'A', texto: 'agachamento' }] })
    expect(await screen.findByRole('heading', { name: 'Olá, Carla' })).toBeInTheDocument()
    expect(await screen.findByText('agachamento')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Treino A' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cadastrar aluno' })).not.toBeInTheDocument()
  })

  it('professor vê a área de cadastro e a lista', async () => {
    abrir({ sessao: true, perfil: professor })
    expect(await screen.findByRole('button', { name: 'Cadastrar aluno' })).toBeInTheDocument()
  })

  it('com troca pendente só aparece "Crie sua senha"', async () => {
    abrir({ sessao: true, perfil: { ...aluno, precisa_trocar_senha: true } })
    expect(await screen.findByRole('heading', { name: 'Crie sua senha' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Olá/ })).not.toBeInTheDocument()
  })

  it('depois de trocar a senha, o aluno segue para a tela inicial', async () => {
    abrir({ sessao: true, perfil: { ...aluno, precisa_trocar_senha: true } })
    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senhaboa123')
    await userEvent.type(screen.getByLabelText('Confirmar senha'), 'senhaboa123')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))
    expect(await screen.findByRole('heading', { name: 'Olá, Carla' })).toBeInTheDocument()
  })

  it('perfil inativo ou inexistente mostra acesso desativado', async () => {
    abrir({ sessao: true, perfil: null })
    expect(await screen.findByText('Seu acesso está desativado. Fale com o professor.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('o botão Sair encerra a sessão', async () => {
    const falso = abrir({ sessao: true, perfil: aluno })
    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }))
    expect(falso.auth.signOut).toHaveBeenCalled()
  })

  it('erro ao carregar o perfil não mostra conteúdo', async () => {
    abrir({ sessao: true, perfil: aluno, erroPerfil: true })
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar')
    expect(screen.queryByRole('heading', { name: /Olá/ })).not.toBeInTheDocument()
  })
})
