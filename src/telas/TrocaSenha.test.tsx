import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { criarClienteFalso } from '../test/clienteFalso'
import TrocaSenha from './TrocaSenha'

async function preencher(nova: string, confirmar: string) {
  await userEvent.type(screen.getByLabelText('Nova senha'), nova)
  await userEvent.type(screen.getByLabelText('Confirmar senha'), confirmar)
  await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))
}

describe('TrocaSenha', () => {
  it('recusa senha com menos de 8 caracteres', async () => {
    const { cliente, falso } = criarClienteFalso()
    render(<TrocaSenha cliente={cliente} aoConcluir={vi.fn()} />)
    await preencher('curta12', 'curta12')
    expect(screen.getByRole('alert')).toHaveTextContent('pelo menos 8 caracteres')
    expect(falso.auth.updateUser).not.toHaveBeenCalled()
  })

  it('recusa quando a confirmação é diferente', async () => {
    const { cliente, falso } = criarClienteFalso()
    render(<TrocaSenha cliente={cliente} aoConcluir={vi.fn()} />)
    await preencher('senhaboa123', 'senhaboa124')
    expect(screen.getByRole('alert')).toHaveTextContent('não são iguais')
    expect(falso.auth.updateUser).not.toHaveBeenCalled()
  })

  it('troca a senha, zera a flag e avisa o app', async () => {
    const { cliente, falso } = criarClienteFalso()
    const aoConcluir = vi.fn()
    render(<TrocaSenha cliente={cliente} aoConcluir={aoConcluir} />)
    await preencher('senhaboa123', 'senhaboa123')
    expect(falso.auth.updateUser).toHaveBeenCalledWith({ password: 'senhaboa123' })
    expect(falso.rpc).toHaveBeenCalledWith('senha_trocada')
    expect(aoConcluir).toHaveBeenCalled()
  })

  it('mostra erro se o Supabase recusar a senha', async () => {
    const { cliente, falso } = criarClienteFalso()
    falso.auth.updateUser.mockResolvedValue({ error: { code: 'same_password', message: 'x' } })
    const aoConcluir = vi.fn()
    render(<TrocaSenha cliente={cliente} aoConcluir={aoConcluir} />)
    await preencher('senhaboa123', 'senhaboa123')
    expect(await screen.findByRole('alert')).toHaveTextContent('diferente da provisória')
    expect(falso.rpc).not.toHaveBeenCalled()
    expect(aoConcluir).not.toHaveBeenCalled()
  })

  it('se só a flag falhar, a nova tentativa não troca a senha de novo', async () => {
    const { cliente, falso } = criarClienteFalso()
    falso.rpc.mockResolvedValueOnce({ error: { message: 'falhou' } })
    const aoConcluir = vi.fn()
    render(<TrocaSenha cliente={cliente} aoConcluir={aoConcluir} />)
    await preencher('senhaboa123', 'senhaboa123')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))
    expect(falso.auth.updateUser).toHaveBeenCalledTimes(1)
    expect(falso.rpc).toHaveBeenCalledTimes(2)
    expect(aoConcluir).toHaveBeenCalled()
  })
})
