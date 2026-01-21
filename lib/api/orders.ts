import { createBrowserClient } from '@supabase/ssr'
import type { 
  Pedido, 
  PedidoConItems, 
  VerificacionPago,
  InfoEnvio,
  EstadoPedido,
  Transportista
} from '@/lib/types/database.types'

// Cliente sin tipado estricto hasta que el schema exista
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any
}

// Tipos para crear orden
interface CreateOrderData {
  user_id?: string
  direccion_envio: {
    nombre_destinatario: string
    calle: string
    numero: string
    piso_depto?: string
    ciudad: string
    provincia: string
    codigo_postal: string
    telefono?: string
  }
  items: {
    producto_id: string | null
    talle: string
    cantidad: number
    producto_precio: number
    producto_nombre: string
    producto_imagen: string | null
    producto_slug: string
  }[]
  subtotal: number
  costo_envio: number
  total: number
  notas_cliente?: string
  zona_envio_id?: string
}

// =============================================
// Funciones para usuarios
// =============================================

export async function createOrder(orderData: CreateOrderData): Promise<Pedido | null> {
  const supabase = getSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('perfiles')
    .select('email, nombre, apellido, telefono')
    .eq('id', user.id)
    .single()

  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('pedidos')
    .insert({
      usuario_id: user.id,
      cliente_email: profile?.email || user.email || '',
      cliente_nombre: profile ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() : '',
      cliente_telefono: profile?.telefono || null,
      direccion_envio: orderData.direccion_envio,
      subtotal: orderData.subtotal,
      costo_envio: orderData.costo_envio,
      monto_descuento: 0,
      total: orderData.total,
      notas_cliente: orderData.notas_cliente || null,
      estado: 'pendiente_pago'
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    return null
  }

  // Crear items de la orden
  const orderItems = orderData.items.map(item => ({
    pedido_id: (order as any).id,
    producto_id: item.producto_id,
    producto_nombre: item.producto_nombre,
    producto_slug: item.producto_slug,
    producto_imagen: item.producto_imagen,
    producto_precio: item.producto_precio,
    talle: item.talle,
    cantidad: item.cantidad,
    total_linea: item.producto_precio * item.cantidad
  }))

  const { error: itemsError } = await supabase
    .from('items_pedido')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    // Rollback: eliminar la orden
    await supabase.from('pedidos').delete().eq('id', (order as any).id)
    return null
  }

  return order as Pedido
}

export async function getOrdersByUser(): Promise<PedidoConItems[]> {
  const supabase = getSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: orders, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha_creacion', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  // Obtener items para cada pedido
  const ordersWithItems: PedidoConItems[] = await Promise.all(
    (orders || []).map(async (order: any) => {
      const { data: items } = await supabase
        .from('items_pedido')
        .select('*')
        .eq('pedido_id', order.id)

      return {
        ...order,
        items: items || []
      } as PedidoConItems
    })
  )

  return ordersWithItems
}

export async function getOrderById(orderId: string): Promise<PedidoConItems | null> {
  const supabase = getSupabase()
  
  const { data: order, error: orderError } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError) {
    console.error('Error fetching order:', orderError)
    return null
  }

  const { data: items, error: itemsError } = await supabase
    .from('items_pedido')
    .select('*')
    .eq('pedido_id', orderId)

  if (itemsError) {
    console.error('Error fetching order items:', itemsError)
    return null
  }

  // Cargar verificación de pago si existe
  const { data: verificacion } = await supabase
    .from('verificaciones_pago')
    .select('*')
    .eq('pedido_id', orderId)
    .order('enviado_el', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Cargar información de envío si existe
  const { data: envio } = await supabase
    .from('info_envio')
    .select('*')
    .eq('pedido_id', orderId)
    .maybeSingle()

  return {
    ...order,
    items: items || [],
    verificacion: verificacion || null,
    envio: envio || null
  } as PedidoConItems
}

