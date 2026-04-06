import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, nombreIngresado, securityAnswer, step } = await request.json()

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
      return NextResponse.json({ error: 'No se encontró una cuenta con ese email.' }, { status: 404 })
    }

    // Verificar que el nombre coincida
    const fullName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim().toLowerCase()
    const inputName = nombreIngresado.trim().toLowerCase()
    if (fullName !== inputName && profile.nombre?.toLowerCase() !== inputName) {
      return NextResponse.json({ error: 'El nombre no coincide con la cuenta registrada.' }, { status: 400 })
    }

    // Step 1: Validate email + name, return security question
    if (step === 'validate') {
      // Check for pending request first
      const { data: existing } = await supabaseAdmin
        .from('solicitudes_recuperacion')
        .select('id, fecha_creacion')
        .eq('usuario_id', profile.id)
        .eq('estado', 'pendiente')
        .single()

      if (existing) {
        return NextResponse.json({
          success: true,
          pending: true,
          message: 'Ya tenés una solicitud pendiente. Un administrador la revisará pronto.',
          fecha: existing.fecha_creacion,
        })
      }

      return NextResponse.json({
        success: true,
        securityQuestion: profile.pregunta_seguridad || null,
      })
    }

    // Step 2: Submit with security answer
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

    // Verificar pregunta de seguridad
    let securityVerified = false
    const userAnswer = (securityAnswer || '').trim().toLowerCase()
    if (profile.pregunta_seguridad && profile.respuesta_seguridad && userAnswer) {
      securityVerified = profile.respuesta_seguridad === userAnswer
    }

    // Crear solicitud de recuperación
    const { data: solicitud, error: insertError } = await supabaseAdmin
      .from('solicitudes_recuperacion')
      .insert({
        usuario_id: profile.id,
        email: email.toLowerCase().trim(),
        nombre_ingresado: nombreIngresado.trim(),
        estado: 'pendiente',
        pregunta_seguridad_verificada: securityVerified,
        pregunta_seguridad: profile.pregunta_seguridad || null,
        respuesta_seguridad: profile.respuesta_seguridad || null,
      })
      .select('id')
      .single()

    if (insertError || !solicitud) {
      console.error('Error creating reset request:', insertError)
      return NextResponse.json({ error: 'Error al crear solicitud' }, { status: 500 })
    }

    // Notificar a todos los admins (mantener in-app para el panel admin)
    const { data: admins } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('rol', 'admin')

    if (admins && admins.length > 0) {
      const securityInfo = profile.pregunta_seguridad
        ? securityVerified
          ? ' ✓ Respuesta de seguridad correcta.'
          : ' ✗ Respuesta de seguridad incorrecta.'
        : ''

      const adminNotifs = admins.map((admin) => ({
        usuario_id: admin.id,
        tipo: 'admin',
        titulo: 'Nueva solicitud de recuperación',
        mensaje: `${nombreIngresado} (${email}) solicita recuperar su contraseña.${securityInfo}`,
        metadata: {
          solicitud_tipo: 'recuperacion',
          usuario_email: email,
          solicitud_id: solicitud.id,
        },
      }))
      await supabaseAdmin.from('notificaciones').insert(adminNotifs)
    }

    return NextResponse.json({ success: true, message: 'Tu solicitud fue registrada. Un administrador la revisará pronto.' })
  } catch (error) {
    console.error('Error in request-reset:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
