import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(mpClient);

// Use service role to update orders (bypass RLS)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MercadoPago sends different notification types
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

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
        console.log(`Order ${orderId} updated to ${newEstado} via webhook (payment ${paymentId})`);
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
