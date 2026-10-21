import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// O módulo virtual do PWA é trocado por um falso que o teste controla.
const h = vi.hoisted(() => ({ opcoes: null as null | { immediate?: boolean; onRegisteredSW?: (u: string, r: unknown) => void } }))
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn((opcoes) => {
    h.opcoes = opcoes
  }),
}))

import { iniciarAtualizacao } from './atualizacao'
import { marcar } from './pendencias'

const MEIA_HORA = 30 * 60 * 1000

// serviceWorker de mentira: um alvo de eventos com ou sem controlador anterior.
function falsoServiceWorker(comControlador: boolean) {
  const alvo = new EventTarget() as EventTarget & { controller: unknown }
  alvo.controller = comControlador ? {} : null
  Object.defineProperty(navigator, 'serviceWorker', { value: alvo, configurable: true })
  return alvo
}

function iniciar() {
  const recarregar = vi.fn()
  const aoPendente = vi.fn()
  iniciarAtualizacao({ recarregar, aoPendente })
  const registro = { update: vi.fn().mockResolvedValue(undefined) }
  h.opcoes?.onRegisteredSW?.('/sw.js', registro)
  return { recarregar, aoPendente, registro }
}

beforeEach(() => {
  vi.useFakeTimers()
  h.opcoes = null
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('iniciarAtualizacao', () => {
  it('registra o service worker já na abertura', () => {
    falsoServiceWorker(true)
    iniciar()
    expect(h.opcoes?.immediate).toBe(true)
  })

  it('versão nova assumindo o app recarrega a página uma vez só', () => {
    const sw = falsoServiceWorker(true)
    const { recarregar, aoPendente } = iniciar()
    sw.dispatchEvent(new Event('controllerchange'))
    sw.dispatchEvent(new Event('controllerchange'))
    expect(recarregar).toHaveBeenCalledTimes(1)
    expect(aoPendente).not.toHaveBeenCalled()
  })

  it('primeira instalação (sem versão anterior) não recarrega', () => {
    const sw = falsoServiceWorker(false)
    const { recarregar, aoPendente } = iniciar()
    sw.dispatchEvent(new Event('controllerchange'))
    expect(recarregar).not.toHaveBeenCalled()
    expect(aoPendente).not.toHaveBeenCalled()
  })

  it('com um campo de texto em uso, avisa em vez de recarregar', () => {
    const sw = falsoServiceWorker(true)
    const caixa = document.createElement('textarea')
    document.body.append(caixa)
    caixa.focus()
    const { recarregar, aoPendente } = iniciar()
    sw.dispatchEvent(new Event('controllerchange'))
    expect(recarregar).not.toHaveBeenCalled()
    expect(aoPendente).toHaveBeenCalledTimes(1)
  })

  it('com alteração não salva, avisa em vez de recarregar, mesmo sem foco', () => {
    const sw = falsoServiceWorker(true)
    marcar('treino:x', true)
    const { recarregar, aoPendente } = iniciar()
    sw.dispatchEvent(new Event('controllerchange'))
    marcar('treino:x', false)
    expect(recarregar).not.toHaveBeenCalled()
    expect(aoPendente).toHaveBeenCalledTimes(1)
  })

  it('procura versão nova quando a aba volta a ficar visível', () => {
    falsoServiceWorker(true)
    const { registro } = iniciar()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(registro.update).not.toHaveBeenCalled()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(registro.update).toHaveBeenCalledTimes(1)
  })

  it('procura versão nova a cada 30 minutos', () => {
    falsoServiceWorker(true)
    const { registro } = iniciar()
    vi.advanceTimersByTime(MEIA_HORA)
    expect(registro.update).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(MEIA_HORA)
    expect(registro.update).toHaveBeenCalledTimes(2)
  })

  it('falha ao procurar atualização (sem internet) é ignorada', async () => {
    falsoServiceWorker(true)
    const { registro } = iniciar()
    registro.update.mockRejectedValue(new Error('offline'))
    vi.advanceTimersByTime(MEIA_HORA)
    await vi.advanceTimersByTimeAsync(0)
    expect(registro.update).toHaveBeenCalled()
  })
})
