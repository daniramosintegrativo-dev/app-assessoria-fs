import { describe, expect, it } from 'vitest'
import { EMAIL_CONTATO, VERSAO_PRIVACIDADE } from './privacidade'

describe('privacidade', () => {
  it('a versão tem o formato AAAA-MM-DD', () => {
    expect(VERSAO_PRIVACIDADE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  // remover skip quando o e-mail de contato for definido
  it.skip('o e-mail de contato já foi definido (sem PREENCHER)', () => {
    expect(EMAIL_CONTATO).not.toContain('PREENCHER')
  })
})
