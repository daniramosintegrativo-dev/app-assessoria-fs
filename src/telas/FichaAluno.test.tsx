import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Treino } from '../lib/tipos'
import { criarClienteFalso } from '../test/clienteFalso'
import FichaAluno from './FichaAluno'

const ana = { id: 'id-ana', nome: 'Ana Souza', email: 'ana@x.com', ativo: true }

function abrir(treinos: Treino[] = [], falhaTreinos = false) {
  const voltar = vi.fn()
  const { cliente, falso } = criarClienteFalso({ treinos, falhaTreinos })
  render(<FichaAluno cliente={cliente} aluno={ana} aoVoltar={voltar} />)
  return { falso, voltar }
}

afterEach(() => vi.restoreAllMocks())

describe('FichaAluno', () => {
  it('mostra o título, os treinos existentes em ordem e o botão Voltar', async () => {
    const { voltar } = abrir([
      { letra: 'B', texto: 'supino' },
      { letra: 'A', texto: 'agachamento' },
    ])
    expect(await screen.findByRole('heading', { name: 'Ficha de Ana Souza' })).toBeInTheDocument()
    const caixas = screen.getAllByRole('textbox')
    expect(caixas.map((c) => (c as HTMLTextAreaElement).value)).toEqual(['agachamento', 'supino'])
    expect(screen.getByLabelText('Treino A')).toHaveValue('agachamento')
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(voltar).toHaveBeenCalled()
  })

  it('sem treinos, oferece só "Adicionar treino A" e cria o treino', async () => {
    abrir()
    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar treino A' }))
    expect(await screen.findByLabelText('Treino A')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Adicionar treino B' })).toBeInTheDocument()
  })

  it('salva o texto e indica "Salvo"', async () => {
    const { falso } = abrir([{ letra: 'A', texto: '' }])
    const caixa = await screen.findByLabelText('Treino A')
    await userEvent.type(caixa, 'remada 4x10')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar treino A' }))
    expect(await screen.findByText('Salvo')).toBeInTheDocument()
    expect(falso.from).toHaveBeenCalledWith('treinos')
    // Recarregar mostra o que foi gravado.
    expect(caixa).toHaveValue('remada 4x10')
  })

  it('adiciona até o D e não oferece E', async () => {
    abrir([{ letra: 'A', texto: '' }])
    for (const letra of ['B', 'C', 'D']) {
      await userEvent.click(await screen.findByRole('button', { name: `Adicionar treino ${letra}` }))
    }
    expect(await screen.findByLabelText('Treino D')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Adicionar treino/ })).not.toBeInTheDocument()
  })

  it('remove só o último treino, com confirmação', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    abrir([
      { letra: 'A', texto: '' },
      { letra: 'B', texto: '' },
    ])
    expect(await screen.findByRole('button', { name: 'Remover treino B' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover treino A' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remover treino B' }))
    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('Treino B'))
    expect(screen.queryByLabelText('Treino B')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Treino A')).toBeInTheDocument()
  })

  it('não remove se o professor cancelar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    abrir([{ letra: 'A', texto: '' }])
    await userEvent.click(await screen.findByRole('button', { name: 'Remover treino A' }))
    expect(screen.getByLabelText('Treino A')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando não consegue salvar', async () => {
    abrir([{ letra: 'A', texto: '' }], true)
    await userEvent.click(await screen.findByRole('button', { name: 'Salvar treino A' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(screen.queryByText('Salvo')).not.toBeInTheDocument()
  })
})
