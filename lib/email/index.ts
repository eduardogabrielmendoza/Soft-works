// ============================================================
// SERVICIO DE EMAIL CON MAILJET
// ============================================================

import Mailjet from 'node-mailjet';

const mailjet = process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY
  ? Mailjet.apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'softworksargentina@gmail.com';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Softworks';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://softworks.com.ar';

function getAbsoluteImageUrl(imageUrl: string | null): string {
  const placeholder = 'https://via.placeholder.com/80x80?text=Producto';
  if (!imageUrl) return placeholder;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('/')) return `${SITE_URL}${imageUrl}`;
  return `${SITE_URL}/${imageUrl}`;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(data: EmailData) {
  if (!mailjet) {
    console.log('[Email] Mailjet no configurado. Destinatario:', data.to, '| Asunto:', data.subject);
    return { success: true, data: null };
  }

  try {
    const result = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: FROM_EMAIL, Name: FROM_NAME },
          To: [{ Email: data.to }],
          Subject: data.subject,
          HTMLPart: data.html,
        },
      ],
    });
    console.log('[Email] Enviado a:', data.to);
    return { success: true, data: result.body };
  } catch (error: any) {
    console.error('[Email] Error:', error?.message || error);
    return { success: false, error };
  }
}

// ============================================================
// TEMPLATE: CONFIRMACIÓN DE COMPRA
// ============================================================
export async function sendOrderConfirmationEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  paymentMethod: string;
  items: Array<{
    producto_nombre: string;
    producto_imagen: string | null;
    talle: string;
    cantidad: number;
    producto_precio: number;
  }>;
}) {
  const { to, customerName, orderNumber, orderId, total, subtotal, shippingCost, paymentMethod, items } = params;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="65" style="vertical-align: top;">
            <img src="${getAbsoluteImageUrl(item.producto_imagen)}" alt="${item.producto_nombre}" width="55" height="55" style="display:block;width:55px;height:55px;object-fit:cover;border-radius:4px;" />
          </td>
          <td style="vertical-align: top; padding-left: 12px;">
            <div style="color:#000;font-weight:600;font-size:14px;margin-bottom:3px;">${item.producto_nombre}</div>
            <div style="color:#666;font-size:13px;">Talle: ${item.talle} · Cantidad: ${item.cantidad}</div>
            <div style="color:#000;font-size:13px;margin-top:3px;">$${item.producto_precio.toLocaleString('es-AR')}</div>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('');

  const metodoPagoLabel = paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Transferencia bancaria';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#000;padding:28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;letter-spacing:2px;">SOFTWORKS</h1>
  </div>
  <div style="padding:36px 28px;">
    <h2 style="color:#000;font-size:21px;margin:0 0 18px;text-align:center;">¡Recibimos tu pedido!</h2>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">Hola <strong>${customerName}</strong>,</p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Gracias por tu compra. Tu pedido <strong>#${orderNumber}</strong> fue registrado exitosamente.
      ${paymentMethod === 'transferencia' ? 'Una vez que verifiquemos tu transferencia, te avisaremos por email.' : ''}
    </p>
    <div style="margin:24px 0;">
      <h3 style="color:#000;font-size:15px;margin:0 0 12px;">Productos:</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;">${itemsHtml}</table>
    </div>
    <div style="background:#f8f9fa;border-radius:8px;padding:18px;margin:24px 0;">
      <p style="color:#666;font-size:14px;margin:4px 0;"><strong>Pedido:</strong> #${orderNumber}</p>
      <p style="color:#666;font-size:14px;margin:4px 0;"><strong>Subtotal:</strong> $${subtotal.toLocaleString('es-AR')}</p>
      <p style="color:#666;font-size:14px;margin:4px 0;"><strong>Envío:</strong> ${shippingCost === 0 ? 'Gratis' : '$' + shippingCost.toLocaleString('es-AR')}</p>
      <p style="color:#000;font-size:15px;margin:8px 0 4px;font-weight:600;"><strong>Total:</strong> $${total.toLocaleString('es-AR')}</p>
      <p style="color:#666;font-size:14px;margin:4px 0;"><strong>Método de pago:</strong> ${metodoPagoLabel}</p>
    </div>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Por cualquier consulta, escribinos a <a href="mailto:softworksargentina@gmail.com" style="color:#000;text-decoration:underline;">softworksargentina@gmail.com</a>
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/cuenta/pedidos/${orderId}" style="display:inline-block;background:#000;color:#fff;padding:13px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Ver Mi Pedido</a>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Softworks. Todos los derechos reservados.</p>
  </div>
</div></body></html>`;

  return sendEmail({ to, subject: `Confirmación de pedido #${orderNumber} - Softworks`, html });
}

