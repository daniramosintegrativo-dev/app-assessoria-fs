import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Endereço e chave "publishable" são PÚBLICOS por natureza (vão no navegador de
// qualquer aluno). A segurança vem do RLS no banco. Ficam no código para não
// depender de variáveis na Cloudflare. NUNCA ponha aqui a chave "secret".
export const SUPABASE_URL = 'https://mayocglxeoyxrmetmdbl.supabase.co'
export const SUPABASE_CHAVE_PUBLICA = 'sb_publishable_RZX_85w0qXXyAM0qX6dHyA_RxpycX9U'

// Tipo anulável: os testes trocam este módulo por um cliente falso ou nulo.
export const supabase: SupabaseClient | null = createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA)
