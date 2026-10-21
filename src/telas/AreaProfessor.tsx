import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ativarAluno, chamarGerenciarAluno, desativarAluno } from '../lib/alunos'
import type { Aluno } from '../lib/tipos'
import FichaAluno from './FichaAluno'

type SenhaVisivel = { nome: string; senha: string; aviso?: boolean }

export default function AreaProfessor({ cliente }: { cliente: SupabaseClient }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  // A senha provisória só existe aqui, na memória, até o professor fechar o aviso.
  const [senha, setSenha] = useState<SenhaVisivel | null>(null)
  const [copiado, setCopiado] = useState(false)
  // Aviso curto após desativar, quando as sessões abertas não puderam ser encerradas.
  const [avisoSessoes, setAvisoSessoes] = useState(false)
  // Aluno com desativar/reativar em andamento (trava o botão contra toque duplo).
  const [ocupado, setOcupado] = useState<string | null>(null)
  // Aluno cuja ficha de treinos está aberta (sem router: troca a tela aqui mesmo).
  const [fichaDe, setFichaDe] = useState<Aluno | null>(null)

  const carregar = useCallback(
    () =>
      chamarGerenciarAluno<{ alunos: Aluno[] }>(cliente, { acao: 'listar' }).then((r) => {
        if (r.ok) setAlunos(r.dados.alunos)
        else setErro(r.erro)
        setCarregando(false)
      }),
    [cliente],
  )

  useEffect(() => {
    void carregar()
  }, [carregar])

  function mostrarSenha(nomeAluno: string, senhaGerada: string, aviso = false) {
    setSenha({ nome: nomeAluno, senha: senhaGerada, aviso })
    setCopiado(false)
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const r = await chamarGerenciarAluno<{ senha_provisoria: string }>(cliente, {
      acao: 'criar',
      nome,
      email,
    })
    setEnviando(false)
    if (!r.ok) return setErro(r.erro)
    mostrarSenha(nome.trim(), r.dados.senha_provisoria)
    setNome('')
    setEmail('')
    void carregar()
  }

  async function novaSenha(aluno: Aluno) {
    if (!window.confirm(`Gerar nova senha para ${aluno.nome}? A senha atual deixa de valer.`)) return
    setErro('')
    const r = await chamarGerenciarAluno<{ senha_provisoria: string; aviso?: string }>(cliente, {
      acao: 'nova_senha',
      id: aluno.id,
    })
    if (!r.ok) return setErro(r.erro)
    mostrarSenha(aluno.nome, r.dados.senha_provisoria, r.dados.aviso === 'sessoes_nao_encerradas')
  }

  async function alternarAtivo(aluno: Aluno) {
    const mensagem = aluno.ativo
      ? `Desativar ${aluno.nome}? O aluno perde o acesso na hora.`
      : `Reativar ${aluno.nome}? O aluno volta a entrar com a mesma senha.`
    if (!window.confirm(mensagem)) return
    setErro('')
    setAvisoSessoes(false)
    setOcupado(aluno.id)
    const r = await (aluno.ativo ? desativarAluno : ativarAluno)(cliente, aluno.id)
    setOcupado(null)
    if (!r.ok) return setErro(r.erro)
    // Só a função de desativar devolve este aviso (o acesso já foi bloqueado).
    if ('aviso' in r.dados && r.dados.aviso === 'sessoes_nao_encerradas') setAvisoSessoes(true)
    await carregar()
  }

  async function copiar() {
    if (!senha) return
    try {
      await navigator.clipboard.writeText(senha.senha)
      setCopiado(true)
    } catch {
      setErro('Não foi possível copiar. Selecione a senha e copie à mão.')
    }
  }

  if (fichaDe) return <FichaAluno cliente={cliente} aluno={fichaDe} aoVoltar={() => setFichaDe(null)} />

  return (
    <section className="painel">
      <h1>Área do professor</h1>

      {senha && (
        <div className="senha-caixa" role="status">
          <p>Senha provisória de <strong>{senha.nome}</strong>:</p>
          <p className="senha-caixa__senha">{senha.senha}</p>
          <p className="texto-secundario">
            Ela aparece só desta vez. Envie pelo WhatsApp: no primeiro acesso o aluno cria a própria senha.
          </p>
          {senha.aviso && (
            <p className="erro">
              Atenção: não foi possível encerrar as sessões abertas do aluno. Ele pode continuar
              logado até a sessão expirar.
            </p>
          )}
          <div className="linha">
            <button className="botao" type="button" onClick={copiar}>Copiar</button>
            <button className="botao botao--leve" type="button" onClick={() => setSenha(null)}>Já enviei</button>
          </div>
          {copiado && <p>Copiado!</p>}
        </div>
      )}

      {avisoSessoes && (
        <p className="erro" role="status">
          O acesso foi bloqueado, mas sessões já abertas podem durar até 1 hora.
        </p>
      )}

      <h2>Cadastrar aluno</h2>
      <form className="formulario" onSubmit={cadastrar}>
        <label className="campo">
          Nome
          <input type="text" maxLength={100} required value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="campo">
          E-mail
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="botao" type="submit" disabled={enviando}>Cadastrar aluno</button>
      </form>

      <h2>Alunos</h2>
      {carregando ? (
        <p className="texto-secundario">Carregando…</p>
      ) : alunos.length === 0 ? (
        <p className="texto-secundario">Nenhum aluno cadastrado ainda.</p>
      ) : (
        <ul className="lista">
          {alunos.map((a) => (
            <li key={a.id} className="lista__item">
              <div>
                <strong>{a.nome || '(sem nome)'}</strong>
                <div className="texto-secundario">{a.email}</div>
                <div className="texto-secundario">{a.ativo ? 'Ativo' : 'Desativado'}</div>
              </div>
              <div className="linha">
                <button className="botao botao--leve" type="button" onClick={() => setFichaDe(a)}>
                  Ficha
                </button>
                <button className="botao botao--leve" type="button" onClick={() => novaSenha(a)}>
                  Gerar nova senha
                </button>
                <button
                  className="botao botao--leve"
                  type="button"
                  disabled={ocupado === a.id}
                  onClick={() => alternarAtivo(a)}
                >
                  {a.ativo ? 'Desativar' : 'Reativar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
