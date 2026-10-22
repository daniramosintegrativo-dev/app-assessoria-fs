import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import {
  criarAnotacao,
  formatarData,
  hoje,
  listarAnotacoes,
  removerAnotacao,
  salvarAnotacao,
} from '../lib/anotacoes'
import { marcar } from '../lib/pendencias'
import type { Anotacao, Treino } from '../lib/tipos'
import { LETRAS } from '../lib/treinos'

type Letra = Treino['letra']
type Edicao = { id: string; data: string; texto: string }

// Diário de cargas do aluno: uma anotação por dia de treino, do treino aberto.
export default function AnotacoesAluno({
  cliente,
  alunoId,
  letra,
}: {
  cliente: SupabaseClient
  alunoId: string
  letra: Letra
}) {
  const [lista, setLista] = useState<Anotacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState(false)
  // Rascunho de cada treino: trocar de aba não perde nem mistura o texto.
  const [rascunhos, setRascunhos] = useState<Partial<Record<Letra, string>>>({})
  const [data, setData] = useState(hoje)
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [erro, setErro] = useState('')
  // Trava os botões durante uma gravação (evita toque duplo).
  const [ocupado, setOcupado] = useState(false)
  // Muda a cada gravação para recarregar a lista.
  const [versao, setVersao] = useState(0)

  const texto = rascunhos[letra] ?? ''
  const original = edicao ? lista.find((a) => a.id === edicao.id) : undefined

  useEffect(() => {
    let atual = true
    void listarAnotacoes(cliente, alunoId, letra).then((r) => {
      if (!atual) return
      if (r.ok) {
        setLista(r.dados)
        setErroLista(false)
      } else setErroLista(true)
      setCarregando(false)
    })
    return () => {
      atual = false
    }
  }, [cliente, alunoId, letra, versao])

  // Texto digitado e não salvo = pendência (bloqueia recarga automática do app).
  useEffect(() => {
    for (const l of LETRAS) marcar(`anotacao:nova:${l}`, (rascunhos[l] ?? '').trim() !== '')
  }, [rascunhos])
  useEffect(() => {
    const mudou = !!edicao && !!original && (edicao.texto !== original.texto || edicao.data !== original.data)
    marcar('anotacao:edicao', mudou)
  }, [edicao, original])

  // Ao sair da tela, nada fica pendente.
  useEffect(
    () => () => {
      LETRAS.forEach((l) => marcar(`anotacao:nova:${l}`, false))
      marcar('anotacao:edicao', false)
    },
    [],
  )

  // Data válida: preenchida, de 2020 em diante e não depois de hoje.
  const dataValida = (d: string) => d >= '2020-01-01' && d <= hoje()

  async function gravar(acao: () => Promise<{ ok: boolean }>, mensagemErro: string, aoDarCerto: () => void) {
    setErro('')
    setOcupado(true)
    const r = await acao()
    setOcupado(false)
    if (!r.ok) return setErro(mensagemErro)
    aoDarCerto()
    setVersao((v) => v + 1)
  }

  function criar() {
    if (texto.trim() === '') return setErro('Escreva a anotação antes de salvar.')
    if (!dataValida(data)) return setErro('Escolha uma data válida.')
    return gravar(
      () => criarAnotacao(cliente, { letra, data, texto }),
      'Não foi possível salvar a anotação. Tente de novo.',
      () => setRascunhos((r) => ({ ...r, [letra]: '' })),
    )
  }

  function salvarEdicao() {
    if (!edicao) return
    if (edicao.texto.trim() === '') return setErro('Escreva a anotação antes de salvar.')
    if (!dataValida(edicao.data)) return setErro('Escolha uma data válida.')
    return gravar(
      () => salvarAnotacao(cliente, edicao.id, { data: edicao.data, texto: edicao.texto }),
      'Não foi possível salvar a edição. Tente de novo.',
      () => setEdicao(null),
    )
  }

  function apagar(a: Anotacao) {
    if (!window.confirm(`Apagar a anotação de ${formatarData(a.data)}? Isso não pode ser desfeito.`)) return
    return gravar(
      () => removerAnotacao(cliente, a.id),
      'Não foi possível apagar a anotação. Tente de novo.',
      () => edicao?.id === a.id && setEdicao(null),
    )
  }

  return (
    <section className="anotacoes">
      <h2>Minhas anotações — Treino {letra}</h2>

      <div className="anotacoes__nova">
        <label className="campo">
          Data
          <input type="date" value={data} min="2020-01-01" max={hoje()} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="campo">
          Anotação
          <textarea
            className="treino__texto"
            maxLength={5000}
            placeholder="Ex.: Agachamento 3x10 com 40 kg"
            value={texto}
            onChange={(e) => setRascunhos((r) => ({ ...r, [letra]: e.target.value }))}
          />
        </label>
        <button className="botao" type="button" disabled={ocupado} onClick={criar}>
          Salvar anotação
        </button>
      </div>

      {erro && <p className="erro" role="alert">{erro}</p>}

      {carregando ? (
        <p className="texto-secundario">Carregando…</p>
      ) : erroLista ? (
        <p className="erro" role="alert">Não foi possível carregar suas anotações. Tente de novo mais tarde.</p>
      ) : lista.length === 0 ? (
        <p className="texto-secundario">Você ainda não tem anotações neste treino.</p>
      ) : (
        <ul className="anotacoes__lista">
          {lista.map((a) => {
            const dia = formatarData(a.data)
            return (
              <li key={a.id} className="anotacao">
                {edicao?.id === a.id ? (
                  <>
                    <label className="campo">
                      Data da edição
                      <input
                        type="date"
                        value={edicao.data}
                        min="2020-01-01"
                        max={hoje()}
                        onChange={(e) => setEdicao({ ...edicao, data: e.target.value })}
                      />
                    </label>
                    <label className="campo">
                      Texto da edição
                      <textarea
                        className="treino__texto"
                        maxLength={5000}
                        value={edicao.texto}
                        onChange={(e) => setEdicao({ ...edicao, texto: e.target.value })}
                      />
                    </label>
                    <div className="linha">
                      <button className="botao" type="button" disabled={ocupado} onClick={salvarEdicao}>
                        Salvar edição
                      </button>
                      <button className="botao botao--leve" type="button" onClick={() => setEdicao(null)}>
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>{dia}</strong>
                    <div className="anotacao__texto" style={{ whiteSpace: 'pre-wrap' }}>{a.texto}</div>
                    <div className="linha">
                      <button
                        className="botao botao--leve"
                        type="button"
                        aria-label={`Editar anotação de ${dia}`}
                        disabled={ocupado}
                        onClick={() => setEdicao({ id: a.id, data: a.data, texto: a.texto })}
                      >
                        Editar
                      </button>
                      <button
                        className="botao botao--leve"
                        type="button"
                        aria-label={`Apagar anotação de ${dia}`}
                        disabled={ocupado}
                        onClick={() => apagar(a)}
                      >
                        Apagar
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
