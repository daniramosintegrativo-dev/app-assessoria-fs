// Lógica pura da Edge Function gerenciar-aluno.
// Sem dependências de Deno: também é testada com vitest.

// Sem 0/O, 1/l/I (confundem na leitura pelo WhatsApp).
const LETRAS_MAIUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LETRAS_MINUSCULAS = 'abcdefghijkmnpqrstuvwxyz'
const NUMEROS = '23456789'
const ALFABETO = LETRAS_MAIUSCULAS + LETRAS_MINUSCULAS + NUMEROS
const TAMANHO_SENHA = 12

// Sorteia um índice sem viés (descarta valores que desequilibrariam o resto).
function sortearIndice(limite: number): number {
  const teto = 256 - (256 % limite)
  const byte = new Uint8Array(1)
  do {
    crypto.getRandomValues(byte)
  } while (byte[0] >= teto)
  return byte[0] % limite
}

export function gerarSenhaProvisoria(): string {
  while (true) {
    let senha = ''
    for (let i = 0; i < TAMANHO_SENHA; i++) senha += ALFABETO[sortearIndice(ALFABETO.length)]
    // Exige os três tipos de caractere.
    if (/[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha)) return senha
  }
}

export function normalizarNome(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const nome = valor.trim()
  return nome.length >= 1 && nome.length <= 100 ? nome : null
}

// Validação simples de formato; quem confirma de verdade é o Supabase Auth.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const email = valor.trim().toLowerCase()
  return email.length <= 254 && FORMATO_EMAIL.test(email) ? email : null
}

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type Pedido =
  | { acao: 'criar'; nome: string; email: string }
  | { acao: 'nova_senha'; id: string }
  | { acao: 'desativar'; id: string }
  | { acao: 'ativar'; id: string }
  | { acao: 'listar' }

export type ResultadoPedido = { ok: true; pedido: Pedido } | { ok: false; erro: string }

export function lerPedido(corpo: unknown): ResultadoPedido {
  if (typeof corpo !== 'object' || corpo === null || Array.isArray(corpo)) {
    return { ok: false, erro: 'Pedido inválido.' }
  }
  const c = corpo as Record<string, unknown>
  switch (c.acao) {
    case 'criar': {
      const nome = normalizarNome(c.nome)
      if (!nome) return { ok: false, erro: 'Informe o nome (até 100 caracteres).' }
      const email = normalizarEmail(c.email)
      if (!email) return { ok: false, erro: 'Informe um e-mail válido.' }
      return { ok: true, pedido: { acao: 'criar', nome, email } }
    }
    case 'nova_senha':
    case 'desativar':
    case 'ativar':
      if (typeof c.id !== 'string' || !FORMATO_UUID.test(c.id)) {
        return { ok: false, erro: 'Aluno inválido.' }
      }
      return { ok: true, pedido: { acao: c.acao, id: c.id } }
    case 'listar':
      return { ok: true, pedido: { acao: 'listar' } }
    default:
      return { ok: false, erro: 'Ação desconhecida.' }
  }
}
