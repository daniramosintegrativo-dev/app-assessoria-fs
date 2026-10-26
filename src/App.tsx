import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState, type ReactNode } from 'react'
import './App.css'
import type { Perfil } from './lib/tipos'
import { VERSAO_PRIVACIDADE } from './lib/privacidade'
import { supabase } from './lib/supabase'
import AreaProfessor from './telas/AreaProfessor'
import Login from './telas/Login'
import MinhaFicha from './telas/MinhaFicha'
import Privacidade from './telas/Privacidade'
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

// Moldura das telas de quem está logado: título, botão Sair e link Privacidade.
function Casca({ cliente, children }: { cliente: SupabaseClient; children: ReactNode }) {
  const [lendo, setLendo] = useState(false)
  return (
    <>
      <header className="topo">
        <img src="/logo.png" alt="" width="40" height="40" />
        <span className="topo__nome">Físico Sagrado</span>
        <button className="botao botao--leve" type="button" onClick={() => setLendo(!lendo)}>
          {lendo ? 'Voltar' : 'Privacidade'}
        </button>
        <button className="botao botao--leve" type="button" onClick={() => void cliente.auth.signOut()}>
          Sair
        </button>
      </header>
      <main className="conteudo">{lendo ? <Privacidade /> : children}</main>
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
      .select('nome, papel, ativo, precisa_trocar_senha, privacidade_versao')
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
  } else if (perfil.papel === 'aluno' && perfil.privacidade_versao !== VERSAO_PRIVACIDADE) {
    // Sem aceite da versão atual o banco também não libera o conteúdo.
    tela = <Privacidade cliente={cliente} aoAceitar={() => setPerfil({ ...perfil, privacidade_versao: VERSAO_PRIVACIDADE })} />
  } else if (perfil.papel === 'professor') {
    tela = <AreaProfessor cliente={cliente} />
  } else {
    tela = (
      <section className="painel">
        <h1>Olá, {perfil.nome}</h1>
        <MinhaFicha cliente={cliente} alunoId={idUsuario} />
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
        App sem configuração do Supabase (veja src/lib/supabase.ts e docs/SUPABASE.md).
      </Aviso>
    )
  }
  if (sessao === undefined) return <main className="inicio"><p>Carregando…</p></main>
  if (!sessao) return <Login cliente={supabase} />
  return <Logado cliente={supabase} sessao={sessao} />
}

export default App
