import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find user via perfiles table (reliable, no pagination issues)
    const { data: profile } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre')
      .ilike('email', email.trim())
      .single()

    if (!profile) {
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true })
    }

    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    if (getUserError || !user) {
      return NextResponse.json({ success: true })
    }

    // Generate 6-digit code with 15-minute expiry
    const resetCode = randomInt(100000, 999999).toString()
    const resetExpires = Date.now() + 15 * 60 * 1000

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        reset_code: resetCode,
        reset_code_expires: resetExpires,
        reset_code_email: email.trim().toLowerCase(),
      },
    })

    if (updateError) {
      console.error('[ForgotPassword] Error updating user metadata:', updateError.message)
      return NextResponse.json({ success: true })
    }

    await sendPasswordResetEmail({
      to: email,
      customerName: profile.nombre || undefined,
      code: resetCode,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ForgotPassword] Unexpected error:', err)
    return NextResponse.json({ success: true })
  }
}
