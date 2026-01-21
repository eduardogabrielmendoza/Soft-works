import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, firstName, lastName } = await request.json()

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
    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .upsert({
        id: userId,
        email: email,
        nombre: firstName || '',
        apellido: lastName || '',
        rol: 'cliente',
      }, {
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
  } catch (error: any) {
    console.error('Error in create-profile:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
