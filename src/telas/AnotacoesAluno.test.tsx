import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { haPendencias } from '../lib/pendencias'
import type { Anotacao } from '../lib/tipos'
import { criarClienteFalso } from '../test/clienteFalso'
import AnotacoesAluno from './AnotacoesAluno'

type Falhas = { falhaAnotacoes?: boolean; semEfeitoAnotacoes?: boolean; falhaConsultaAnotacoes?: boolean }

function abrir(iniciais: Anotacao[] = [], falhas: Falhas = {}, letra: 'A' | 'B' = 'A') {
  // Cópias: o cliente falso muda os objetos na memória.
  const anotacoes = iniciais.map((a) => ({ ...a }))
  const { cliente, falso } = criarClienteFalso({ anotacoes, ...falhas })
  const r = render(<AnotacoesAluno cliente={cliente} alunoId="u1" letra={letra} />)
  return { falso, anotacoes, ...r }
}

const antiga: Anotacao = { id: 'a1', letra: 'A', data: '2026-10-20', texto: 'supino 3x10\n40 kg' }

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-22T15:00:00-03:00') }))
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('AnotacoesAluno', () => {
  it('mostra o título do treino, a dica e a data de hoje por padrão', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: 'Minhas anotações — Treino A' })).toBeInTheDocument()
    expect(screen.getByLabelText('Data')).toHaveValue('2026-10-22')
    expect(screen.getByLabelText('Anotação')).toHaveAttribute('placeholder', 'Ex.: Agachamento 3x10 com 40 kg')
  })

  it('usa o dia de São Paulo, mesmo que em UTC já seja o dia seguinte', async () => {
    vi.setSystemTime(new Date('2026-10-23T01:30:00Z'))
    abrir()
    expect(await screen.findByLabelText('Data')).toHaveValue('2026-10-22')
  })

  it('sem anotações, avisa que ainda não há nenhuma', async () => {
    abrir()
    expect(await screen.findByText('Você ainda não tem anotações neste treino.')).toBeInTheDocument()
  })

  it('lista só as do treino, com data dd/mm/aaaa e quebras de linha', async () => {
    abrir([antiga, { id: 'b1', letra: 'B', data: '2026-10-19', texto: 'terra' }])
    const texto = await screen.findByText(/supino/)
    expect(texto.textContent).toBe('supino 3x10\n40 kg')
    expect(texto).toHaveStyle({ whiteSpace: 'pre-wrap' })
    expect(screen.getByText('20/10/2026')).toBeInTheDocument()
    expect(screen.queryByText('terra')).not.toBeInTheDocument()
  })

  it('cria uma anotação e a mostra na lista, limpando o campo', async () => {
    const { falso } = abrir()
    await userEvent.type(await screen.findByLabelText('Anotação'), 'agachamento 3x10 45 kg')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    expect(await screen.findByText('agachamento 3x10 45 kg')).toBeInTheDocument()
    expect(screen.getByLabelText('Anotação')).toHaveValue('')
    expect(screen.getByText('22/10/2026')).toBeInTheDocument()
    expect(falso.from).toHaveBeenCalledWith('anotacoes')
  })

  it('grava só letra, data e texto (o dono é decidido pelo banco)', async () => {
    const { anotacoes } = abrir([], {}, 'B')
    await userEvent.type(await screen.findByLabelText('Anotação'), 'remada')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    await screen.findByText('remada')
    expect(anotacoes[0]).toEqual({ id: 'novo1', letra: 'B', data: '2026-10-22', texto: 'remada' })
  })

  it('permite registrar em outro dia', async () => {
    abrir()
    const data = await screen.findByLabelText('Data')
    await userEvent.clear(data)
    await userEvent.type(data, '2026-10-20')
    await userEvent.type(screen.getByLabelText('Anotação'), 'ontem')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    expect(await screen.findByText('20/10/2026')).toBeInTheDocument()
  })

  it('texto vazio não grava e avisa', async () => {
    const { anotacoes } = abrir()
    await userEvent.type(await screen.findByLabelText('Anotação'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escreva a anotação antes de salvar.')
    expect(anotacoes).toHaveLength(0)
  })

  it('data no futuro não grava e avisa', async () => {
    const { anotacoes } = abrir()
    const data = await screen.findByLabelText('Data')
    await userEvent.clear(data)
    await userEvent.type(data, '2026-10-30')
    await userEvent.type(screen.getByLabelText('Anotação'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma data válida.')
    expect(anotacoes).toHaveLength(0)
  })

  it('erro ao criar mostra mensagem e mantém o texto digitado', async () => {
    abrir([], { falhaAnotacoes: true })
    await userEvent.type(await screen.findByLabelText('Anotação'), 'não perder')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a anotação. Tente de novo.')
    expect(screen.getByLabelText('Anotação')).toHaveValue('não perder')
  })

  it('texto não salvo vira pendência e some ao salvar', async () => {
    abrir()
    await userEvent.type(await screen.findByLabelText('Anotação'), 'x')
    expect(haPendencias()).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }))
    await screen.findByRole('button', { name: /Editar anotação/ })
    expect(haPendencias()).toBe(false)
  })

  it('o rascunho de um treino não vai para outro e sai das pendências ao desmontar', async () => {
    const { cliente } = criarClienteFalso()
    const { rerender, unmount } = render(<AnotacoesAluno cliente={cliente} alunoId="u1" letra="A" />)
    await userEvent.type(await screen.findByLabelText('Anotação'), 'rascunho do A')
    rerender(<AnotacoesAluno cliente={cliente} alunoId="u1" letra="B" />)
    expect(screen.getByLabelText('Anotação')).toHaveValue('')
    rerender(<AnotacoesAluno cliente={cliente} alunoId="u1" letra="A" />)
    expect(screen.getByLabelText('Anotação')).toHaveValue('rascunho do A')
    unmount()
    expect(haPendencias()).toBe(false)
  })

  it('edita data e texto de uma anotação', async () => {
    abrir([antiga])
    await userEvent.click(await screen.findByRole('button', { name: 'Editar anotação de 20/10/2026' }))
    const texto = screen.getByLabelText('Texto da edição')
    expect(texto).toHaveValue('supino 3x10\n40 kg')
    expect(haPendencias()).toBe(false)
    await userEvent.clear(texto)
    await userEvent.type(texto, 'supino 3x10 45 kg')
    expect(haPendencias()).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar edição' }))
    expect(await screen.findByText('supino 3x10 45 kg')).toBeInTheDocument()
    expect(screen.queryByLabelText('Texto da edição')).not.toBeInTheDocument()
    expect(haPendencias()).toBe(false)
  })

  it('cancelar a edição descarta as mudanças', async () => {
    abrir([antiga])
    await userEvent.click(await screen.findByRole('button', { name: /Editar anotação/ }))
    await userEvent.type(screen.getByLabelText('Texto da edição'), ' mudou')
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText(/supino/).textContent).toBe('supino 3x10\n40 kg')
    expect(haPendencias()).toBe(false)
  })

  it('edição que o banco bloqueia (nenhuma linha afetada) mostra erro', async () => {
    abrir([antiga], { semEfeitoAnotacoes: true })
    await userEvent.click(await screen.findByRole('button', { name: /Editar anotação/ }))
    await userEvent.type(screen.getByLabelText('Texto da edição'), '!')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar edição' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a edição. Tente de novo.')
  })

  it('apaga depois de confirmar', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    abrir([antiga])
    await userEvent.click(await screen.findByRole('button', { name: 'Apagar anotação de 20/10/2026' }))
    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('20/10/2026'))
    expect(await screen.findByText('Você ainda não tem anotações neste treino.')).toBeInTheDocument()
  })

  it('não apaga se o aluno cancelar a confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    abrir([antiga])
    await userEvent.click(await screen.findByRole('button', { name: /Apagar anotação/ }))
    expect(screen.getByText(/supino/)).toBeInTheDocument()
  })

  it('erro ao apagar mostra mensagem e mantém a anotação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    abrir([antiga], { semEfeitoAnotacoes: true })
    await userEvent.click(await screen.findByRole('button', { name: /Apagar anotação/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível apagar a anotação. Tente de novo.')
    expect(screen.getByText(/supino/)).toBeInTheDocument()
  })

  it('erro de carregamento mostra mensagem genérica', async () => {
    abrir([], { falhaConsultaAnotacoes: true })
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar suas anotações.')
  })

  it('cada anotação tem os botões Editar e Apagar', async () => {
    abrir([antiga])
    const item = (await screen.findByText(/supino/)).closest('li') as HTMLElement
    expect(within(item).getByRole('button', { name: /Editar/ })).toBeInTheDocument()
    expect(within(item).getByRole('button', { name: /Apagar/ })).toBeInTheDocument()
  })
})
