// ============================================================
// SERVICIO DE EMAIL CON MAILJET — SOFTWORKS
// ============================================================

import Mailjet from 'node-mailjet';

const mailjet = process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY
  ? Mailjet.apiConnect(process.env.MAILJET_API_KEY, process.env.MAILJET_SECRET_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'administracion@softworks.com.ar';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Softworks';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://softworks.com.ar';

function getAbsoluteImageUrl(imageUrl: string | null): string {
  const placeholder = 'https://via.placeholder.com/80x80?text=Producto';
  if (!imageUrl) return placeholder;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('/')) return `${SITE_URL}${imageUrl}`;
  return `${SITE_URL}/${imageUrl}`;
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('es-AR');
}

function formatDate(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
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
// SHARED EMAIL LAYOUT
// ============================================================

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header -->
    <div style="background-color:#000000;padding:32px 28px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:3px;">SOFTWORKS</h1>
    </div>
    <!-- Content -->
    ${content}
    <!-- Footer -->
    <div style="background-color:#f8f9fa;padding:28px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">
        <a href="${SITE_URL}" style="color:#6b7280;text-decoration:none;">softworks.com.ar</a>
      </p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        © ${new Date().getFullYear()} Softworks. Todos los derechos reservados.
      </p>
      <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;">
        <a href="mailto:administracion@softworks.com.ar" style="color:#9ca3af;text-decoration:underline;">administracion@softworks.com.ar</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildItemsTable(items: Array<{
  producto_nombre: string;
  producto_imagen: string | null;
  talle: string;
  cantidad: number;
  producto_precio: number;
}>): string {
  return items.map(item => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="70" style="vertical-align:top;">
            <img src="${getAbsoluteImageUrl(item.producto_imagen)}" alt="${item.producto_nombre}" width="60" height="60" style="display:block;width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" />
          </td>
          <td style="vertical-align:top;padding-left:14px;">
            <div style="color:#111827;font-weight:600;font-size:14px;margin-bottom:4px;">${item.producto_nombre}</div>
            <div style="color:#6b7280;font-size:13px;">Talle: ${item.talle}</div>
            <div style="color:#6b7280;font-size:13px;">Cantidad: ${item.cantidad}</div>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;">
            <div style="color:#111827;font-weight:600;font-size:14px;">${formatCurrency(item.producto_precio * item.cantidad)}</div>
            ${item.cantidad > 1 ? `<div style="color:#9ca3af;font-size:12px;">${formatCurrency(item.producto_precio)} c/u</div>` : ''}
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('');
}

function buildOrderSummary(params: {
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod?: string;
  date?: string;
}): string {
  const { orderNumber, subtotal, shippingCost, total, paymentMethod, date } = params;
  const paymentLabel = paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Transferencia Bancaria';

  return `
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">N° de pedido</td>
          <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;padding:4px 0;">#${orderNumber}</td>
        </tr>
        ${date ? `
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">Fecha</td>
          <td style="color:#111827;font-size:13px;text-align:right;padding:4px 0;">${date}</td>
        </tr>` : ''}
        ${paymentMethod ? `
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">Método de pago</td>
          <td style="color:#111827;font-size:13px;text-align:right;padding:4px 0;">${paymentLabel}</td>
        </tr>` : ''}
        <tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">Subtotal</td>
          <td style="color:#111827;font-size:13px;text-align:right;padding:4px 0;">${formatCurrency(subtotal)}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">Envío</td>
          <td style="color:#111827;font-size:13px;text-align:right;padding:4px 0;">${shippingCost === 0 ? 'Gratis' : formatCurrency(shippingCost)}</td>
        </tr>
        <tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
        <tr>
          <td style="color:#111827;font-size:15px;font-weight:700;padding:4px 0;">Total</td>
          <td style="color:#111827;font-size:15px;font-weight:700;text-align:right;padding:4px 0;">${formatCurrency(total)}</td>
        </tr>
      </table>
    </div>`;
}

function buildButton(text: string, url: string, color: string = '#000000'): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="display:inline-block;background-color:${color};color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;letter-spacing:0.3px;" target="_blank">${text}</a>
    </div>`;
}

// ============================================================
// TEMPLATE: PAGO EXITOSO / PAGO APROBADO
// ============================================================
export async function sendPaymentApprovedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  paymentMethod?: string;
  isGuest?: boolean;
  items: Array<{
    producto_nombre: string;
    producto_imagen: string | null;
    talle: string;
    cantidad: number;
    producto_precio: number;
  }>;
}) {
  const { to, customerName, orderNumber, orderId, total, subtotal, shippingCost, paymentMethod, isGuest, items } = params;

  const isCard = paymentMethod === 'mercadopago';
  const title = isCard ? '¡Pago exitoso!' : '¡Tu pago fue aprobado!';
  const subject = isCard
    ? `Pago exitoso — Pedido #${orderNumber} | Softworks`
    : `Pago aprobado — Pedido #${orderNumber} | Softworks`;

  const statusBadge = `
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background-color:#dcfce7;color:#166534;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;">
        ✓ ${isCard ? 'Pago procesado exitosamente' : 'Pago verificado y aprobado'}
      </div>
    </div>`;

  const itemsHtml = buildItemsTable(items);
  const summaryHtml = buildOrderSummary({ orderNumber, subtotal, shippingCost, total, paymentMethod, date: formatDate() });

  const viewOrderButton = isGuest
    ? ''
    : buildButton('Ver Mi Pedido', `${SITE_URL}/cuenta/pedidos/${orderId}`);

  const guestNote = isGuest
    ? `<div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#1e40af;font-size:13px;margin:0;line-height:1.6;">
          📧 Todas las actualizaciones de tu pedido serán enviadas a <strong>${to}</strong>. 
          Guardá tu número de pedido <strong>#${orderNumber}</strong> para futuras consultas.
        </p>
      </div>`
    : '';

  const content = `
    <div style="padding:36px 28px 24px;">
      <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 20px;text-align:center;">${title}</h2>
      ${statusBadge}
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px;">Hola <strong>${customerName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        ${isCard
          ? `Tu pago para el pedido <strong>#${orderNumber}</strong> fue procesado exitosamente.`
          : `Tu transferencia para el pedido <strong>#${orderNumber}</strong> fue verificada y aprobada.`
        }
      </p>
      ${guestNote}
      <!-- What's next -->
      <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="color:#111827;font-size:14px;font-weight:600;margin:0 0 12px;">¿Qué sigue?</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="28" style="vertical-align:top;padding-top:2px;">
              <div style="width:20px;height:20px;background-color:#000;color:#fff;border-radius:50%;text-align:center;font-size:11px;line-height:20px;font-weight:700;">1</div>
            </td>
            <td style="padding:0 0 10px 10px;">
              <span style="color:#374151;font-size:13px;">Preparamos tu pedido con cuidado.</span>
            </td>
          </tr>
          <tr>
            <td width="28" style="vertical-align:top;padding-top:2px;">
              <div style="width:20px;height:20px;background-color:#000;color:#fff;border-radius:50%;text-align:center;font-size:11px;line-height:20px;font-weight:700;">2</div>
            </td>
            <td style="padding:0 0 10px 10px;">
              <span style="color:#374151;font-size:13px;">Te enviaremos un email con el código de seguimiento cuando sea despachado.</span>
            </td>
          </tr>
          <tr>
            <td width="28" style="vertical-align:top;padding-top:2px;">
              <div style="width:20px;height:20px;background-color:#000;color:#fff;border-radius:50%;text-align:center;font-size:11px;line-height:20px;font-weight:700;">3</div>
            </td>
            <td style="padding:0 0 0 10px;">
              <span style="color:#374151;font-size:13px;">¡Recibí tu pedido y disfrutalo!</span>
            </td>
          </tr>
        </table>
      </div>
      <!-- Products -->
      <p style="color:#111827;font-size:14px;font-weight:600;margin:24px 0 12px;">Detalle de tu pedido</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">${itemsHtml}</table>
      ${summaryHtml}
      ${viewOrderButton}
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:16px 0 0;text-align:center;">
        ¿Tenés alguna pregunta? Escribinos a 
        <a href="mailto:administracion@softworks.com.ar" style="color:#111827;text-decoration:underline;font-weight:500;">administracion@softworks.com.ar</a>
      </p>
    </div>`;

  return sendEmail({ to, subject, html: emailLayout(content) });
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
  isGuest?: boolean;
  items: Array<{
    producto_nombre: string;
    producto_imagen: string | null;
    talle: string;
    cantidad: number;
    producto_precio: number;
  }>;
}) {
  const { to, customerName, orderNumber, orderId, trackingNumber, trackingUrl, carrier, isGuest, items } = params;

  const subject = `Tu pedido #${orderNumber} fue despachado | Softworks`;

  const trackingSection = trackingNumber ? `
    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="color:#1e40af;font-size:14px;font-weight:600;margin:0 0 14px;">📦 Información de seguimiento</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        ${carrier ? `
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">Transportista</td>
          <td style="color:#1e3a5f;font-size:13px;font-weight:600;text-align:right;padding:4px 0;">${carrier}</td>
        </tr>` : ''}
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:4px 0;">N° de seguimiento</td>
          <td style="color:#1e3a5f;font-size:13px;font-weight:600;text-align:right;padding:4px 0;">${trackingNumber}</td>
        </tr>
      </table>
      ${trackingUrl ? buildButton('Rastrear mi Envío', trackingUrl, '#1d4ed8') : ''}
    </div>
  ` : '';

  const viewOrderButton = isGuest
    ? ''
    : buildButton('Ver Detalles del Pedido', `${SITE_URL}/cuenta/pedidos/${orderId}`);

  const guestNote = isGuest
    ? `<div style="background-color:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
          📧 Ante cualquier consulta sobre tu envío, contactanos a 
          <a href="mailto:administracion@softworks.com.ar" style="color:#92400e;font-weight:600;">administracion@softworks.com.ar</a> 
          indicando tu número de pedido <strong>#${orderNumber}</strong>.
        </p>
      </div>`
    : '';

  const itemsHtml = buildItemsTable(items);

  const content = `
    <div style="padding:36px 28px 24px;">
      <div style="text-align:center;margin:0 0 24px;">
        <div style="font-size:40px;margin-bottom:8px;">🚚</div>
        <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">¡Tu pedido está en camino!</h2>
        <p style="color:#6b7280;font-size:14px;margin:0;">Pedido <strong>#${orderNumber}</strong></p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px;">Hola <strong>${customerName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        ¡Buenas noticias! Tu pedido fue despachado y ya está en camino hacia vos.
      </p>
      ${trackingSection}
      ${guestNote}
      <!-- Products -->
      <p style="color:#111827;font-size:14px;font-weight:600;margin:24px 0 12px;">Productos en tu pedido</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">${itemsHtml}</table>
      ${viewOrderButton}
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:16px 0 0;text-align:center;">
        ¿Tenés alguna pregunta sobre tu envío? Escribinos a 
        <a href="mailto:administracion@softworks.com.ar" style="color:#111827;text-decoration:underline;font-weight:500;">administracion@softworks.com.ar</a>
      </p>
    </div>`;

  return sendEmail({ to, subject, html: emailLayout(content) });
}

