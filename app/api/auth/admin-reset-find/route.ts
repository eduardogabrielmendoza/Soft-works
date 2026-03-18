import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Verify the caller is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await (supabase as any).from('perfiles').select('rol').eq('id', user.id).single()
    if (!profile || profile.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Find pending solicitud
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: solicitud } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('estado', 'pendiente')
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single()

    if (!solicitud) {
      return NextResponse.json({ solicitudId: null })
    }

    return NextResponse.json({ solicitudId: solicitud.id })
  } catch (error) {
    console.error('Error in admin-reset-find:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
