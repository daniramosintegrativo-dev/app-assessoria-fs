import { describe, expect, it } from 'vitest'
import { EMAIL_CONTATO, RESPONSAVEL_DOCUMENTO, RESPONSAVEL_NOME, VERSAO_PRIVACIDADE } from './privacidade'

describe('privacidade', () => {
  it('a versão tem o formato AAAA-MM-DD', () => {
    expect(VERSAO_PRIVACIDADE).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  // remover skip quando responsável, documento e e-mail forem definidos
  it.skip('responsável e e-mail de contato já foram definidos (sem PREENCHER)', () => {
    for (const valor of [EMAIL_CONTATO, RESPONSAVEL_NOME, RESPONSAVEL_DOCUMENTO]) {
      expect(valor).not.toContain('PREENCHER')
    }
  })
})