export async function getOrderByNumber(orderNumber: string): Promise<PedidoConItems | null> {
  const supabase = getSupabase()
  
  const { data: order, error: orderError } = await supabase
    .from('pedidos')
    .select('*')
    .eq('numero_pedido', orderNumber)
    .single()

  if (orderError) {
    console.error('Error fetching order:', orderError)
    return null
  }

  const { data: items } = await supabase
    .from('items_pedido')
    .select('*')
    .eq('pedido_id', order.id)

  return {
    ...order,
    items: items || []
  } as PedidoConItems
}

export async function submitPaymentVerification(
  orderId: string,
  verificationData: {
    comprobante_url: string
    comprobante_nombre?: string
    referencia_transferencia?: string
    fecha_transferencia?: string
    monto_transferido?: number
    notas_cliente?: string
  }
): Promise<VerificacionPago> {
  const supabase = getSupabase()
  
  const { data: verification, error: verificationError } = await supabase
    .from('verificaciones_pago')
    .insert({
      pedido_id: orderId,
      ...verificationData,
      estado: 'pendiente'
    })
    .select()
    .single()

  if (verificationError) {
    console.error('Error submitting verification:', verificationError)
    throw new Error(`Error al enviar comprobante: ${verificationError.message}`)
  }

  // Intentar actualizar estado del pedido (puede fallar por RLS, el trigger lo hará)
  // Si hay un trigger configurado, esto es redundante pero no daña
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({ estado: 'esperando_verificacion' })
    .eq('id', orderId)
    .eq('estado', 'pendiente_pago') // Solo si está en pendiente_pago

  if (updateError) {
    // No es crítico - el trigger debería manejarlo o ya está en otro estado
    console.log('Nota: No se pudo actualizar estado directamente (puede ser normal si hay trigger)')
  }

  return verification as VerificacionPago
}

export async function cancelOrder(orderId: string, reason?: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('pedidos')
    .update({
      estado: 'cancelado',
      cancelado_el: new Date().toISOString(),
      motivo_cancelacion: reason || null
    })
    .eq('id', orderId)

  if (error) {
    console.error('Error cancelling order:', error)
    return false
  }

  return true
}

export async function getPaymentVerifications(orderId: string): Promise<VerificacionPago[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('verificaciones_pago')
    .select('*')
    .eq('pedido_id', orderId)
    .order('enviado_el', { ascending: false })

  if (error) {
    console.error('Error fetching verifications:', error)
    return []
  }

  return data as VerificacionPago[]
}

export async function getShippingInfo(orderId: string): Promise<InfoEnvio | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('info_envio')
    .select('*')
    .eq('pedido_id', orderId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching shipping info:', error)
    return null
  }

  return data as InfoEnvio | null
}

// =============================================
// Funciones para admin
// =============================================

export async function getAllOrders(filters?: {
  status?: EstadoPedido
  limit?: number
  offset?: number
}): Promise<Pedido[]> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('pedidos')
    .select('*')
    .order('fecha_creacion', { ascending: false })

  if (filters?.status) {
    query = query.eq('estado', filters.status)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all orders:', error)
    return []
  }

  return data as Pedido[]
}

export async function getPendingVerifications(): Promise<VerificacionPago[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('verificaciones_pago')
    .select('*, pedidos(numero_pedido, total, cliente_nombre, cliente_email)')
    .eq('estado', 'pendiente')
    .order('enviado_el', { ascending: true })

  if (error) {
    console.error('Error fetching pending verifications:', error)
    return []
  }

  return data as VerificacionPago[]
}

