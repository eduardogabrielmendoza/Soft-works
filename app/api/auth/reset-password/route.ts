import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { token, uid, password } = await request.json()

    if (!token || !uid || !password) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user and verify token
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(uid)

    if (getUserError || !user) {
      return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 })
    }

    const storedToken = user.user_metadata?.reset_token
    const tokenExpires = user.user_metadata?.reset_token_expires

    if (!storedToken || storedToken !== token) {
      return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 })
    }

    if (!tokenExpires || Date.now() > tokenExpires) {
      return NextResponse.json({ error: 'El enlace expiró. Solicitá uno nuevo.' }, { status: 400 })
    }

    // Update password and clear the reset token
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
      password,
      user_metadata: {
        ...user.user_metadata,
        reset_token: null,
        reset_token_expires: null,
      },
    })

    if (updateError) {
      console.error('[ResetPassword] Error updating password:', updateError.message)
      return NextResponse.json({ error: 'Error al actualizar la contraseña' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ResetPassword] Unexpected error:', err)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
