import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarClienteFalso } from '../test/clienteFalso'
import AreaProfessor from './AreaProfessor'

const ana = { id: 'id-ana', nome: 'Ana Souza', email: 'ana@x.com', ativo: true }

// Responde a cada ação da Edge Function.
function responder(falso: ReturnType<typeof criarClienteFalso>['falso'], extra: Record<string, unknown> = {}) {
  falso.functions.invoke.mockImplementation(async (_nome: string, { body }: { body: { acao: string } }) => {
    if (body.acao in extra) return extra[body.acao]
    if (body.acao === 'listar') return { data: { alunos: [ana] }, error: null }
    return { data: {}, error: null }
  })
}

afterEach(() => vi.restoreAllMocks())

describe('AreaProfessor', () => {
  it('lista os alunos com nome, e-mail e situação', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    expect(item).toHaveTextContent('Ana Souza')
    expect(item).toHaveTextContent('ana@x.com')
    expect(item).toHaveTextContent('Ativo')
    expect(falso.functions.invoke).toHaveBeenCalledWith('gerenciar-aluno', { body: { acao: 'listar' } })
  })

  it('cadastra aluno e mostra a senha provisória', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, { criar: { data: { id: 'novo', senha_provisoria: 'Abc23456xyz' }, error: null } })
    render(<AreaProfessor cliente={cliente} />)
    await userEvent.type(screen.getByLabelText('Nome'), 'Bia Lima')
    await userEvent.type(screen.getByLabelText('E-mail'), 'bia@x.com')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    expect(falso.functions.invoke).toHaveBeenCalledWith('gerenciar-aluno', {
      body: { acao: 'criar', nome: 'Bia Lima', email: 'bia@x.com' },
    })
    const caixa = await screen.findByRole('status')
    expect(caixa).toHaveTextContent('Abc23456xyz')
    expect(caixa).toHaveTextContent('WhatsApp')
    expect(caixa).toHaveTextContent('só desta vez')
    // Formulário limpo para o próximo aluno.
    expect(screen.getByLabelText('Nome')).toHaveValue('')
  })

  it('copia a senha para a área de transferência', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, { criar: { data: { id: 'novo', senha_provisoria: 'Abc23456xyz' }, error: null } })
    const usuario = userEvent.setup()
    const escrever = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<AreaProfessor cliente={cliente} />)
    await usuario.type(screen.getByLabelText('Nome'), 'Bia')
    await usuario.type(screen.getByLabelText('E-mail'), 'bia@x.com')
    await usuario.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    await usuario.click(await screen.findByRole('button', { name: 'Copiar' }))
    expect(escrever).toHaveBeenCalledWith('Abc23456xyz')
    expect(await screen.findByText('Copiado!')).toBeInTheDocument()
  })

  it('mostra o erro amigável quando o e-mail já existe', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, {
      criar: { data: null, error: { context: { json: async () => ({ erro: 'Já existe uma conta com esse e-mail.' }) } } },
    })
    render(<AreaProfessor cliente={cliente} />)
    await userEvent.type(screen.getByLabelText('Nome'), 'Ana')
    await userEvent.type(screen.getByLabelText('E-mail'), 'ana@x.com')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma conta com esse e-mail.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('gera nova senha provisória para um aluno da lista', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, { nova_senha: { data: { senha_provisoria: 'Nova23456xy' }, error: null } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    await userEvent.click(within(item).getByRole('button', { name: /nova senha/i }))
    expect(falso.functions.invoke).toHaveBeenCalledWith('gerenciar-aluno', {
      body: { acao: 'nova_senha', id: 'id-ana' },
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Nova23456xy')
  })

  it('não gera nova senha se o professor cancelar', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    await userEvent.click(within(item).getByRole('button', { name: /nova senha/i }))
    expect(falso.functions.invoke).not.toHaveBeenCalledWith('gerenciar-aluno', {
      body: { acao: 'nova_senha', id: 'id-ana' },
    })
  })

  it('desativa o aluno e atualiza a lista', async () => {
    const { cliente, falso } = criarClienteFalso()
    let ativo = true
    falso.functions.invoke.mockImplementation(async (_n: string, { body }: { body: { acao: string } }) => {
      if (body.acao === 'desativar') ativo = false
      if (body.acao === 'listar') return { data: { alunos: [{ ...ana, ativo }] }, error: null }
      return { data: { ok: true }, error: null }
    })
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    expect(item).toHaveTextContent('Ativo')
    await userEvent.click(within(item).getByRole('button', { name: 'Desativar' }))
    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('perde o acesso na hora'))
    expect(falso.functions.invoke).toHaveBeenCalledWith('gerenciar-aluno', {
      body: { acao: 'desativar', id: 'id-ana' },
    })
    expect(await within(await screen.findByRole('listitem')).findByText('Desativado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reativar' })).toBeInTheDocument()
  })

  it('reativa o aluno e atualiza a lista', async () => {
    const { cliente, falso } = criarClienteFalso()
    let ativo = false
    falso.functions.invoke.mockImplementation(async (_n: string, { body }: { body: { acao: string } }) => {
      if (body.acao === 'ativar') ativo = true
      if (body.acao === 'listar') return { data: { alunos: [{ ...ana, ativo }] }, error: null }
      return { data: { ok: true }, error: null }
    })
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    expect(item).toHaveTextContent('Desativado')
    await userEvent.click(within(item).getByRole('button', { name: 'Reativar' }))
    expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('mesma senha'))
    expect(falso.functions.invoke).toHaveBeenCalledWith('gerenciar-aluno', {
      body: { acao: 'ativar', id: 'id-ana' },
    })
    expect(await screen.findByText('Ativo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desativar' })).toBeInTheDocument()
  })

  it('não desativa se o professor cancelar', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso)
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    await userEvent.click(within(item).getByRole('button', { name: 'Desativar' }))
    expect(falso.functions.invoke).toHaveBeenCalledTimes(1) // só o "listar"
  })

  it('mostra o erro quando não consegue desativar', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, {
      desativar: { data: null, error: { context: { json: async () => ({ erro: 'Não foi possível desativar o aluno.' }) } } },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    await userEvent.click(within(item).getByRole('button', { name: 'Desativar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível desativar o aluno.')
    expect(item).toHaveTextContent('Ativo')
  })

  it('avisa quando a nova senha não derrubou as sessões abertas', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, {
      nova_senha: { data: { senha_provisoria: 'Nova23456xy', aviso: 'sessoes_nao_encerradas' }, error: null },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    await userEvent.click(within(item).getByRole('button', { name: /nova senha/i }))
    const caixa = await screen.findByRole('status')
    expect(caixa).toHaveTextContent('Nova23456xy')
    expect(caixa).toHaveTextContent('sessões abertas')
  })

  it('avisa quando desativou mas as sessões abertas não foram encerradas', async () => {
    const { cliente, falso } = criarClienteFalso()
    responder(falso, { desativar: { data: { ok: true, aviso: 'sessoes_nao_encerradas' }, error: null } })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<AreaProfessor cliente={cliente} />)
    const item = await screen.findByRole('listitem')
    await userEvent.click(within(item).getByRole('button', { name: 'Desativar' }))
    const aviso = await screen.findByRole('status')
    expect(aviso).toHaveTextContent('acesso foi bloqueado')
    expect(aviso).toHaveTextContent('até 1 hora')
  })
})
