// Junta a função e o módulo compartilhado num arquivo só, para colar no
// editor do painel do Supabase. Uso: npm run build:function
import { readFileSync, writeFileSync } from 'node:fs'

const pasta = 'supabase/functions'
const compartilhado = readFileSync(`${pasta}/_shared/aluno.ts`, 'utf8')
const principal = readFileSync(`${pasta}/gerenciar-aluno/index.ts`, 'utf8')

const importSupabase = principal.match(/^import \{ createClient \}.*$/m)?.[0]
if (!importSupabase) throw new Error('import do supabase-js não encontrado')

const semImports = (texto) => texto.replace(/^import .*\n/gm, '')
const semExport = (texto) => texto.replace(/^export /gm, '')

const saida = [
  '// ARQUIVO GERADO por `npm run build:function`. Não edite: mude os arquivos',
  '// em supabase/functions/ e gere de novo. Cole tudo no editor do painel.',
  importSupabase,
  '',
  '// ---- _shared/aluno.ts ----',
  semExport(semImports(compartilhado)).trim(),
  '',
  '// ---- gerenciar-aluno/index.ts ----',
  semImports(principal).trim(),
  '',
].join('\n')

writeFileSync(`${pasta}/gerenciar-aluno/PAINEL.ts`, saida)
console.log('Gerado: supabase/functions/gerenciar-aluno/PAINEL.ts')
