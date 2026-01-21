// ============================================================
// SERVICIO DE EMAIL - DESACTIVADO TEMPORALMENTE
// TODO: Implementar SendGrid
// ============================================================

// Solo inicializar Resend si hay API key configurada
const resend = process.env.RESEND_API_KEY 
  ? new (require('resend').Resend)(process.env.RESEND_API_KEY)
  : null;

// Email del remitente (debe ser verificado en Resend)
const FROM_EMAIL = process.env.EMAIL_FROM || 'Softworks <onboarding@resend.dev>';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(data: EmailData) {
  // Si no hay cliente de email configurado, solo loguear
  if (!resend) {
    console.log('[Email desactivado] No se envió email a:', data.to);
    return { success: true, data: null };
  }
  
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Función para enviar email de pago aprobado
export async function sendPaymentApprovedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  total: number;
}) {
  const { to, customerName, orderNumber, orderId, total } = params;
  
  const subject = `✅ ¡Tu pago ha sido aprobado! - Pedido #${orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SOFTWORKS</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">✓</span>
            </div>
          </div>
          
          <h2 style="color: #000000; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
            ¡Pago Aprobado!
          </h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola <strong>${customerName}</strong>,
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ¡Excelentes noticias! Hemos verificado y aprobado tu pago. Tu pedido está siendo preparado para envío.
          </p>
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #000000; font-size: 16px; margin: 0 0 15px 0;">Detalles del pedido:</h3>
            <p style="color: #666666; font-size: 14px; margin: 5px 0;"><strong>Número de pedido:</strong> #${orderNumber}</p>
            <p style="color: #666666; font-size: 14px; margin: 5px 0;"><strong>Total:</strong> $${total.toLocaleString('es-AR')}</p>
            <p style="color: #666666; font-size: 14px; margin: 5px 0;"><strong>Estado:</strong> <span style="color: #22c55e; font-weight: 600;">Pago Aprobado</span></p>
          </div>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Te notificaremos nuevamente cuando tu pedido sea despachado con la información de seguimiento.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cuenta/pedidos/${orderId}" 
               style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Ver Mi Pedido
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
            ¿Tenés alguna pregunta? Respondé este email o contactanos.
          </p>
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Softworks. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Función para enviar email de pedido enviado
export async function sendOrderShippedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}) {
  const { to, customerName, orderNumber, orderId, trackingNumber, trackingUrl, carrier } = params;
  
  const subject = `📦 ¡Tu pedido está en camino! - Pedido #${orderNumber}`;
  
  const trackingSection = trackingNumber ? `
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #0369a1; font-size: 16px; margin: 0 0 15px 0;">📍 Información de seguimiento:</h3>
      ${carrier ? `<p style="color: #666666; font-size: 14px; margin: 5px 0;"><strong>Transportista:</strong> ${carrier}</p>` : ''}
      <p style="color: #666666; font-size: 14px; margin: 5px 0;"><strong>Número de seguimiento:</strong> ${trackingNumber}</p>
      ${trackingUrl ? `
        <div style="margin-top: 15px;">
          <a href="${trackingUrl}" 
             style="display: inline-block; background-color: #0369a1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;"
             target="_blank">
            🔍 Rastrear Envío
          </a>
        </div>
      ` : ''}
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SOFTWORKS</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">📦</span>
            </div>
          </div>
          
          <h2 style="color: #000000; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
            ¡Tu pedido está en camino!
          </h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola <strong>${customerName}</strong>,
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ¡Tu pedido <strong>#${orderNumber}</strong> ha sido despachado y está en camino hacia vos!
          </p>
          
          ${trackingSection}
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Te notificaremos cuando tu pedido sea entregado. ¡Gracias por tu compra!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cuenta/pedidos/${orderId}" 
               style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Ver Detalles del Pedido
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
            ¿Tenés alguna pregunta sobre tu envío? Respondé este email.
          </p>
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Softworks. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Función para enviar email de pedido entregado
export async function sendOrderDeliveredEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
}) {
  const { to, customerName, orderNumber, orderId } = params;
  
  const subject = `🎉 ¡Tu pedido ha sido entregado! - Pedido #${orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SOFTWORKS</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">🎉</span>
            </div>
          </div>
          
          <h2 style="color: #000000; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
            ¡Pedido Entregado!
          </h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola <strong>${customerName}</strong>,
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ¡Tu pedido <strong>#${orderNumber}</strong> ha sido entregado exitosamente! Esperamos que disfrutes tus productos.
          </p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="color: #166534; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">
              ¡Gracias por tu compra! 💚
            </p>
            <p style="color: #166534; font-size: 14px; margin: 0;">
              Tu opinión es muy importante para nosotros.
            </p>
          </div>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Si tenés algún problema con tu pedido o querés hacer una devolución, no dudes en contactarnos.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/colecciones" 
               style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Seguir Comprando
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
            ¿Tenés alguna pregunta? Respondé este email o contactanos.
          </p>
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Softworks. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

// Función para enviar email de pago rechazado
export async function sendPaymentRejectedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  reason?: string;
}) {
  const { to, customerName, orderNumber, orderId, reason } = params;
  
  const subject = `⚠️ Problema con tu pago - Pedido #${orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #000000; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">SOFTWORKS</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background-color: #ef4444; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 30px;">⚠️</span>
            </div>
          </div>
          
          <h2 style="color: #000000; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
            Problema con tu pago
          </h2>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hola <strong>${customerName}</strong>,
          </p>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Lamentablemente, no pudimos verificar el pago de tu pedido <strong>#${orderNumber}</strong>.
          </p>
          
          ${reason ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="color: #dc2626; font-size: 14px; margin: 0 0 10px 0;">Motivo:</h3>
            <p style="color: #666666; font-size: 14px; margin: 0;">${reason}</p>
          </div>
          ` : ''}
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Por favor, ingresá a tu cuenta para subir un nuevo comprobante de pago o contactanos si creés que esto es un error.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cuenta/pedidos/${orderId}" 
               style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Ver Mi Pedido
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
            ¿Necesitás ayuda? Respondé este email o contactanos.
          </p>
          <p style="color: #999999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Softworks. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
