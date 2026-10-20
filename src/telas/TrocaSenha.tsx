import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'

const MINIMO = 8

export default function TrocaSenha({ cliente, aoConcluir }: { cliente: SupabaseClient; aoConcluir: () => void }) {
  const [nova, setNova] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  // Se a senha já foi salva e só o passo final falhou, não salvar de novo
  // (o Supabase recusaria "mesma senha" e a provisória poderia ficar valendo).
  const [senhaSalva, setSenhaSalva] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (!senhaSalva) {
      if (nova.length < MINIMO) return setErro(`A senha precisa ter pelo menos ${MINIMO} caracteres.`)
      if (nova !== confirmar) return setErro('As senhas não são iguais.')
    }
    setEnviando(true)
    if (!senhaSalva) {
      const { error } = await cliente.auth.updateUser({ password: nova })
      if (error) {
        setEnviando(false)
        return setErro(
          error.code === 'same_password'
            ? 'A nova senha precisa ser diferente da provisória.'
            : 'Não foi possível salvar a senha. Tente outra.',
        )
      }
      setSenhaSalva(true)
    }
    // Zera a marca de "troca obrigatória" no banco.
    const { error } = await cliente.rpc('senha_trocada')
    setEnviando(false)
    if (error) return setErro('Sua senha foi salva, mas falta concluir. Toque em Salvar senha de novo.')
    aoConcluir()
  }

  return (
    <section className="painel">
      <h1>Crie sua senha</h1>
      <p className="texto-secundario">É o seu primeiro acesso. Escolha uma senha só sua, com pelo menos {MINIMO} caracteres.</p>
      <form className="formulario" onSubmit={salvar}>
        <label className="campo">
          Nova senha
          <input type="password" autoComplete="new-password" value={nova}
            disabled={senhaSalva} onChange={(e) => setNova(e.target.value)} />
        </label>
        <label className="campo">
          Confirmar senha
          <input type="password" autoComplete="new-password" value={confirmar}
            disabled={senhaSalva} onChange={(e) => setConfirmar(e.target.value)} />
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="botao" type="submit" disabled={enviando}>Salvar senha</button>
      </form>
    </section>
  )
}
