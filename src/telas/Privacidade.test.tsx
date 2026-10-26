import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VERSAO_PRIVACIDADE } from '../lib/privacidade'
import { criarClienteFalso } from '../test/clienteFalso'
import Privacidade from './Privacidade'

describe('Privacidade', () => {
  it('mostra o texto, o aviso para quem não concorda e o botão de aceite', () => {
    const { cliente } = criarClienteFalso()
    render(<Privacidade cliente={cliente} aoAceitar={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Sua privacidade' })).toBeInTheDocument()
    expect(screen.getByText(/Físico Sagrado/)).toBeInTheDocument()
    expect(screen.getByText(/Se não concordar, fale com o professor/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Li e aceito' })).toBeInTheDocument()
  })

  it('traz responsável, retenção, quem vê, base legal e direitos do texto aprovado', () => {
    render(<Privacidade />)
    expect(screen.getByText(/Responsável: .+ \(.+\), da Físico Sagrado\./)).toBeInTheDocument()
    expect(screen.getByText(/a limpeza automática ainda está sendo implantada/)).toBeInTheDocument()
    expect(screen.getByText(/Supabase e Cloudflare\) guardam os dados para nós, sem uso próprio/)).toBeInTheDocument()
    expect(screen.getByText(/registros técnicos de acesso \(data de login, endereço IP\)/)).toBeInTheDocument()
    expect(screen.getByText(/prestar o serviço de assessoria que você contratou/)).toBeInTheDocument()
    expect(screen.getByText(/pedir a exclusão; sem os dados não é possível usar o app/)).toBeInTheDocument()
    expect(screen.queryByText(/retirar o seu consentimento/)).not.toBeInTheDocument()
    expect(screen.queryByText(/na conversa com ele/)).not.toBeInTheDocument()
  })

  it('aceitar chama a função do banco com a versão e avisa o app', async () => {
    const { cliente, falso } = criarClienteFalso()
    const aoAceitar = vi.fn()
    render(<Privacidade cliente={cliente} aoAceitar={aoAceitar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Li e aceito' }))
    expect(falso.rpc).toHaveBeenCalledWith('aceitar_privacidade', { versao: VERSAO_PRIVACIDADE })
    expect(aoAceitar).toHaveBeenCalled()
  })

  it('se der erro, mostra mensagem e não avança', async () => {
    const { cliente, falso } = criarClienteFalso()
    falso.rpc.mockResolvedValue({ error: { message: 'falhou' } })
    const aoAceitar = vi.fn()
    render(<Privacidade cliente={cliente} aoAceitar={aoAceitar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Li e aceito' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível registrar')
    expect(aoAceitar).not.toHaveBeenCalled()
  })

  it('no modo leitura mostra o texto sem botão de aceite', () => {
    render(<Privacidade />)
    expect(screen.getByRole('heading', { name: 'Sua privacidade' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Li e aceito' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Se não concordar/)).not.toBeInTheDocument()
  })
})
