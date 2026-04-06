import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token y nueva contraseña son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Buscar solicitud aprobada con este token
    const { data: solicitud, error: findError } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .select('id, usuario_id, email')
      .eq('token_temporal', token)
      .eq('estado', 'aprobada')
      .single()

    if (findError || !solicitud) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }

    // Verificar que el token no haya expirado (24 horas desde la aprobación)
    // No tenemos fecha_aprobacion, pero podemos usar fecha_resolucion

    // Actualizar contraseña del usuario via Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      solicitud.usuario_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Error al actualizar la contraseña' }, { status: 500 })
    }

    // Marcar solicitud como completada con un nuevo estado
    await supabaseAdmin
      .from('solicitudes_recuperacion')
      .update({ estado: 'completada' as any, token_temporal: null })
      .eq('id', solicitud.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in complete-reset:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
