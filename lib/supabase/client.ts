import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

export { createSupabaseBrowserClient as createBrowserClient }

// Valores por defecto para el build (serán sobrescritos por las variables reales en runtime)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  // Cliente sin tipado estricto hasta que el schema exista
  return createSupabaseBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  ) as any
}

// Cliente singleton para uso en componentes
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}
