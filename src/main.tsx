import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AvisoAtualizacao from './AvisoAtualizacao.tsx'
import { EVENTO_NOVA_VERSAO, iniciarAtualizacao } from './lib/atualizacao.ts'

// Fora do React para registrar uma única vez (o StrictMode monta duas vezes).
iniciarAtualizacao({ aoPendente: () => window.dispatchEvent(new Event(EVENTO_NOVA_VERSAO)) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AvisoAtualizacao />
  </StrictMode>,
)
