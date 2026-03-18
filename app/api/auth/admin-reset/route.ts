import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { solicitudId, action, adminNota } = await request.json()

    if (!solicitudId || !action) {
      return NextResponse.json({ error: 'solicitudId y action son requeridos' }, { status: 400 })
    }

    if (!['aprobar', 'rechazar'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar que la solicitud existe y está pendiente
    const { data: solicitud, error: findError } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .select('id, usuario_id, email, nombre_ingresado')
      .eq('id', solicitudId)
      .eq('estado', 'pendiente')
      .single()

    if (findError || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada o ya procesada' }, { status: 404 })
    }

    if (action === 'aprobar') {
      // Generar token temporal seguro
      const token = crypto.randomBytes(32).toString('hex')

      await supabaseAdmin
        .from('solicitudes_recuperacion')
        .update({
          estado: 'aprobada',
          token_temporal: token,
          admin_nota: adminNota || null,
          fecha_resolucion: new Date().toISOString(),
        })
        .eq('id', solicitudId)

      // Notificar al usuario
      await supabaseAdmin
        .from('notificaciones')
        .insert({
          usuario_id: solicitud.usuario_id,
          tipo: 'sistema',
          titulo: 'Solicitud de recuperación aprobada',
          mensaje: 'Tu solicitud fue aprobada. Podés ingresar a la página de recuperación para crear una nueva contraseña.',
          metadata: { action_url: '/cuenta/reset-password' },
        })

      return NextResponse.json({ success: true, message: 'Solicitud aprobada' })
    } else {
      // Rechazar
      await supabaseAdmin
        .from('solicitudes_recuperacion')
        .update({
          estado: 'rechazada',
          admin_nota: adminNota || null,
          fecha_resolucion: new Date().toISOString(),
        })
        .eq('id', solicitudId)

      // Notificar al usuario
      await supabaseAdmin
        .from('notificaciones')
        .insert({
          usuario_id: solicitud.usuario_id,
          tipo: 'sistema',
          titulo: 'Solicitud de recuperación rechazada',
          mensaje: adminNota 
            ? `Tu solicitud fue rechazada. Motivo: ${adminNota}` 
            : 'Tu solicitud de recuperación fue rechazada. Si creés que es un error, intentá nuevamente o contactanos.',
        })

      return NextResponse.json({ success: true, message: 'Solicitud rechazada' })
    }
  } catch (error) {
    console.error('Error in admin-reset:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
