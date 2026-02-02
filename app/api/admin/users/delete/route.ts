import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Este endpoint usa el service_role para eliminar usuarios de auth.users
// Solo debe ser accesible por administradores

export async function POST(request: NextRequest) {
  try {
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Variables de entorno faltantes:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!serviceRoleKey 
      });
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, adminId } = body;

    if (!userId || !adminId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // No permitir auto-eliminación
    if (userId === adminId) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      );
    }

    // Crear cliente con service_role para operaciones de admin
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar que el solicitante es admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', adminId)
      .single();

    if (adminError) {
      console.error('Error verificando admin:', adminError);
      return NextResponse.json(
        { error: 'Error verificando permisos de administrador' },
        { status: 500 }
      );
    }

    if (!adminProfile || adminProfile.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    // Verificar que el usuario a eliminar existe
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('perfiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error buscando usuario:', userError);
      return NextResponse.json(
        { error: 'Error buscando usuario' },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si tiene pedidos - si tiene, no permitir eliminar
    const { count: orderCount, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId);

    if (orderError) {
      console.error('Error verificando pedidos:', orderError);
      return NextResponse.json(
        { error: 'Error verificando pedidos del usuario' },
        { status: 500 }
      );
    }

    if (orderCount && orderCount > 0) {
      return NextResponse.json(
        { error: `El usuario tiene ${orderCount} pedido(s) asociado(s). No se puede eliminar.` },
        { status: 400 }
      );
    }

    // Eliminar el usuario de auth.users (esto eliminará el perfil en cascada)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error eliminando usuario de auth:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el usuario: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Usuario eliminado correctamente' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error en API de eliminación:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
