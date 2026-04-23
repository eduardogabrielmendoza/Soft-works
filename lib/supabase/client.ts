import { createBrowserClient } from '@supabase/ssr'

// Valores por defecto para el build (serán sobrescritos por las variables reales en runtime)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

/**
 * Supabase browser client.
 *
 * Note: We intentionally omit the Database generic here because @supabase/supabase-js@2.91
 * produces 'never' types when chaining .eq()/.update() filters with complex Database generics.
 * The server-side client (lib/supabase/server.ts) uses the Database generic where it works
 * correctly with @supabase/ssr's createServerClient.
 *
 * Runtime behavior is identical — this is purely a TypeScript inference limitation.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserClient = ReturnType<typeof createBrowserClient<any>>

// Cliente singleton - debe ser reutilizado en el navegador
let browserClient: BrowserClient | null = null

function createUntypedBrowserClient(): BrowserClient {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )
}

/**
 * Get the Supabase browser client (singleton on the client, fresh on the server).
 * All client-side code should use this function.
 */
export function getSupabaseClient(): BrowserClient {
  if (typeof window === 'undefined') {
    // Server-side: create a fresh instance per call (no cookies, just public access)
    return createUntypedBrowserClient()
  }

  if (!browserClient) {
    browserClient = createUntypedBrowserClient()
  }
  return browserClient
}

// Alias for backwards compatibility
export { getSupabaseClient as createClient }
