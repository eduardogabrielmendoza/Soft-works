import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/cuenta/perfil'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile if it doesn't exist (for OAuth users)
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // Check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('perfiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        const meta = data.user.user_metadata
        await supabaseAdmin.from('perfiles').upsert({
          id: data.user.id,
          email: data.user.email || '',
          nombre: meta?.full_name?.split(' ')[0] || meta?.name?.split(' ')[0] || '',
          apellido: meta?.full_name?.split(' ').slice(1).join(' ') || meta?.name?.split(' ').slice(1).join(' ') || '',
          avatar_url: meta?.avatar_url || meta?.picture || null,
          rol: 'cliente',
        }, { onConflict: 'id' })
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // Auth error — redirect to login
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  return NextResponse.redirect(`${siteUrl}/cuenta?error=auth`)
}
