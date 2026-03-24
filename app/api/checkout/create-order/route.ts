import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthUser(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      direccion_envio,
      items,
      subtotal,
      costo_envio,
      total,
      customer_notes,
      shipping_zone_id,
      metodo_pago,
      // Guest fields
      guest_nombre,
      guest_email,
      guest_telefono,
    } = body;

    if (!direccion_envio || !items?.length || !subtotal || !total) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get authenticated user (null for guests)
    let user = null;
    try {
      user = await getAuthUser(req);
    } catch {
      // Guest checkout - no auth cookies available
    }

    let usuario_id: string | null = null;
    let cliente_nombre = guest_nombre || '';
    let cliente_email = guest_email || '';
    let cliente_telefono = guest_telefono || null;

    // If authenticated, use profile data
    if (user) {
      usuario_id = user.id;
      const { data: profile } = await supabase
        .from('perfiles')
        .select('email, nombre, apellido, telefono')
        .eq('id', user.id)
        .single();

      if (profile) {
        cliente_nombre = `${profile.nombre || ''} ${profile.apellido || ''}`.trim();
        cliente_email = profile.email || user.email || '';
        cliente_telefono = profile.telefono || null;
      }
    }

    // Generate order number
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });
    const sequentialNumber = ((count || 0) + 1).toString().padStart(7, '0');
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const suffix = letters.charAt(Math.floor(Math.random() * letters.length)) +
                   letters.charAt(Math.floor(Math.random() * letters.length));
    const numero_pedido = `SW-${sequentialNumber}-${suffix}`;

    // Create order (service role bypasses RLS)
    const orderPayload: Record<string, unknown> = {
      numero_pedido,
      usuario_id: usuario_id,  // null for guest orders
      estado: 'pendiente_pago',
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      direccion_envio,
      subtotal,
      costo_envio: costo_envio || 0,
      monto_descuento: 0,
      total,
      notas_cliente: customer_notes || null,
      metodo_pago: metodo_pago || 'transferencia',
    };

    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .insert(orderPayload)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: `Error al crear el pedido: ${orderError.message}` }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      pedido_id: order.id,
      producto_id: item.producto_id,
      producto_nombre: item.producto_nombre,
      producto_slug: item.producto_slug,
      producto_imagen: item.producto_imagen,
      producto_precio: item.producto_precio,
      talle: item.talle,
      cantidad: item.cantidad,
      total_linea: item.producto_precio * item.cantidad,
    }));

    const { error: itemsError } = await supabase
      .from('items_pedido')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      await supabase.from('pedidos').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Error al crear items del pedido' }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
