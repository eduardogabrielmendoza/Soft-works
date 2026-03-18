import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, firstName, lastName, avatarUrl, securityQuestion, securityAnswer } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Usar service_role key para bypasear RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Crear el perfil
    const profileData: Record<string, unknown> = {
      id: userId,
      email: email,
      nombre: firstName || '',
      apellido: lastName || '',
      rol: 'cliente',
      email_verificado: true,
    }
    if (avatarUrl) {
      profileData.avatar_url = avatarUrl
    }
    if (securityQuestion) {
      profileData.pregunta_seguridad = securityQuestion
    }
    if (securityAnswer) {
      profileData.respuesta_seguridad = securityAnswer
    }

    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Crear notificación de bienvenida
    try {
      const customerName = firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : 'Cliente';
      await supabaseAdmin
        .from('notificaciones')
        .insert({
          usuario_id: userId,
          tipo: 'bienvenida',
          titulo: '¡Bienvenido/a a Softworks!',
          mensaje: `Hola ${customerName}, tu cuenta fue creada exitosamente. Explorá nuestros productos y colecciones.`,
        });
    } catch (notifError) {
      console.error('Error creating welcome notification:', notifError);
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in create-profile:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
