import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, code, password } = await request.json()

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find user by email via perfiles table
    const { data: profile } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .ilike('email', email.trim())
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    if (getUserError || !user) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    const storedCode = user.user_metadata?.reset_code
    const codeExpires = user.user_metadata?.reset_code_expires
    const codeEmail = user.user_metadata?.reset_code_email

    // Verify code matches
    if (!storedCode || storedCode !== code.trim()) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 })
    }

    // Verify email matches
    if (!codeEmail || codeEmail !== email.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 })
    }

    // Verify not expired
    if (!codeExpires || Date.now() > codeExpires) {
      return NextResponse.json({ error: 'El código expiró. Solicitá uno nuevo.' }, { status: 400 })
    }

    // Update password and clear the reset code
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password,
      user_metadata: {
        ...user.user_metadata,
        reset_code: null,
        reset_code_expires: null,
        reset_code_email: null,
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
