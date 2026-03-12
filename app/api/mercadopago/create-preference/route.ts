import { NextRequest, NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { getMercadoPagoMode, createMPClient } from '@/lib/api/mercadopago-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderNumber, items, shipping, total, payerEmail, payerName } = body;

    if (!orderId || !items || !total) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Get current mode from DB config
    const mode = await getMercadoPagoMode();
    const client = await createMPClient(mode);
    const preference = new Preference(client);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://softworks.com.ar';

    const preferenceData = await preference.create({
      body: {
        items: items.map((item: { title: string; quantity: number; unit_price: number; picture_url?: string }) => ({
          id: item.title,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: 'ARS',
          picture_url: item.picture_url || undefined,
        })),
        // Add shipping as a separate item if > 0
        ...(shipping && shipping > 0
          ? {
              shipments: {
                cost: shipping,
                mode: 'not_specified' as const,
              },
            }
          : {}),
        payer: {
          email: payerEmail || undefined,
          name: payerName?.split(' ')[0] || undefined,
          surname: payerName?.split(' ').slice(1).join(' ') || undefined,
        },
        back_urls: {
          success: `${siteUrl}/checkout/confirmacion?order=${orderId}&mp_status=approved`,
          failure: `${siteUrl}/checkout/confirmacion?order=${orderId}&mp_status=rejected`,
          pending: `${siteUrl}/checkout/confirmacion?order=${orderId}&mp_status=pending`,
        },
        auto_return: 'approved',
        external_reference: orderId,
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        statement_descriptor: 'SOFTWORKS',
      },
    });

    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
      sandbox_init_point: preferenceData.sandbox_init_point,
      mode,
    });
  } catch (error) {
    console.error('MercadoPago preference error:', error);
    return NextResponse.json(
      { error: 'Error al crear la preferencia de pago' },
      { status: 500 }
    );
  }
}
