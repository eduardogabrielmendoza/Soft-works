import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

export { createSupabaseBrowserClient as createBrowserClient }

// Valores por defecto para el build (serán sobrescritos por las variables reales en runtime)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Cliente singleton - debe ser reutilizado
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createClient() {
  return createSupabaseBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  ) as any
}

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createClient()
  }
  
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
