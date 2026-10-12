import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { criarClienteFalso } from '../test/clienteFalso'
import Login from './Login'

describe('Login', () => {
  it('não tem link de cadastro e mostra a logo', () => {
    const { cliente } = criarClienteFalso()
    render(<Login cliente={cliente} />)
    expect(screen.getByRole('img', { name: /logo físico sagrado/i })).toBeInTheDocument()
    expect(screen.queryByText(/cadastr|criar conta|registr/i)).not.toBeInTheDocument()
  })

  it('entra com e-mail e senha', async () => {
    const { cliente, falso } = criarClienteFalso()
    render(<Login cliente={cliente} />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@x.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(falso.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@x.com',
      password: 'segredo123',
    })
  })

  it('mostra mensagem genérica quando o login falha', async () => {
    const { cliente, falso } = criarClienteFalso()
    falso.auth.signInWithPassword.mockResolvedValue({
      error: { name: 'AuthApiError', message: 'Invalid login credentials' },
    })
    render(<Login cliente={cliente} />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@x.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled())
  })
})