// ============================================================
// TEMPLATE: PEDIDO DESPACHADO
// ============================================================
export async function sendOrderShippedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  items: Array<{
    producto_nombre: string;
    producto_imagen: string | null;
    talle: string;
    cantidad: number;
    producto_precio: number;
  }>;
}) {
  const { to, customerName, orderNumber, orderId, trackingNumber, trackingUrl, carrier, items } = params;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="65" style="vertical-align: top;">
            <img src="${getAbsoluteImageUrl(item.producto_imagen)}" alt="${item.producto_nombre}" width="55" height="55" style="display:block;width:55px;height:55px;object-fit:cover;border-radius:4px;" />
          </td>
          <td style="vertical-align: top; padding-left: 12px;">
            <div style="color:#000;font-weight:600;font-size:14px;margin-bottom:3px;">${item.producto_nombre}</div>
            <div style="color:#666;font-size:13px;">Talle: ${item.talle} · Cantidad: ${item.cantidad}</div>
            <div style="color:#000;font-size:13px;margin-top:3px;">$${item.producto_precio.toLocaleString('es-AR')}</div>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('');

  const trackingSection = trackingNumber ? `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:18px;margin:24px 0;">
      <h3 style="color:#0369a1;font-size:15px;margin:0 0 12px;">Información de seguimiento</h3>
      ${carrier ? `<p style="color:#666;font-size:14px;margin:4px 0;"><strong>Transportista:</strong> ${carrier}</p>` : ''}
      <p style="color:#666;font-size:14px;margin:4px 0;"><strong>Código de seguimiento:</strong> ${trackingNumber}</p>
      ${trackingUrl ? `<div style="margin-top:14px;"><a href="${trackingUrl}" style="display:inline-block;background:#0369a1;color:#fff;padding:11px 22px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;" target="_blank">Rastrear Envío</a></div>` : ''}
    </div>
  ` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#000;padding:28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;letter-spacing:2px;">SOFTWORKS</h1>
  </div>
  <div style="padding:36px 28px;">
    <h2 style="color:#000;font-size:21px;margin:0 0 18px;text-align:center;">¡Tu pedido está en camino!</h2>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">Hola <strong>${customerName}</strong>,</p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Tu pedido <strong>#${orderNumber}</strong> fue despachado y ya está en camino.
    </p>
    ${trackingSection}
    <div style="margin:24px 0;">
      <h3 style="color:#000;font-size:15px;margin:0 0 12px;">Productos:</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;">${itemsHtml}</table>
    </div>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Por cualquier consulta sobre tu envío, escribinos a <a href="mailto:softworksargentina@gmail.com" style="color:#000;text-decoration:underline;">softworksargentina@gmail.com</a>
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/cuenta/pedidos/${orderId}" style="display:inline-block;background:#000;color:#fff;padding:13px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Ver Detalles del Pedido</a>
    </div>
  </div>
  <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Softworks. Todos los derechos reservados.</p>
  </div>
</div></body></html>`;

  return sendEmail({ to, subject: `Tu pedido #${orderNumber} fue despachado - Softworks`, html });
}

