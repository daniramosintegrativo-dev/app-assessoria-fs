import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AvisoAtualizacao from './AvisoAtualizacao'
import { EVENTO_NOVA_VERSAO } from './lib/atualizacao'

describe('AvisoAtualizacao', () => {
  it('fica escondido até haver versão nova; o botão Atualizar recarrega', async () => {
    const recarregar = vi.fn()
    render(<AvisoAtualizacao recarregar={recarregar} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event(EVENTO_NOVA_VERSAO))
    })
    expect(screen.getByRole('status')).toHaveTextContent('Nova versão disponível')
    await userEvent.click(screen.getByRole('button', { name: 'Atualizar' }))
    expect(recarregar).toHaveBeenCalled()
  })
})
