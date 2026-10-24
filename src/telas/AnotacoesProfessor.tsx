import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { formatarData, listarAnotacoes } from '../lib/anotacoes'
import type { Anotacao } from '../lib/tipos'

// Anotações de carga do aluno, só leitura (o RLS também impede o professor de escrever).
export default function AnotacoesProfessor({ cliente, alunoId }: { cliente: SupabaseClient; alunoId: string }) {
  const [lista, setLista] = useState<Anotacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let atual = true
    void listarAnotacoes(cliente, alunoId).then((r) => {
      if (!atual) return
      if (r.ok) setLista(r.dados)
      else setErro(true)
      setCarregando(false)
    })
    return () => {
      atual = false
    }
  }, [cliente, alunoId])

  return (
    <section className="anotacoes">
      <h2>Anotações do aluno</h2>
      {carregando ? (
        <p className="texto-secundario">Carregando…</p>
      ) : erro ? (
        <p className="erro" role="alert">Não foi possível carregar as anotações. Tente de novo mais tarde.</p>
      ) : lista.length === 0 ? (
        <p className="texto-secundario">Este aluno ainda não fez anotações.</p>
      ) : (
        <ul className="anotacoes__lista">
          {lista.map((a) => (
            <li key={a.id} className="anotacao">
              <strong>Treino {a.letra} · {formatarData(a.data)}</strong>
              <div className="anotacao__texto" style={{ whiteSpace: 'pre-wrap' }}>{a.texto}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
