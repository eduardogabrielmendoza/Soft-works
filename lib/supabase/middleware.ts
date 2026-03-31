import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Determine if this route needs full auth verification
  const protectedRoutes = ['/cuenta/perfil', '/cuenta/direcciones', '/cuenta/pedidos']
  const adminRoutes = ['/admin']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  const needsAuth = isProtectedRoute || isAdminRoute || 
    request.nextUrl.pathname === '/cuenta' || 
    request.nextUrl.pathname === '/cuenta/registro'

  // For public routes, use getSession() (local, no HTTP call) just to refresh cookies
  // For protected routes, use getUser() (validates with Supabase Auth server)
  let user = null
  if (needsAuth) {
    const { data: { user: verifiedUser } } = await supabase.auth.getUser()
    user = verifiedUser
  } else {
    // Just refresh the session cookie without an HTTP round-trip
    await supabase.auth.getSession()
    return supabaseResponse
  }

  // Redirigir a login si no está autenticado en rutas protegidas
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/cuenta'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Verificar acceso admin
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/cuenta'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Verificar rol de admin (tabla en español: perfiles, columna: rol)
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Redirigir usuarios autenticados que intentan acceder a login/registro
  if (user && (request.nextUrl.pathname === '/cuenta' || request.nextUrl.pathname === '/cuenta/registro')) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    const url = request.nextUrl.clone()
    url.pathname = redirect || '/cuenta/perfil'
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
