import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sgMail from '@sendgrid/mail';
import {
  sendEmail,
  sendPaymentApprovedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendPaymentRejectedEmail,
  sendWelcomeEmail,
} from '@/lib/email';

// Verificar que el usuario es admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single() as { data: { rol: string } | null };

  if (profile?.rol !== 'admin') return null;
  return user;
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Diagnóstico del sistema
  const diagnostics: Record<string, any> = {};

  // 1. SendGrid config
  diagnostics.sendgrid = {
    apiKeyConfigured: !!process.env.SENDGRID_API_KEY,
    apiKeyPreview: process.env.SENDGRID_API_KEY
      ? `${process.env.SENDGRID_API_KEY.substring(0, 8)}...${process.env.SENDGRID_API_KEY.substring(process.env.SENDGRID_API_KEY.length - 4)}`
      : 'NO CONFIGURADA',
    fromEmail: process.env.EMAIL_FROM || 'administracion@softworks.com.ar',
    fromName: process.env.EMAIL_FROM_NAME || 'Softworks',
    replyTo: process.env.EMAIL_REPLY_TO || 'softworksargentina@gmail.com',
  };

  // 2. MercadoPago config
  diagnostics.mercadopago = {
    accessTokenConfigured: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    accessTokenPreview: process.env.MERCADOPAGO_ACCESS_TOKEN
      ? `${process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 12)}...`
      : 'NO CONFIGURADO',
    sandboxTokenConfigured: !!process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN,
    publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      ? `${process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY.substring(0, 12)}...`
      : 'NO CONFIGURADA',
  };

  // 3. Site config
  diagnostics.site = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NO CONFIGURADA',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'NO CONFIGURADA',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'NO CONFIGURADA',
  };

  // 4. Database check
  try {
    const supabase = await createClient();
    const { count: ordersCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });

    const { count: productsCount } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });

    const { count: usersCount } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true });

    diagnostics.database = {
      connected: true,
      pedidos: ordersCount ?? 0,
      productos: productsCount ?? 0,
      usuarios: usersCount ?? 0,
    };
  } catch (error: any) {
    diagnostics.database = {
      connected: false,
      error: error.message,
    };
  }

  return NextResponse.json({ diagnostics });
}

export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, emailTo, emailType } = body;

    if (action === 'test_email') {
      if (!emailTo) {
        return NextResponse.json({ error: 'Email destinatario requerido' }, { status: 400 });
      }

      const testOrderNumber = `TEST-${Date.now().toString().slice(-6)}`;
      const testItems = [
        {
          producto_nombre: 'Producto de Prueba',
          producto_imagen: null,
          talle: 'M',
          cantidad: 1,
          producto_precio: 15000,
        },
      ];

      let result;

      switch (emailType) {
        case 'payment_approved':
          result = await sendPaymentApprovedEmail({
            to: emailTo,
            customerName: 'Cliente de Prueba',
            orderNumber: testOrderNumber,
            orderId: '00000000-0000-0000-0000-000000000000',
            total: 15000,
            items: testItems,
          });
          break;

        case 'order_shipped':
          result = await sendOrderShippedEmail({
            to: emailTo,
            customerName: 'Cliente de Prueba',
            orderNumber: testOrderNumber,
            orderId: '00000000-0000-0000-0000-000000000000',
            trackingNumber: 'TEST-TRACK-123456',
            trackingUrl: 'https://softworks.com.ar',
            carrier: 'Correo Argentino',
            items: testItems,
          });
          break;

        case 'order_delivered':
          result = await sendOrderDeliveredEmail({
            to: emailTo,
            customerName: 'Cliente de Prueba',
            orderNumber: testOrderNumber,
            orderId: '00000000-0000-0000-0000-000000000000',
            items: testItems,
          });
          break;

        case 'payment_rejected':
          result = await sendPaymentRejectedEmail({
            to: emailTo,
            customerName: 'Cliente de Prueba',
            orderNumber: testOrderNumber,
            orderId: '00000000-0000-0000-0000-000000000000',
            reason: 'Este es un email de prueba - motivo de ejemplo',
            items: testItems,
          });
          break;

        case 'welcome':
          result = await sendWelcomeEmail({
            to: emailTo,
            customerName: 'Cliente de Prueba',
          });
          break;

        case 'raw_test':
          // Test básico sin template - para verificar que SendGrid funciona
          result = await sendEmail({
            to: emailTo,
            subject: 'Test de conexión - Softworks',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #000;">Test de Email - Softworks</h2>
                <p>Si estás viendo este email, la configuración de SendGrid está funcionando correctamente.</p>
                <p><strong>Detalles:</strong></p>
                <ul>
                  <li>Fecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</li>
                  <li>Enviado desde: ${process.env.EMAIL_FROM || 'administracion@softworks.com.ar'}</li>
                  <li>Destinatario: ${emailTo}</li>
                </ul>
                <p style="color: #666; font-size: 12px;">Este es un email de prueba enviado desde el panel de debug de Softworks.</p>
              </div>
            `,
          });
          break;

        default:
          return NextResponse.json({ error: 'Tipo de email no válido' }, { status: 400 });
      }

      return NextResponse.json({
        success: result.success,
        emailType,
        sentTo: emailTo,
        error: result.success ? null : String(result.error),
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