export async function approvePayment(
  verificationId: string,
  adminNotes?: string
): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  // Obtener la verificación para conseguir el pedido_id
  const { data: verification, error: verificationFetchError } = await supabase
    .from('verificaciones_pago')
    .select('pedido_id')
    .eq('id', verificationId)
    .single()

  if (verificationFetchError) {
    console.error('Error fetching verification:', verificationFetchError)
    throw new Error(`Error al obtener verificación: ${verificationFetchError.message}`)
  }

  if (!verification) {
    throw new Error('Verificación no encontrada')
  }

  // Actualizar verificación
  const { error: verificationError } = await supabase
    .from('verificaciones_pago')
    .update({
      estado: 'aprobado',
      revisado_por: user.id,
      revisado_el: new Date().toISOString(),
      notas_admin: adminNotes || null
    })
    .eq('id', verificationId)

  if (verificationError) {
    console.error('Error approving payment verification:', verificationError)
    throw new Error(`Error al aprobar verificación: ${verificationError.message}`)
  }

  // Actualizar estado del pedido
  const { error: orderError } = await supabase
    .from('pedidos')
    .update({
      estado: 'pago_aprobado',
      pagado_el: new Date().toISOString()
    })
    .eq('id', verification.pedido_id)

  if (orderError) {
    console.error('Error updating order status:', orderError)
    throw new Error(`Error al actualizar estado del pedido: ${orderError.message}`)
  }

  return true
}

export async function rejectPayment(
  verificationId: string,
  reason: string,
  adminNotes?: string
): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  const { data: verification, error: verificationFetchError } = await supabase
    .from('verificaciones_pago')
    .select('pedido_id')
    .eq('id', verificationId)
    .single()

  if (verificationFetchError) {
    console.error('Error fetching verification:', verificationFetchError)
    throw new Error(`Error al obtener verificación: ${verificationFetchError.message}`)
  }

  if (!verification) {
    throw new Error('Verificación no encontrada')
  }

  // Actualizar verificación
  const { error: verificationError } = await supabase
    .from('verificaciones_pago')
    .update({
      estado: 'rechazado',
      revisado_por: user.id,
      revisado_el: new Date().toISOString(),
      motivo_rechazo: reason,
      notas_admin: adminNotes || null
    })
    .eq('id', verificationId)

  if (verificationError) {
    console.error('Error rejecting payment verification:', verificationError)
    throw new Error(`Error al rechazar verificación: ${verificationError.message}`)
  }

  // Actualizar estado del pedido
  const { error: orderError } = await supabase
    .from('pedidos')
    .update({ estado: 'pago_rechazado' })
    .eq('id', verification.pedido_id)

  if (orderError) {
    console.error('Error updating order status on rejection:', orderError)
    throw new Error(`Error al actualizar estado del pedido: ${orderError.message}`)
  }

  return true
}

export async function updateOrderStatus(
  orderId: string,
  status: EstadoPedido,
  notes?: string
): Promise<boolean> {
  const supabase = getSupabase()
  
  const updateData: any = { estado: status }

  if (status === 'enviado') {
    updateData.enviado_el = new Date().toISOString()
  } else if (status === 'entregado') {
    updateData.entregado_el = new Date().toISOString()
  } else if (status === 'cancelado') {
    updateData.cancelado_el = new Date().toISOString()
    if (notes) updateData.motivo_cancelacion = notes
  }

  if (notes && status !== 'cancelado') {
    updateData.notas_admin = notes
  }

  const { error } = await supabase
    .from('pedidos')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    console.error('Error updating order status:', error)
    return false
  }

  return true
}

// Helper function to generate tracking URL based on carrier
function generateTrackingUrl(carrier: string, trackingNumber: string): string | undefined {
  const carrierLower = carrier.toLowerCase();
  
  // Andreani
  if (carrierLower.includes('andreani')) {
    return `https://www.andreani.com/#!/personas/tracking?numero=${trackingNumber}`;
  }
  
  // OCA
  if (carrierLower.includes('oca')) {
    return `https://www1.oca.com.ar/OCA_Track.asp?gui=${trackingNumber}`;
  }
  
  // Correo Argentino
  if (carrierLower.includes('correo')) {
    return `https://www.correoargentino.com.ar/formularios/e-commerce?codigo=${trackingNumber}`;
  }
  
  // Via Cargo
  if (carrierLower.includes('via') || carrierLower.includes('cargo')) {
    return `https://www.viacargo.com.ar/Tracking?NroGuia=${trackingNumber}`;
  }
  
  return undefined;
}

