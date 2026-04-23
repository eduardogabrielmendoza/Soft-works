import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNewOrderEmail } from '@/lib/email';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // This endpoint is called by clients after submitting a payment receipt.
  // It notifies the admin — no admin auth required here, but we validate
  // the orderId to prevent abuse.

  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json({ error: 'orderId inválido' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: order } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, cliente_nombre, cliente_email, total, subtotal, costo_envio, usuario_id, estado')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Only notify for orders that just had a receipt submitted
    if (order.estado !== 'esperando_verificacion' && order.estado !== 'pendiente_pago') {
      return NextResponse.json({ ok: true }); // silently skip
    }

    const { data: items } = await supabase
      .from('items_pedido')
      .select('producto_nombre, producto_imagen, talle, cantidad, producto_precio')
      .eq('pedido_id', orderId);

    await sendAdminNewOrderEmail({
      orderNumber: order.numero_pedido,
      customerName: order.cliente_nombre,
      customerEmail: order.cliente_email,
      total: order.total,
      subtotal: order.subtotal,
      shippingCost: order.costo_envio || 0,
      paymentMethod: 'transferencia',
      isGuest: !order.usuario_id,
      eventType: 'transfer_receipt',
      orderId: order.id,
      items: (items || []) as Array<{
        producto_nombre: string;
        producto_imagen: string | null;
        talle: string;
        cantidad: number;
        producto_precio: number;
      }>,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
