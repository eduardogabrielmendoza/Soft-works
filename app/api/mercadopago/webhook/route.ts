import { NextRequest, NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getMercadoPagoMode, createMPClient } from '@/lib/api/mercadopago-config';
import { sendPaymentApprovedEmail, sendAdminNewOrderEmail } from '@/lib/email';

// Use service role to update orders (bypass RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Verify MercadoPago webhook signature (W6 fix).
 * If MERCADOPAGO_WEBHOOK_SECRET is not set, logs a warning and allows the request
 * (graceful degradation for initial setup).
 *
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function verifyWebhookSignature(req: NextRequest, body: Record<string, unknown>): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[Webhook] MERCADOPAGO_WEBHOOK_SECRET not configured — skipping signature verification. Set this in production!');
    return true;
  }

  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');

  if (!xSignature || !xRequestId) {
    console.error('[Webhook] Missing x-signature or x-request-id headers');
    return false;
  }

  // Parse x-signature: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  xSignature.split(',').forEach(part => {
    const [key, ...valueParts] = part.trim().split('=');
    if (key && valueParts.length) parts[key] = valueParts.join('=');
  });

  const ts = parts['ts'];
  const v1 = parts['v1'];

  if (!ts || !v1) {
    console.error('[Webhook] Invalid x-signature format');
    return false;
  }

  // Build manifest string per MercadoPago docs
  const dataId = (body.data as Record<string, unknown>)?.id;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Compute HMAC-SHA256
  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  if (hmac !== v1) {
    console.error('[Webhook] Signature mismatch — possible forged request');
    return false;
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature before processing (W6 fix)
    if (!verifyWebhookSignature(req, body)) {
      // Return 200 anyway to prevent MercadoPago from retrying a forged request
      return NextResponse.json({ received: true, error: 'invalid_signature' });
    }

    // MercadoPago sends different notification types
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Get current mode and create client
      const mode = await getMercadoPagoMode();
      const client = await createMPClient(mode);
      const payment = new Payment(client);

      // Get payment details from MercadoPago
      const paymentData = await payment.get({ id: paymentId });

      const orderId = paymentData.external_reference;
      const status = paymentData.status; // approved, rejected, pending, in_process, etc.

      if (!orderId) {
        console.error('No external_reference in payment:', paymentId);
        return NextResponse.json({ received: true });
      }

      const supabase = getSupabaseAdmin();

      // Map MP status to our order status
      let newEstado: string;
      let pagadoEl: string | null = null;

      switch (status) {
        case 'approved':
          newEstado = 'pago_aprobado';
          pagadoEl = new Date().toISOString();
          break;
        case 'rejected':
        case 'cancelled':
          newEstado = 'pago_rechazado';
          break;
        case 'pending':
        case 'in_process':
        case 'in_mediation':
          newEstado = 'pendiente_pago';
          break;
        default:
          newEstado = 'pendiente_pago';
      }

      // Update order status
      const updateData: Record<string, unknown> = {
        estado: newEstado,
        metodo_pago: 'mercadopago',
        mp_payment_id: paymentId.toString(),
      };
      if (pagadoEl) {
        updateData.pagado_el = pagadoEl;
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order from webhook:', error);
      } else {
        // Send payment success email for approved payments
        if (newEstado === 'pago_aprobado') {
          try {
            // Fetch order details + items for the email
            const { data: orderData } = await supabase
              .from('pedidos')
              .select('*')
              .eq('id', orderId)
              .single();

            const { data: orderItems } = await supabase
              .from('items_pedido')
              .select('*')
              .eq('pedido_id', orderId);

            if (orderData && orderItems) {
              const mappedItems = orderItems.map((item: Record<string, unknown>) => ({
                producto_nombre: item.producto_nombre as string,
                producto_imagen: item.producto_imagen as string | null,
                talle: item.talle as string,
                cantidad: item.cantidad as number,
                producto_precio: item.producto_precio as number,
              }));

              await sendPaymentApprovedEmail({
                to: orderData.cliente_email,
                customerName: orderData.cliente_nombre,
                orderNumber: orderData.numero_pedido,
                orderId: orderData.id,
                total: orderData.total,
                subtotal: orderData.subtotal,
                shippingCost: orderData.costo_envio || 0,
                paymentMethod: 'mercadopago',
                isGuest: !orderData.usuario_id,
                items: mappedItems,
              });

              // Notify admin
              await sendAdminNewOrderEmail({
                orderNumber: orderData.numero_pedido,
                customerName: orderData.cliente_nombre,
                customerEmail: orderData.cliente_email,
                total: orderData.total,
                subtotal: orderData.subtotal,
                shippingCost: orderData.costo_envio || 0,
                paymentMethod: 'mercadopago',
                isGuest: !orderData.usuario_id,
                eventType: 'mp_approved',
                orderId: orderData.id,
                items: mappedItems,
              }).catch((err: unknown) => console.error('Admin email error (mp):', err));
            }
          } catch (emailErr) {
            console.error('Error sending payment success email:', emailErr);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to MercadoPago so it doesn't retry indefinitely
    return NextResponse.json({ received: true });
  }
}

// MercadoPago may also send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
