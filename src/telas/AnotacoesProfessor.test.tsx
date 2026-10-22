import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Anotacao } from '../lib/tipos'
import { criarClienteFalso } from '../test/clienteFalso'
import AnotacoesProfessor from './AnotacoesProfessor'

function abrir(anotacoes: Anotacao[] = [], falhaConsultaAnotacoes = false) {
  const { cliente } = criarClienteFalso({ anotacoes, falhaConsultaAnotacoes })
  render(<AnotacoesProfessor cliente={cliente} alunoId="id-ana" />)
}

describe('AnotacoesProfessor', () => {
  it('lista as anotações com treino, data e texto, mais recentes primeiro', async () => {
    abrir([
      { id: '1', letra: 'A', data: '2026-10-18', texto: 'agachamento 40 kg' },
      { id: '2', letra: 'B', data: '2026-10-20', texto: 'remada\n30 kg' },
    ])
    expect(await screen.findByRole('heading', { name: 'Anotações do aluno' })).toBeInTheDocument()
    const itens = await screen.findAllByRole('listitem')
    expect(itens).toHaveLength(2)
    expect(itens[0]).toHaveTextContent('Treino B')
    expect(itens[0]).toHaveTextContent('20/10/2026')
    expect(itens[1]).toHaveTextContent('Treino A')
    expect(screen.getByText(/remada/)).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })

  it('é só leitura: sem campos nem botões', async () => {
    abrir([{ id: '1', letra: 'A', data: '2026-10-18', texto: 'x' }])
    await screen.findByText('x')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sem anotações, avisa', async () => {
    abrir()
    expect(await screen.findByText('Este aluno ainda não fez anotações.')).toBeInTheDocument()
  })

  it('erro de carregamento mostra mensagem genérica', async () => {
    abrir([], true)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as anotações.')
  })
})
