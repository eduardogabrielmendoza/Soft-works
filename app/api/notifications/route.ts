import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json([], { status: 401 })
  }

  const { data, error } = await (supabase as any)
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha_creacion', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()

  if (body.all) {
    const { error } = await (supabase as any)
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', user.id)
      .eq('leida', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  if (body.id) {
    const { error } = await (supabase as any)
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', body.id)
      .eq('usuario_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Parámetro inválido' }, { status: 400 })
}
