// Tipos de email disponibles
export type EmailType = 
  | 'payment_approved' 
  | 'payment_rejected' 
  | 'order_shipped' 
  | 'order_delivered';

// Datos requeridos para cada tipo de email
export interface PaymentApprovedData {
  email: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  total: number;
}

export interface PaymentRejectedData {
  email: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  reason?: string;
}

export interface OrderShippedData {
  email: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export interface OrderDeliveredData {
  email: string;
  customerName: string;
  orderNumber: string;
  orderId: string;
}

// ============================================================
// EMAILS DESACTIVADOS TEMPORALMENTE
// TODO: Implementar SendGrid
// ============================================================

// Función para enviar emails desde el cliente (DESACTIVADA)
export async function sendOrderEmail(
  type: 'payment_approved',
  data: PaymentApprovedData
): Promise<{ success: boolean; error?: string }>;

export async function sendOrderEmail(
  type: 'payment_rejected',
  data: PaymentRejectedData
): Promise<{ success: boolean; error?: string }>;

export async function sendOrderEmail(
  type: 'order_shipped',
  data: OrderShippedData
): Promise<{ success: boolean; error?: string }>;

export async function sendOrderEmail(
  type: 'order_delivered',
  data: OrderDeliveredData
): Promise<{ success: boolean; error?: string }>;

export async function sendOrderEmail(
  type: EmailType,
  data: PaymentApprovedData | PaymentRejectedData | OrderShippedData | OrderDeliveredData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al enviar email');
    }

    return { success: true };
  } catch (error) {
    console.error('[Email Error]', error);
    // No fallar si el email no se envía, solo loguear
    return { success: true, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Helper para obtener nombre del transportista para mostrar
export function getCarrierDisplayName(carrier: string): string {
  const carriers: Record<string, string> = {
    'andreani': 'Andreani',
    'oca': 'OCA',
    'correo_argentino': 'Correo Argentino',
    'otro': 'Servicio de envío',
  };
  return carriers[carrier] || carrier;
}
