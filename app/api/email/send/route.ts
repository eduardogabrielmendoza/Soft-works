import { NextRequest, NextResponse } from 'next/server';
import { sendOrderShippedEmail, sendPaymentApprovedEmail } from '@/lib/email';
import { verifyAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Only admins can send arbitrary emails
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'order_shipped':
        result = await sendOrderShippedEmail({
          to: data.email,
          customerName: data.customerName,
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          carrier: data.carrier,
          isGuest: data.isGuest,
          items: data.items || [],
        });
        break;

      case 'payment_approved':
        result = await sendPaymentApprovedEmail({
          to: data.email,
          customerName: data.customerName,
          orderNumber: data.orderNumber,
          orderId: data.orderId,
          total: data.total,
          subtotal: data.subtotal,
          shippingCost: data.shippingCost,
          paymentMethod: data.paymentMethod,
          isGuest: data.isGuest,
          items: data.items || [],
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
