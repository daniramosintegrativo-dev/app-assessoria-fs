import { describe, expect, it } from 'vitest'
import { gerarSenhaProvisoria, lerPedido, normalizarEmail, normalizarNome } from './aluno.ts'

describe('gerarSenhaProvisoria', () => {
  it('tem pelo menos 10 caracteres', () => {
    expect(gerarSenhaProvisoria().length).toBeGreaterThanOrEqual(10)
  })

  it('nunca usa caracteres ambíguos', () => {
    for (let i = 0; i < 300; i++) {
      expect(gerarSenhaProvisoria()).not.toMatch(/[0O1lI]/)
    }
  })

  it('mistura maiúsculas, minúsculas e números', () => {
    for (let i = 0; i < 50; i++) {
      const s = gerarSenhaProvisoria()
      expect(s).toMatch(/[A-Z]/)
      expect(s).toMatch(/[a-z]/)
      expect(s).toMatch(/[2-9]/)
    }
  })

  it('gera senhas diferentes a cada chamada', () => {
    expect(gerarSenhaProvisoria()).not.toBe(gerarSenhaProvisoria())
  })
})

describe('normalizarNome', () => {
  it('remove espaços nas pontas', () => {
    expect(normalizarNome('  Maria Silva ')).toBe('Maria Silva')
  })
  it('recusa vazio, só espaços e acima de 100 caracteres', () => {
    expect(normalizarNome('')).toBeNull()
    expect(normalizarNome('   ')).toBeNull()
    expect(normalizarNome('a'.repeat(101))).toBeNull()
    expect(normalizarNome('a'.repeat(100))).not.toBeNull()
  })
  it('recusa quem não é texto', () => {
    expect(normalizarNome(42)).toBeNull()
    expect(normalizarNome(undefined)).toBeNull()
  })
})

describe('normalizarEmail', () => {
  it('põe em minúsculas e tira espaços', () => {
    expect(normalizarEmail('  Ana@Exemplo.COM ')).toBe('ana@exemplo.com')
  })
  it('recusa e-mails inválidos', () => {
    for (const ruim of ['', 'ana', 'ana@', '@x.com', 'ana@x', 'a na@x.com', 'a@@x.com']) {
      expect(normalizarEmail(ruim)).toBeNull()
    }
  })
  it('recusa e-mail longo demais e não-texto', () => {
    expect(normalizarEmail('a'.repeat(250) + '@x.com')).toBeNull()
    expect(normalizarEmail(null)).toBeNull()
  })
})

describe('lerPedido', () => {
  const id = '00000000-0000-0000-0000-0000000000b1'

  it('aceita criar com dados válidos e normaliza', () => {
    expect(lerPedido({ acao: 'criar', nome: ' Ana ', email: 'ANA@x.com' })).toEqual({
      ok: true,
      pedido: { acao: 'criar', nome: 'Ana', email: 'ana@x.com' },
    })
  })
  it('recusa criar com nome ou e-mail inválido', () => {
    expect(lerPedido({ acao: 'criar', nome: '', email: 'a@x.com' }).ok).toBe(false)
    expect(lerPedido({ acao: 'criar', nome: 'Ana', email: 'ruim' }).ok).toBe(false)
  })
  it('aceita nova_senha só com id no formato uuid', () => {
    expect(lerPedido({ acao: 'nova_senha', id })).toEqual({
      ok: true,
      pedido: { acao: 'nova_senha', id },
    })
    expect(lerPedido({ acao: 'nova_senha', id: 'x' }).ok).toBe(false)
    expect(lerPedido({ acao: 'nova_senha' }).ok).toBe(false)
  })
  it('aceita listar', () => {
    expect(lerPedido({ acao: 'listar' })).toEqual({ ok: true, pedido: { acao: 'listar' } })
  })
  it('recusa ação desconhecida e corpo que não é objeto', () => {
    expect(lerPedido({ acao: 'apagar' }).ok).toBe(false)
    expect(lerPedido(null).ok).toBe(false)
    expect(lerPedido('listar').ok).toBe(false)
    expect(lerPedido([]).ok).toBe(false)
  })
})
