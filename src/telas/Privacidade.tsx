import type { SupabaseClient } from '@supabase/supabase-js'
import { useState } from 'react'
import { EMAIL_CONTATO, RESPONSAVEL_DOCUMENTO, RESPONSAVEL_NOME, VERSAO_PRIVACIDADE } from '../lib/privacidade'

// "27 de outubro de 2026" a partir de AAAA-MM-DD (sem mexer com fuso).
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
function dataPorExtenso(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return `${dia} de ${MESES[mes - 1]} de ${ano}`
}

type Props = {
  // Com cliente e aoAceitar: tela de aceite. Sem eles: só leitura.
  cliente?: SupabaseClient
  aoAceitar?: () => void
}

export default function Privacidade({ cliente, aoAceitar }: Props) {
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function aceitar() {
    if (!cliente || !aoAceitar) return
    setErro('')
    setEnviando(true)
    // O banco confere a versão e grava o aceite só para o próprio usuário.
    const { error } = await cliente.rpc('aceitar_privacidade', { versao: VERSAO_PRIVACIDADE })
    setEnviando(false)
    if (error) return setErro('Não foi possível registrar o aceite. Tente de novo.')
    aoAceitar()
  }

  return (
    <section className="painel privacidade">
      <h1>Sua privacidade</h1>
      <h2>Quem cuida dos seus dados</h2>
      <p>
        Responsável: {RESPONSAVEL_NOME} ({RESPONSAVEL_DOCUMENTO}), da Físico Sagrado.
      </p>
      <h2>Quais dados</h2>
      <p>
        Seu nome, seu e-mail, sua ficha de treino, as anotações de carga que você
        escreve, a data do seu aceite e registros técnicos de acesso (data de
        login, endereço IP). No futuro, vídeos e conversas, com um aviso próprio antes.
      </p>
      <h2>Para quê</h2>
      <p>
        Usamos seus dados para prestar o serviço de assessoria que você contratou:
        acompanhar e orientar o seu treino.
      </p>
      <h2>Quem vê</h2>
      <p>
        Só você e o professor. Os serviços que hospedam o app (Supabase e
        Cloudflare) guardam os dados para nós, sem uso próprio. Não vendemos seus
        dados nem os compartilhamos para propaganda.
      </p>
      <h2>Onde ficam</h2>
      <p>
        No Supabase, com servidores em São Paulo. A Cloudflare entrega o app para
        abrir no seu celular.
      </p>
      <h2>Por quanto tempo</h2>
      <p>
        Enquanto você for aluno. Quando você deixar de ser aluno, seus dados são
        apagados a pedido ou depois de 6 meses sem uso (a limpeza automática
        ainda está sendo implantada).
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode ver, corrigir e apagar seus dados e pedir a exclusão; sem os
        dados não é possível usar o app. É só pedir pelo e-mail {EMAIL_CONTATO}.
      </p>
      <h2>Um pedido</h2>
      <p>Não escreva dados de saúde (dores, lesões, remédios) nas anotações.</p>
      <p className="texto-secundario">Versão de {dataPorExtenso(VERSAO_PRIVACIDADE)}.</p>
      {cliente && aoAceitar && (
        <>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="botao" type="button" disabled={enviando} onClick={() => void aceitar()}>
            Li e aceito
          </button>
          <p className="texto-secundario">Se não concordar, fale com o professor antes de usar o app.</p>
        </>
      )}
    </section>
  )
}
