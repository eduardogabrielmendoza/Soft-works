import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, nombreIngresado, securityQuestion, securityAnswer } = await request.json()

    if (!email || !nombreIngresado) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Buscar perfil por email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre, apellido, pregunta_seguridad, respuesta_seguridad')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (profileError || !profile) {
      // No revelar si el email existe o no
      return NextResponse.json({ success: true, message: 'Si el email existe, tu solicitud fue registrada.' })
    }

    // Verificar pregunta de seguridad si fue proporcionada
    let securityVerified = false
    if (securityQuestion && securityAnswer && profile.pregunta_seguridad && profile.respuesta_seguridad) {
      securityVerified = 
        profile.pregunta_seguridad === securityQuestion &&
        profile.respuesta_seguridad === securityAnswer.trim().toLowerCase()
    }

    // Verificar si ya hay una solicitud pendiente
    const { data: existing } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .select('id')
      .eq('usuario_id', profile.id)
      .eq('estado', 'pendiente')
      .single()

    if (existing) {
      return NextResponse.json({ success: true, message: 'Ya tenés una solicitud pendiente. Un administrador la revisará pronto.' })
    }

    // Crear solicitud de recuperación
    const { error: insertError } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .insert({
        usuario_id: profile.id,
        email: email.toLowerCase().trim(),
        nombre_ingresado: nombreIngresado.trim(),
        estado: 'pendiente',
        pregunta_seguridad_verificada: securityVerified,
      })

    if (insertError) {
      console.error('Error creating reset request:', insertError)
      return NextResponse.json({ error: 'Error al crear solicitud' }, { status: 500 })
    }

    // Notificar al usuario
    await supabaseAdmin
      .from('notificaciones')
      .insert({
        usuario_id: profile.id,
        tipo: 'sistema',
        titulo: 'Solicitud de recuperación recibida',
        mensaje: 'Tu solicitud de recuperación de contraseña fue recibida. Un administrador la revisará pronto.',
      })

    // Notificar a todos los admins
    const { data: admins } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('rol', 'admin')

    if (admins && admins.length > 0) {
      const adminNotifs = admins.map((admin) => ({
        usuario_id: admin.id,
        tipo: 'admin',
        titulo: 'Nueva solicitud de recuperación',
        mensaje: `${nombreIngresado} (${email}) solicita recuperar su contraseña.${securityVerified ? ' ✓ Pregunta de seguridad verificada.' : ''}`,
        metadata: { solicitud_tipo: 'recuperacion', usuario_email: email },
      }))
      await supabaseAdmin.from('notificaciones').insert(adminNotifs)
    }

    return NextResponse.json({ success: true, message: 'Tu solicitud fue registrada. Un administrador la revisará pronto.' })
  } catch (error) {
    console.error('Error in request-reset:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
