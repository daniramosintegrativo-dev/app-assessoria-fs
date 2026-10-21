import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { marcar } from '../lib/pendencias'
import { LETRAS, criarTreino, listarTreinos, removerTreino, salvarTreino } from '../lib/treinos'
import type { Aluno, Treino } from '../lib/tipos'

// Ficha do aluno: de 1 a 4 treinos (A a D), cada um num bloco de texto livre.
export default function FichaAluno({
  cliente,
  aluno,
  aoVoltar,
}: {
  cliente: SupabaseClient
  aluno: Aluno
  aoVoltar: () => void
}) {
  const [treinos, setTreinos] = useState<Treino[]>([])
  // Último texto gravado de cada treino: base para saber o que está sem salvar.
  const [salvos, setSalvos] = useState<Partial<Record<Treino['letra'], string>>>({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  // Letra recém-salva (mostra "Salvo" até a próxima edição).
  const [salvo, setSalvo] = useState<Treino['letra'] | null>(null)
  // Trava os botões durante uma gravação (evita toque duplo).
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    void listarTreinos(cliente, aluno.id).then((r) => {
      if (r.ok) {
        setTreinos(r.dados)
        setSalvos(Object.fromEntries(r.dados.map((t) => [t.letra, t.texto])))
      }
      else setErro(r.erro)
      setCarregando(false)
    })
  }, [cliente, aluno.id])

  // Texto diferente do gravado = pendência (bloqueia recarga automática do app).
  useEffect(() => {
    for (const l of LETRAS) {
      const t = treinos.find((x) => x.letra === l)
      marcar(`treino:${aluno.id}:${l}`, !!t && t.texto !== (salvos[l] ?? ''))
    }
  }, [treinos, salvos, aluno.id])

  // Ao sair da tela, nada fica pendente.
  useEffect(
    () => () => LETRAS.forEach((l) => marcar(`treino:${aluno.id}:${l}`, false)),
    [aluno.id],
  )

  // Próxima letra livre; vazia quando já há A, B, C e D.
  const proxima = LETRAS.find((l) => !treinos.some((t) => t.letra === l))
  const ultimo = treinos.length > 0 ? treinos[treinos.length - 1].letra : null

  async function gravar(acao: () => Promise<{ ok: boolean }>, mensagemErro: string, aoDarCerto: () => void) {
    setErro('')
    setSalvo(null)
    setOcupado(true)
    const r = await acao()
    setOcupado(false)
    if (!r.ok) return setErro(mensagemErro)
    aoDarCerto()
  }

  const adicionar = (letra: Treino['letra']) =>
    gravar(
      () => criarTreino(cliente, aluno.id, letra),
      `Não foi possível adicionar o treino ${letra}. Tente de novo.`,
      () => {
        setTreinos((atuais) => [...atuais, { letra, texto: '' }])
        setSalvos((s) => ({ ...s, [letra]: '' }))
      },
    )

  const salvar = (t: Treino) =>
    gravar(
      () => salvarTreino(cliente, aluno.id, t.letra, t.texto),
      `Não foi possível salvar o treino ${t.letra}. Tente de novo.`,
      () => {
        setSalvo(t.letra)
        setSalvos((s) => ({ ...s, [t.letra]: t.texto }))
      },
    )

  function remover(letra: Treino['letra']) {
    if (!window.confirm(`Remover o Treino ${letra} de ${aluno.nome}? O texto será apagado.`)) return
    return gravar(
      () => removerTreino(cliente, aluno.id, letra),
      `Não foi possível remover o treino ${letra}. Tente de novo.`,
      () => {
        setTreinos((atuais) => atuais.filter((t) => t.letra !== letra))
        setSalvos((s) => ({ ...s, [letra]: undefined }))
      },
    )
  }

  function editar(letra: Treino['letra'], texto: string) {
    setSalvo(null)
    setTreinos((atuais) => atuais.map((t) => (t.letra === letra ? { ...t, texto } : t)))
  }

  return (
    <section className="painel">
      <h1>Ficha de {aluno.nome}</h1>
      <button className="botao botao--leve" type="button" onClick={aoVoltar}>Voltar</button>

      {erro && <p className="erro" role="alert">{erro}</p>}

      {carregando ? (
        <p className="texto-secundario">Carregando…</p>
      ) : (
        <>
          {treinos.length === 0 && <p className="texto-secundario">Este aluno ainda não tem treinos.</p>}
          {treinos.map((t) => (
            <div key={t.letra} className="treino">
              <label className="campo">
                Treino {t.letra}
                <textarea
                  className="treino__texto"
                  maxLength={20000}
                  value={t.texto}
                  onChange={(e) => editar(t.letra, e.target.value)}
                />
              </label>
              <div className="linha">
                <button className="botao" type="button" disabled={ocupado} onClick={() => salvar(t)}>
                  Salvar treino {t.letra}
                </button>
                {t.letra === ultimo && (
                  <button className="botao botao--leve" type="button" disabled={ocupado} onClick={() => remover(t.letra)}>
                    Remover treino {t.letra}
                  </button>
                )}
                {salvo === t.letra && <span role="status">Salvo</span>}
              </div>
            </div>
          ))}
          {proxima && (
            <button className="botao botao--leve" type="button" disabled={ocupado} onClick={() => adicionar(proxima)}>
              Adicionar treino {proxima}
            </button>
          )}
        </>
      )}
    </section>
  )
}
