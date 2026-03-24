import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('id');
    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    // Validate UUID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch order — only allow guest orders (es_invitado or usuario_id is null)
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', orderId)
      .is('usuario_id', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('items_pedido')
      .select('*')
      .eq('pedido_id', orderId);

    // Fetch active bank accounts (for transfer instructions)
    const { data: bankAccounts } = await supabase
      .from('cuentas_bancarias')
      .select('*')
      .eq('activa', true)
      .order('orden_visualizacion', { ascending: true });

    return NextResponse.json({
      order: { ...order, items: items || [] },
      bankAccounts: bankAccounts || [],
    });
  } catch (error) {
    console.error('Guest order fetch error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
