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
        { error: 'Configuración del servidor incompleta. Contacta al administrador del sistema.' },
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
      .select('id, email, nombre')
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

    console.log(`Iniciando eliminación completa del usuario: ${userProfile.email}`);

    // ============================================
    // PASO 1: Obtener todos los pedidos del usuario
    // ============================================
    const { data: pedidos, error: pedidosError } = await supabaseAdmin
      .from('pedidos')
      .select('id')
      .eq('usuario_id', userId);

    if (pedidosError) {
      console.error('Error obteniendo pedidos:', pedidosError);
      return NextResponse.json(
        { error: 'Error obteniendo pedidos del usuario' },
        { status: 500 }
      );
    }

    const pedidoIds = pedidos?.map(p => p.id) || [];
    console.log(`Pedidos a eliminar: ${pedidoIds.length}`);

    // ============================================
    // PASO 2: Eliminar datos relacionados a los pedidos
    // ============================================
    if (pedidoIds.length > 0) {
      // Eliminar verificaciones de pago
      const { error: verifError } = await supabaseAdmin
        .from('verificaciones_pago')
        .delete()
        .in('pedido_id', pedidoIds);
      
      if (verifError) {
        console.error('Error eliminando verificaciones:', verifError);
      }

      // Eliminar información de envío
      const { error: envioError } = await supabaseAdmin
        .from('info_envio')
        .delete()
        .in('pedido_id', pedidoIds);
      
      if (envioError) {
        console.error('Error eliminando info de envío:', envioError);
      }

      // Eliminar items de pedido
      const { error: itemsError } = await supabaseAdmin
        .from('items_pedido')
        .delete()
        .in('pedido_id', pedidoIds);
      
      if (itemsError) {
        console.error('Error eliminando items de pedido:', itemsError);
      }

      // Eliminar historial de pedidos
      const { error: historialError } = await supabaseAdmin
        .from('historial_pedido')
        .delete()
        .in('pedido_id', pedidoIds);
      
      if (historialError) {
        console.error('Error eliminando historial:', historialError);
      }

      // Eliminar los pedidos
      const { error: deletePedidosError } = await supabaseAdmin
        .from('pedidos')
        .delete()
        .eq('usuario_id', userId);

      if (deletePedidosError) {
        console.error('Error eliminando pedidos:', deletePedidosError);
        return NextResponse.json(
          { error: 'Error eliminando pedidos del usuario' },
          { status: 500 }
        );
      }
      
      console.log('Pedidos y datos relacionados eliminados correctamente');
    }

    // ============================================
    // PASO 3: Eliminar direcciones del usuario
    // ============================================
    const { error: direccionesError } = await supabaseAdmin
      .from('direcciones')
      .delete()
      .eq('usuario_id', userId);

    if (direccionesError) {
      console.error('Error eliminando direcciones:', direccionesError);
    }

    // ============================================
    // PASO 4: Eliminar carrito del usuario
    // ============================================
    const { error: carritoError } = await supabaseAdmin
      .from('carritos')
      .delete()
      .eq('usuario_id', userId);

    if (carritoError) {
      console.error('Error eliminando carrito:', carritoError);
    }

    // ============================================
    // PASO 5: Eliminar el usuario de auth.users
    // (Esto eliminará el perfil en cascada)
    // ============================================
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error eliminando usuario de auth:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el usuario: ' + deleteError.message },
        { status: 500 }
      );
    }

    console.log(`Usuario ${userProfile.email} eliminado completamente`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuario y todos sus datos eliminados correctamente',
        deletedOrders: pedidoIds.length
      },
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
