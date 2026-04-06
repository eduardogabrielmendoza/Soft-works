import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
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

    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) {
      console.error('[ForgotPassword] Error listing users:', listError.message)
      return NextResponse.json({ success: true })
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true })
    }

    // Generate secure reset token and store in user metadata
    const resetToken = randomUUID()
    const resetExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        reset_token: resetToken,
        reset_token_expires: resetExpires,
      },
    })

    // Get user name for personalized email
    const { data: profile } = await supabaseAdmin
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .single()

    // Build reset URL pointing directly to our reset page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://softworks.com.ar'
    const resetUrl = `${siteUrl}/cuenta/reset-password?token=${resetToken}&uid=${user.id}`

    await sendPasswordResetEmail({
      to: email,
      customerName: profile?.nombre || undefined,
      confirmationUrl: resetUrl,
    })

    // Always return success (don't reveal if email exists)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ForgotPassword] Unexpected error:', err)
    return NextResponse.json({ success: true })
  }
}