export async function addShippingInfo(
  orderId: string,
  shippingData: {
    numero_seguimiento?: string
    transportista?: Transportista
    nombre_transportista?: string
    url_seguimiento?: string
    entrega_estimada_min?: string
    entrega_estimada_max?: string
    notas?: string
  }
): Promise<InfoEnvio | null> {
  const supabase = getSupabase()
  
  // Auto-generate tracking URL if not provided
  let finalUrl = shippingData.url_seguimiento;
  if (!finalUrl && shippingData.numero_seguimiento && shippingData.transportista) {
    finalUrl = generateTrackingUrl(shippingData.transportista, shippingData.numero_seguimiento);
  }
  
  const dataToSave = {
    numero_seguimiento: shippingData.numero_seguimiento || null,
    transportista: shippingData.transportista || 'correo_argentino',
    nombre_transportista: shippingData.nombre_transportista || null,
    url_seguimiento: finalUrl || null,
    entrega_estimada_min: shippingData.entrega_estimada_min || null,
    entrega_estimada_max: shippingData.entrega_estimada_max || null,
    notas: shippingData.notas || null,
  };
  
  console.log('addShippingInfo - orderId:', orderId);
  console.log('addShippingInfo - dataToSave:', dataToSave);
  
  // Verificar si ya existe info de envío
  const { data: existing, error: checkError } = await supabase
    .from('info_envio')
    .select('id')
    .eq('pedido_id', orderId)
    .maybeSingle()
  
  console.log('addShippingInfo - existing check:', { existing, checkError });

  if (existing) {
    // Actualizar existente
    const { data, error } = await supabase
      .from('info_envio')
      .update({
        ...dataToSave,
        enviado_el: new Date().toISOString()
      })
      .eq('pedido_id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating shipping info:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error(`Error al actualizar información de envío: ${error.message || error.code || 'Error desconocido'}`)
    }

    return data as InfoEnvio
  } else {
    // Crear nuevo - Primero actualizar el estado del pedido
    console.log('addShippingInfo - Updating order status first...');
    const { error: orderError } = await supabase
      .from('pedidos')
      .update({ 
        estado: 'enviado',
        enviado_el: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (orderError) {
      console.error('Error updating order status:', orderError)
      console.error('Order error details:', JSON.stringify(orderError, null, 2))
      throw new Error(`Error al actualizar estado del pedido: ${orderError.message || orderError.code || 'Error desconocido'}`)
    }
    
    console.log('addShippingInfo - Order status updated, now creating shipping info...');
    
    // Crear info de envío
    const insertData = {
      pedido_id: orderId,
      ...dataToSave,
      enviado_el: new Date().toISOString()
    };
    
    console.log('addShippingInfo - Insert data:', insertData);
    
    const { data, error } = await supabase
      .from('info_envio')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping info:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      console.error('Full error:', JSON.stringify(error, null, 2))
      throw new Error(`Error al crear información de envío: ${error.message || error.code || 'Permiso denegado por políticas de seguridad'}`)
    }

    console.log('addShippingInfo - Success! Data:', data);
    return data as InfoEnvio
  }
}

export async function updateShippingInfo(
  orderId: string,
  updates: Partial<InfoEnvio>
): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('info_envio')
    .update(updates)
    .eq('pedido_id', orderId)

  if (error) {
    console.error('Error updating shipping info:', error)
    return false
  }

  return true
}

// Aliases para compatibilidad
export type { 
  Pedido as Order, 
  PedidoConItems as OrderWithItems, 
  VerificacionPago as PaymentVerification,
  InfoEnvio as ShippingInfo,
  EstadoPedido as OrderStatus,
  Transportista as ShippingCarrier
}
