import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMercadoPagoConfig } from '@/lib/api/mercadopago-config';
import {
  sendEmail,
  sendPaymentApprovedEmail,
  sendOrderShippedEmail,
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

function maskToken(token: string | undefined): string {
  if (!token) return 'NO CONFIGURADO';
  if (token.length <= 16) return `${token.substring(0, 4)}...`;
  return `${token.substring(0, 12)}...${token.substring(token.length - 4)}`;
}

export async function GET() {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const diagnostics: Record<string, any> = {};

  // 1. Mailjet config
  diagnostics.email = {
    provider: 'Mailjet',
    apiKeyConfigured: !!process.env.MAILJET_API_KEY,
    secretKeyConfigured: !!process.env.MAILJET_SECRET_KEY,
    fromEmail: process.env.EMAIL_FROM || 'administracion@softworks.com.ar',
    fromName: process.env.EMAIL_FROM_NAME || 'Softworks',
  };

  // 2. MercadoPago config (from DB + env fallback)
  const mpConfig = await getMercadoPagoConfig();
  const mpMode = mpConfig.mercadopago_mode || 'production';
  const prodToken = mpConfig.access_token_production || process.env.MERCADOPAGO_ACCESS_TOKEN_PRODUCTION;
  const sandboxToken = mpConfig.access_token_sandbox || process.env.MERCADOPAGO_ACCESS_TOKEN_SANDBOX;

  diagnostics.mercadopago = {
    mode: mpMode,
    accessTokenProductionConfigured: !!prodToken,
    accessTokenProductionPreview: maskToken(prodToken),
    accessTokenSandboxConfigured: !!sandboxToken,
    accessTokenSandboxPreview: maskToken(sandboxToken),
    // Whether tokens are from DB or env
    tokenSource: mpConfig.access_token_production ? 'database' : (process.env.MERCADOPAGO_ACCESS_TOKEN_PRODUCTION ? 'env' : 'none'),
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

    if (action === 'save_mp_config') {
      const { accessTokenProduction, accessTokenSandbox, mode } = body;
      const supabase = await createClient();

      // Read existing config
      const { data: existing } = await supabase
        .from('configuracion_sitio')
        .select('valor')
        .eq('clave', 'mercadopago')
        .single() as { data: { valor: Record<string, unknown> } | null };

      const currentConfig = (existing?.valor && typeof existing.valor === 'object')
        ? existing.valor
        : {};

      // Merge new values (only update fields that were provided)
      const newConfig: Record<string, unknown> = { ...currentConfig };
      if (mode) newConfig.mercadopago_mode = mode;
      if (accessTokenProduction !== undefined) newConfig.access_token_production = accessTokenProduction;
      if (accessTokenSandbox !== undefined) newConfig.access_token_sandbox = accessTokenSandbox;

      // Upsert
      const { error } = await (supabase
        .from('configuracion_sitio') as any)
        .upsert({
          clave: 'mercadopago',
          valor: newConfig,
        }, { onConflict: 'clave' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Configuración de MercadoPago guardada' });
    }

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
        case 'order_confirmation':
          result = await sendPaymentApprovedEmail({
            to: emailTo,
            customerName: 'Cliente de Prueba',
            orderNumber: testOrderNumber,
            orderId: '00000000-0000-0000-0000-000000000000',
            total: 15000,
            subtotal: 14000,
            shippingCost: 1000,
            paymentMethod: 'mercadopago',
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

        case 'raw_test':
          result = await sendEmail({
            to: emailTo,
            subject: 'Test de conexión - Softworks',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #000;">Test de Email - Softworks</h2>
                <p>Si estás viendo este email, la configuración de Mailjet está funcionando correctamente.</p>
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
