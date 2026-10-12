import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState, type ReactNode } from 'react'
import './App.css'
import type { Perfil } from './lib/tipos'
import { supabase } from './lib/supabase'
import AreaProfessor from './telas/AreaProfessor'
import Login from './telas/Login'
import TrocaSenha from './telas/TrocaSenha'

// Estado do perfil: carregando, erro de rede, ou o resultado (null = sem acesso).
type EstadoPerfil = 'carregando' | 'erro' | Perfil | null

function Aviso({ children }: { children: ReactNode }) {
  return (
    <main className="inicio">
      <p className="erro" role="alert">{children}</p>
    </main>
  )
}

// Moldura das telas de quem está logado: título e botão Sair.
function Casca({ cliente, children }: { cliente: SupabaseClient; children: ReactNode }) {
  return (
    <>
      <header className="topo">
        <img src="/logo.png" alt="" width="40" height="40" />
        <span className="topo__nome">Físico Sagrado</span>
        <button className="botao botao--leve" type="button" onClick={() => void cliente.auth.signOut()}>
          Sair
        </button>
      </header>
      <main className="conteudo">{children}</main>
    </>
  )
}

function Logado({ cliente, sessao }: { cliente: SupabaseClient; sessao: Session }) {
  const [perfil, setPerfil] = useState<EstadoPerfil>('carregando')
  const idUsuario = sessao.user.id

  useEffect(() => {
    let atual = true
    cliente
      .from('perfis')
      .select('nome, papel, ativo, precisa_trocar_senha')
      .eq('id', idUsuario)
      .maybeSingle()
      .then(({ data, error }) => {
        if (atual) setPerfil(error ? 'erro' : (data as Perfil | null))
      })
    return () => {
      atual = false
    }
  }, [cliente, idUsuario])

  if (perfil === 'carregando') return <main className="inicio"><p>Carregando…</p></main>

  let tela: ReactNode
  if (perfil === 'erro') {
    tela = <p className="erro" role="alert">Não foi possível carregar seus dados. Tente de novo mais tarde.</p>
  } else if (!perfil || !perfil.ativo) {
    // O RLS esconde o perfil de quem está desativado.
    tela = <p className="erro" role="alert">Seu acesso está desativado. Fale com o professor.</p>
  } else if (perfil.precisa_trocar_senha) {
    // Enquanto a troca estiver pendente, nada mais é mostrado.
    tela = <TrocaSenha cliente={cliente} aoConcluir={() => setPerfil({ ...perfil, precisa_trocar_senha: false })} />
  } else if (perfil.papel === 'professor') {
    tela = <AreaProfessor cliente={cliente} />
  } else {
    tela = (
      <section className="painel">
        <h1>Olá, {perfil.nome}</h1>
        <p className="texto-secundario">Em breve: seus treinos, vídeos e feedback em um só lugar.</p>
      </section>
    )
  }
  return <Casca cliente={cliente}>{tela}</Casca>
}

function App() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    // Só guarda a sessão aqui; consultas ao banco ficam fora deste callback.
    const { data } = supabase.auth.onAuthStateChange((_evento, nova) => setSessao(nova))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase) {
    return (
      <Aviso>
        App sem configuração: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja docs/SUPABASE.md).
      </Aviso>
    )
  }
  if (sessao === undefined) return <main className="inicio"><p>Carregando…</p></main>
  if (!sessao) return <Login cliente={supabase} />
  return <Logado cliente={supabase} sessao={sessao} />
}

export default App
