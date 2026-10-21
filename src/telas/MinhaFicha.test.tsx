import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Treino } from '../lib/tipos'
import { criarClienteFalso } from '../test/clienteFalso'
import MinhaFicha from './MinhaFicha'

function abrir(treinos: Treino[] = [], falhaConsulta = false) {
  const { cliente, falso } = criarClienteFalso({ treinos, falhaConsulta })
  render(<MinhaFicha cliente={cliente} alunoId="u1" />)
  return falso
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('MinhaFicha', () => {
  it('mostra só as abas dos treinos que existem, abrindo no A', async () => {
    abrir([
      { letra: 'C', texto: 'treino c' },
      { letra: 'A', texto: 'treino a' },
    ])
    expect(await screen.findByRole('tab', { name: 'Treino A' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Treino C' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Treino B' })).not.toBeInTheDocument()
    expect(screen.getByText('treino a')).toBeInTheDocument()
    expect(screen.queryByText('treino c')).not.toBeInTheDocument()
  })

  it('troca de treino ao tocar na aba', async () => {
    abrir([
      { letra: 'A', texto: 'treino a' },
      { letra: 'B', texto: 'treino b' },
    ])
    await userEvent.click(await screen.findByRole('tab', { name: 'Treino B' }))
    expect(screen.getByText('treino b')).toBeInTheDocument()
    expect(screen.queryByText('treino a')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Treino B' })).toHaveAttribute('aria-selected', 'true')
  })

  it('preserva as quebras de linha do texto', async () => {
    abrir([{ letra: 'A', texto: 'agachamento\n4x10' }])
    const texto = await screen.findByText(/agachamento/)
    expect(texto.textContent).toBe('agachamento\n4x10')
    expect(texto).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })

  it('não oferece editar, salvar nem adicionar', async () => {
    abrir([{ letra: 'A', texto: 'x' }])
    await screen.findByRole('tab', { name: 'Treino A' })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sem treinos avisa que o professor ainda não montou a ficha', async () => {
    abrir([])
    expect(await screen.findByText('Seu professor ainda não montou sua ficha.')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('erro de carregamento mostra mensagem genérica', async () => {
    abrir([], true)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar sua ficha.')
  })

  it('lembra a última aba escolhida neste aparelho', async () => {
    const treinos: Treino[] = [
      { letra: 'A', texto: 'treino a' },
      { letra: 'B', texto: 'treino b' },
    ]
    const { unmount } = render(<MinhaFicha cliente={criarClienteFalso({ treinos }).cliente} alunoId="u1" />)
    await userEvent.click(await screen.findByRole('tab', { name: 'Treino B' }))
    unmount()
    abrir(treinos)
    expect(await screen.findByText('treino b')).toBeInTheDocument()
    expect(screen.queryByText('treino a')).not.toBeInTheDocument()
  })

  it('abre o A se a aba lembrada não existe mais', async () => {
    localStorage.setItem('ficha:aba', 'D')
    abrir([{ letra: 'A', texto: 'treino a' }])
    expect(await screen.findByText('treino a')).toBeInTheDocument()
  })

  it('abre o A e segue funcionando se o armazenamento falhar', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    abrir([
      { letra: 'A', texto: 'treino a' },
      { letra: 'B', texto: 'treino b' },
    ])
    expect(await screen.findByText('treino a')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Treino B' }))
    expect(screen.getByText('treino b')).toBeInTheDocument()
  })
})
