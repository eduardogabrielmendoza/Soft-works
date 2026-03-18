import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Buscar la solicitud más reciente para este email
    const { data: solicitud } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .select('id, estado, token_temporal, fecha_creacion')
      .eq('email', email.toLowerCase().trim())
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single()

    if (!solicitud) {
      return NextResponse.json({ estado: 'none' })
    }

    return NextResponse.json({
      estado: solicitud.estado,
      token: solicitud.estado === 'aprobada' ? solicitud.token_temporal : null,
      fecha: solicitud.fecha_creacion,
    })
  } catch (error) {
    console.error('Error in check-reset:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
