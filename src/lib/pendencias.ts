// Registro de alterações não salvas (ex.: texto de treino editado).
// Enquanto houver alguma, o app não recarrega sozinho e pede confirmação ao sair.
const pendentes = new Set<string>()

function avisarAoSair(e: BeforeUnloadEvent) {
  e.preventDefault()
  e.returnValue = '' // exigido por alguns navegadores para mostrar o aviso
}

export function marcar(chave: string, pendente: boolean) {
  if (pendente) pendentes.add(chave)
  else pendentes.delete(chave)
  // O aviso só fica ligado enquanto há o que perder.
  if (pendentes.size > 0) window.addEventListener('beforeunload', avisarAoSair)
  else window.removeEventListener('beforeunload', avisarAoSair)
}

export const haPendencias = () => pendentes.size > 0
