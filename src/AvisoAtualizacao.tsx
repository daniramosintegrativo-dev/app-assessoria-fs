import { useEffect, useState } from 'react'
import { EVENTO_NOVA_VERSAO } from './lib/atualizacao'

// Faixa discreta quando há versão nova e o app não recarregou sozinho
// (para não apagar o que a pessoa está digitando).
export default function AvisoAtualizacao({ recarregar = () => window.location.reload() }: { recarregar?: () => void }) {
  const [nova, setNova] = useState(false)

  useEffect(() => {
    const avisar = () => setNova(true)
    window.addEventListener(EVENTO_NOVA_VERSAO, avisar)
    return () => window.removeEventListener(EVENTO_NOVA_VERSAO, avisar)
  }, [])

  if (!nova) return null
  return (
    <div className="aviso-versao" role="status">
      <span>Nova versão disponível</span>
      <button className="botao botao--leve" type="button" onClick={recarregar}>
        Atualizar
      </button>
    </div>
  )
}
