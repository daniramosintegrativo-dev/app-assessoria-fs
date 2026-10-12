import { createClient } from '@supabase/supabase-js'

// Estas duas variáveis são PÚBLICAS por natureza (vão no navegador). A segurança
// vem do RLS no banco. VITE_SUPABASE_ANON_KEY pode ser a chave "publishable"
// do painel novo do Supabase. NUNCA ponha aqui a chave "secret"/service_role.
const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem configuração o cliente é nulo e o app mostra um aviso em vez de quebrar.
export const supabase = url && chave ? createClient(url, chave) : null
