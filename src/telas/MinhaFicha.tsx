import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import AnotacoesAluno from './AnotacoesAluno'
import { listarTreinos } from '../lib/treinos'
import type { Treino } from '../lib/tipos'

const CHAVE_ABA = 'ficha:aba'

// localStorage pode falhar (modo privado, dados bloqueados): nunca quebra a tela.
function lerAba(): string | null {
  try {
    return localStorage.getItem(CHAVE_ABA)
  } catch {
    return null
  }
}

function guardarAba(letra: string) {
  try {
    localStorage.setItem(CHAVE_ABA, letra)
  } catch {
    // Sem armazenamento: na próxima vez abre no A.
  }
}

// Ficha do aluno: treino só leitura e, embaixo, as anotações de carga dele. O RLS garante que ele só recebe os próprios treinos.
export default function MinhaFicha({ cliente, alunoId }: { cliente: SupabaseClient; alunoId: string }) {
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [escolhida, setEscolhida] = useState<string | null>(lerAba)

  useEffect(() => {
    let atual = true
    void listarTreinos(cliente, alunoId).then((r) => {
      if (!atual) return
      if (r.ok) setTreinos(r.dados)
      else setErro(true)
      setCarregando(false)
    })
    return () => {
      atual = false
    }
  }, [cliente, alunoId])

  if (carregando) return <p className="texto-secundario">Carregando…</p>
  if (erro) return <p className="erro" role="alert">Não foi possível carregar sua ficha. Tente de novo mais tarde.</p>
  if (treinos.length === 0) return <p className="texto-secundario">Seu professor ainda não montou sua ficha.</p>

  // Aba lembrada que não existe mais cai no primeiro treino (o A, se houver).
  const atual = treinos.find((t) => t.letra === escolhida) ?? treinos[0]

  function escolher(letra: string) {
    setEscolhida(letra)
    guardarAba(letra)
  }

  return (
    <section>
      <div className="abas" role="tablist" aria-label="Treinos">
        {treinos.map((t) => (
          <button
            key={t.letra}
            className="botao botao--aba"
            type="button"
            role="tab"
            id={`aba-${t.letra}`}
            aria-selected={t.letra === atual.letra}
            aria-controls="painel-treino"
            onClick={() => escolher(t.letra)}
          >
            Treino {t.letra}
          </button>
        ))}
      </div>
      <div className="ficha-texto" style={{ whiteSpace: 'pre-wrap' }} role="tabpanel" id="painel-treino" aria-labelledby={`aba-${atual.letra}`}>
        {atual.texto}
      </div>
      <AnotacoesAluno cliente={cliente} alunoId={alunoId} letra={atual.letra} />
    </section>
  )
}
