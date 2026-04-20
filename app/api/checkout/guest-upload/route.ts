import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNewOrderEmail } from '@/lib/email';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BUCKET_NAME = 'receipts';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const orderId = formData.get('orderId') as string | null;
    const transferReference = formData.get('transfer_reference') as string | null;
    const transferDate = formData.get('transfer_date') as string | null;
    const transferAmount = formData.get('transfer_amount') as string | null;
    const customerNotes = formData.get('customer_notes') as string | null;

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Archivo y ID de pedido requeridos' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten imágenes o PDFs' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 5MB' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify this is a guest order (usuario_id is null) and is pending payment
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .select('id, estado')
      .eq('id', orderId)
      .is('usuario_id', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.estado !== 'pendiente_pago' && order.estado !== 'pago_rechazado') {
      return NextResponse.json({ error: 'Este pedido ya tiene un comprobante en revisión o fue aprobado' }, { status: 400 });
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}/${Date.now()}.${fileExt}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Guest upload error:', uploadError);
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // Create verification record
    const { error: verificationError } = await supabase
      .from('verificaciones_pago')
      .insert({
        pedido_id: orderId,
        comprobante_url: publicUrl,
        comprobante_nombre: file.name,
        referencia_transferencia: transferReference || null,
        fecha_transferencia: transferDate || null,
        monto_transferido: transferAmount ? parseFloat(transferAmount) : null,
        notas_cliente: customerNotes || null,
        estado: 'pendiente',
      });

    if (verificationError) {
      console.error('Guest verification error:', verificationError);
      return NextResponse.json({ error: 'Error al registrar el comprobante' }, { status: 500 });
    }

    // Update order status
    await supabase
      .from('pedidos')
      .update({ estado: 'esperando_verificacion' })
      .eq('id', orderId);

    // Notify admin
    const { data: orderForEmail } = await supabase
      .from('pedidos')
      .select('numero_pedido, cliente_nombre, cliente_email, total, subtotal, costo_envio')
      .eq('id', orderId)
      .single();

    const { data: itemsForEmail } = await supabase
      .from('items_pedido')
      .select('producto_nombre, producto_imagen, talle, cantidad, producto_precio')
      .eq('pedido_id', orderId);

    if (orderForEmail) {
      sendAdminNewOrderEmail({
        orderNumber: orderForEmail.numero_pedido,
        customerName: orderForEmail.cliente_nombre,
        customerEmail: orderForEmail.cliente_email,
        total: orderForEmail.total,
        subtotal: orderForEmail.subtotal,
        shippingCost: orderForEmail.costo_envio || 0,
        paymentMethod: 'transferencia',
        isGuest: true,
        eventType: 'transfer_receipt',
        orderId,
        items: (itemsForEmail || []) as Array<{ producto_nombre: string; producto_imagen: string | null; talle: string; cantidad: number; producto_precio: number; }>,
      }).catch((err: any) => console.error('Admin email error (guest transfer):', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Guest upload error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