// ============================================================
// TEMPLATE: RECUPERACIÓN DE CONTRASEÑA
// ============================================================
export async function sendPasswordResetEmail(params: {
  to: string;
  customerName?: string;
  code: string;
}) {
  const { to, customerName, code } = params;

  const greeting = customerName ? `Hola <strong>${customerName}</strong>,` : 'Hola,';

  const content = `
    <div style="padding:36px 28px 24px;">
      <div style="text-align:center;margin:0 0 24px;">
        <div style="font-size:40px;margin-bottom:8px;">🔒</div>
        <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0;">Código de verificación</h2>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 8px;">${greeting}</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en Softworks.
        Usá el siguiente código para continuar:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <div style="display:inline-block;background-color:#f3f4f6;border:2px solid #d1d5db;border-radius:12px;padding:20px 40px;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;">
            ${code}
          </span>
        </div>
      </div>
      <div style="background-color:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.6;">
          ⏰ Este código expira en <strong>15 minutos</strong>. Si no solicitaste este cambio, ignorá este email.
        </p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;text-align:center;">
        ¿No solicitaste este cambio? Tu contraseña seguirá siendo la misma.
      </p>
    </div>`;

  return sendEmail({ to, subject: 'Tu código de verificación | Softworks', html: emailLayout(content) });
}
