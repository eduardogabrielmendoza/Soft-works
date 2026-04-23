import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, firstName, lastName, avatarUrl } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate that the caller owns this userId
    const authenticatedUser = await getAuthenticatedUser()
    if (!authenticatedUser || authenticatedUser.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: userId does not match authenticated session' },
        { status: 403 }
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

    // Crear el perfil — rol is ALWAYS 'cliente' to prevent privilege escalation
    const profileData: Record<string, unknown> = {
      id: userId,
      email: email,
      nombre: firstName || '',
      apellido: lastName || '',
      rol: 'cliente',
    }
    if (avatarUrl) {
      profileData.avatar_url = avatarUrl
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

    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in create-profile:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
