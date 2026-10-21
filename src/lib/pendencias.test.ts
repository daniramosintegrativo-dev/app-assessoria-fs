import { afterEach, describe, expect, it } from 'vitest'
import { haPendencias, marcar } from './pendencias'

afterEach(() => {
  marcar('a', false)
  marcar('b', false)
})

describe('pendencias', () => {
  it('há pendência enquanto alguma chave estiver marcada', () => {
    expect(haPendencias()).toBe(false)
    marcar('a', true)
    marcar('b', true)
    marcar('a', false)
    expect(haPendencias()).toBe(true)
    marcar('b', false)
    expect(haPendencias()).toBe(false)
  })

  it('pede confirmação ao sair da página só com pendência', () => {
    const livre = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(livre)
    expect(livre.defaultPrevented).toBe(false)
    marcar('a', true)
    const preso = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(preso)
    expect(preso.defaultPrevented).toBe(true)
  })
})
