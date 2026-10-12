import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'

export default function Login({ cliente }: { cliente: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await cliente.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    // Mensagem genérica: não revela se o e-mail existe. (Sucesso: o App troca de tela.)
    if (error) {
      setErro(
        error.name === 'AuthRetryableFetchError'
          ? 'Sem conexão. Verifique a internet e tente de novo.'
          : 'E-mail ou senha incorretos',
      )
    }
  }

  return (
    <main className="inicio">
      <img className="inicio__logo" src="/logo.png" alt="Logo Físico Sagrado" width="240" height="240" />
      <h1 className="inicio__titulo">Físico Sagrado</h1>
      <form className="formulario" onSubmit={entrar}>
        <label className="campo">
          E-mail
          <input type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="campo">
          Senha
          <input type="password" autoComplete="current-password" required value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
