import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

export { createSupabaseBrowserClient as createBrowserClient }

export function createClient() {
  // Cliente sin tipado estricto hasta que el schema exista
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
