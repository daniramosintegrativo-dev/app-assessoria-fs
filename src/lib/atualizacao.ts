import { registerSW } from 'virtual:pwa-register'

const MEIA_HORA = 30 * 60 * 1000

// Avisado quando há versão nova mas recarregar agora poderia perder texto digitado.
export const EVENTO_NOVA_VERSAO = 'nova-versao'

// Há um campo de texto com o foco? Então a pessoa pode estar digitando.
function digitando(): boolean {
  const el = document.activeElement
  return !!el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable)
}

// Mantém o app em dia no celular:
// - procura versão nova ao abrir, ao voltar para o app e a cada 30 min;
// - quando a versão nova assume, recarrega UMA vez (se ninguém estiver digitando);
// - se estiver digitando, chama aoPendente (faixa "Atualizar") em vez de recarregar.
// O service worker novo ativa sozinho (skipWaiting + clientsClaim, no vite.config).
export function iniciarAtualizacao({
  recarregar = () => window.location.reload(),
  aoPendente,
}: {
  recarregar?: () => void
  aoPendente: () => void
}) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registro) {
      if (!registro) return
      // Sem internet o update falha: tudo bem, tenta de novo na próxima.
      const procurar = () => void registro.update().catch(() => {})
      setInterval(procurar, MEIA_HORA)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') procurar()
      })
    },
  })

  const sw = navigator.serviceWorker
  if (!sw) return
  // Sem controlador = primeira instalação: nada a recarregar.
  const haviaVersao = !!sw.controller
  let tratou = false
  sw.addEventListener('controllerchange', () => {
    if (!haviaVersao || tratou) return
    tratou = true
    if (digitando()) aoPendente()
    else recarregar()
  })
}
