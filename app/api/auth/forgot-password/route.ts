import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    // Generate recovery link using Supabase Admin API (no SMTP needed)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://softworks.com.ar'}/auth/callback?next=${encodeURIComponent('/cuenta/reset-password')}`,
      },
    })

    if (error) {
      // Don't reveal if user exists or not
      console.error('[ForgotPassword] Error:', error.message)
      return NextResponse.json({ success: true })
    }

    // Get user name for personalized email
    const { data: profile } = await supabaseAdmin
      .from('perfiles')
      .select('nombre')
      .eq('id', data.user.id)
      .single()

    // Send the reset email via Mailjet
    const actionLink = data.properties?.action_link
    if (actionLink) {
      await sendPasswordResetEmail({
        to: email,
        customerName: profile?.nombre || undefined,
        confirmationUrl: actionLink,
      })
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ForgotPassword] Unexpected error:', err)
    return NextResponse.json({ success: true })
  }
}