// ============================================================
// TEMPLATE: CONFIRMACIÓN DE CUENTA
// ============================================================
export async function sendConfirmationEmail(params: {
  to: string;
  customerName?: string;
  confirmationUrl: string;
}) {
  const { to, customerName, confirmationUrl } = params;

  const greeting = customerName ? `Hola <strong>${customerName}</strong>,` : 'Hola,';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#000;padding:28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;letter-spacing:2px;">SOFTWORKS</h1>
  </div>
  <div style="padding:36px 28px;">
    <h2 style="color:#000;font-size:21px;margin:0 0 18px;text-align:center;">Confirmá tu cuenta</h2>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting}
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ¡Gracias por registrarte en Softworks! Hacé clic en el botón de abajo para confirmar tu email y activar tu cuenta.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${confirmationUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Confirmar Email</a>
    </div>
    <p style="color:#666;font-size:13px;line-height:1.5;margin:16px 0 0;">
      Si no creaste una cuenta en Softworks, podés ignorar este mensaje.
    </p>
  </div>
  <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Softworks. Todos los derechos reservados.</p>
  </div>
</div></body></html>`;

  return sendEmail({ to, subject: 'Confirmá tu cuenta en Softworks', html });
}

// ============================================================
// TEMPLATE: RECUPERACIÓN DE CONTRASEÑA
// ============================================================
export async function sendPasswordResetEmail(params: {
  to: string;
  customerName?: string;
  confirmationUrl: string;
}) {
  const { to, customerName, confirmationUrl } = params;

  const greeting = customerName ? `Hola <strong>${customerName}</strong>,` : 'Hola,';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#000;padding:28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;letter-spacing:2px;">SOFTWORKS</h1>
  </div>
  <div style="padding:36px 28px;">
    <h2 style="color:#000;font-size:21px;margin:0 0 18px;text-align:center;">Restablecé tu contraseña</h2>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting}
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón de abajo para elegir una nueva contraseña.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${confirmationUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Restablecer Contraseña</a>
    </div>
    <p style="color:#666;font-size:13px;line-height:1.5;margin:16px 0 0;">
      Si no solicitaste este cambio, ignorá este email. Tu contraseña seguirá siendo la misma.
    </p>
    <p style="color:#999;font-size:12px;line-height:1.5;margin:12px 0 0;">
      Este enlace expira en 24 horas.
    </p>
  </div>
  <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Softworks. Todos los derechos reservados.</p>
  </div>
</div></body></html>`;

  return sendEmail({ to, subject: 'Restablecé tu contraseña - Softworks', html });
}

// ============================================================
// TEMPLATE: BIENVENIDA (REGISTRO EXITOSO)
// ============================================================
export async function sendWelcomeEmail(params: {
  to: string;
  customerName?: string;
}) {
  const { to, customerName } = params;

  const greeting = customerName ? `Hola <strong>${customerName}</strong>,` : 'Hola,';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f4f4;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#000;padding:28px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:600;letter-spacing:2px;">SOFTWORKS</h1>
  </div>
  <div style="padding:36px 28px;">
    <h2 style="color:#000;font-size:21px;margin:0 0 18px;text-align:center;">¡Bienvenido a Softworks!</h2>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ${greeting}
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      ¡Gracias por crear tu cuenta! Ya podés explorar nuestras colecciones, guardar tus direcciones de envío y hacer seguimiento de tus pedidos.
    </p>
    <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Te enviaremos un email cada vez que haya una actualización importante sobre tus pedidos.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE_URL}/colecciones" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Ver Colecciones</a>
    </div>
    <p style="color:#666;font-size:13px;line-height:1.5;margin:16px 0 0;">
      Si tenés alguna consulta, escribinos a <a href="mailto:softworksargentina@gmail.com" style="color:#000;text-decoration:underline;">softworksargentina@gmail.com</a>
    </p>
  </div>
  <div style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Softworks. Todos los derechos reservados.</p>
  </div>
</div></body></html>`;

  return sendEmail({ to, subject: '¡Bienvenido a Softworks!', html });
}
