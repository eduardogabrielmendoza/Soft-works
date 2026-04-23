import { getSupabaseClient } from '@/lib/supabase/client'
import type { 
  Pedido, 
  PedidoConItems, 
  VerificacionPago,
  InfoEnvio,
  EstadoPedido,
  Transportista,
  MetodoPago,
  DireccionEnvioSnapshot
} from '@/lib/types/database.types'

// Tipos para crear orden
interface CreateOrderData {
  user_id?: string
  direccion_envio: DireccionEnvioSnapshot
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
  metodo_pago?: MetodoPago
}

// =============================================
// Funciones para usuarios
// =============================================

export async function createOrder(orderData: CreateOrderData): Promise<Pedido | null> {
  const supabase = getSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('perfiles')
    .select('email, nombre, apellido, telefono')
    .eq('id', user.id)
    .single()

  // Generate order number atomically via DB function (C6 fix)
  const { data: numeroPedido, error: rpcError } = await supabase.rpc('generar_numero_pedido')
  if (rpcError || !numeroPedido) {
    console.error('Error generating order number:', rpcError)
    return null
  }

  // Crear orden
  const orderPayload = {
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
    estado: 'pendiente_pago' as const,
    numero_pedido: numeroPedido as string,
    metodo_pago: orderData.metodo_pago || 'transferencia' as MetodoPago
  }
  
  const { data: order, error: orderError } = await supabase
    .from('pedidos')
    .insert(orderPayload)
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    return null
  }

  if (!order) return null

  // Crear items de la orden
  const orderItems = orderData.items.map(item => ({
    pedido_id: order.id,
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
    await supabase.from('pedidos').delete().eq('id', order.id)
    return null
  }

  return order
}

export async function getOrdersByUser(): Promise<PedidoConItems[]> {
  const supabase = getSupabaseClient()
  
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
    (orders ?? []).map(async (order) => {
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
  const supabase = getSupabaseClient()
  
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
  const supabase = getSupabaseClient()
  
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
  const supabase = getSupabaseClient()
  
  const { data: verification, error: verificationError } = await supabase
    .from('verificaciones_pago')
    .insert({
      pedido_id: orderId,
      ...verificationData,
      estado: 'pendiente' as const
    })
    .select()
    .single()

  if (verificationError) {
    console.error('Error submitting verification:', verificationError)
    throw new Error(`Error al enviar comprobante: ${verificationError.message}`)
  }

  // Intentar actualizar estado del pedido (puede fallar por RLS, el trigger lo hará)
  // Si hay un trigger configurado, esto es redundante pero no daña
  await supabase
    .from('pedidos')
    .update({ estado: 'esperando_verificacion' as const })
    .eq('id', orderId)
    .eq('estado', 'pendiente_pago')

  return verification as VerificacionPago
}

export async function cancelOrder(orderId: string, reason?: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('pedidos')
    .update({
      estado: 'cancelado' as const,
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
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('verificaciones_pago')
    .select('*')
    .eq('pedido_id', orderId)
    .order('enviado_el', { ascending: false })

  if (error) {
    console.error('Error fetching verifications:', error)
    return []
  }

  return (data ?? []) as VerificacionPago[]
}

export async function getShippingInfo(orderId: string): Promise<InfoEnvio | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('info_envio')
    .select('*')
    .eq('pedido_id', orderId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching shipping info:', error)
    return null
  }

  return (data ?? null) as InfoEnvio | null
}

// =============================================
// Funciones para admin
// =============================================

export async function getAllOrders(filters?: {
  status?: EstadoPedido
  limit?: number
  offset?: number
}): Promise<Pedido[]> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('pedidos')
    .select('*')
    .order('fecha_creacion', { ascending: false })

  if (filters?.status) {
    query = query.eq('estado', filters.status)
  }

  const pageSize = filters?.limit || 20
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + pageSize - 1)
  } else if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all orders:', error)
    return []
  }

  return (data ?? []) as Pedido[]
}

export async function getPendingVerifications(): Promise<VerificacionPago[]> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('verificaciones_pago')
    .select('*, pedidos(numero_pedido, total, cliente_nombre, cliente_email)')
    .eq('estado', 'pendiente')
    .order('enviado_el', { ascending: true })

  if (error) {
    console.error('Error fetching pending verifications:', error)
    return []
  }

  return (data ?? []) as VerificacionPago[]
}

export async function approvePayment(
  verificationId: string,
  adminNotes?: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  
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
      estado: 'aprobado' as const,
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
      estado: 'pago_aprobado' as const,
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
  const supabase = getSupabaseClient()
  
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
      estado: 'rechazado' as const,
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
    .update({ estado: 'pago_rechazado' as const })
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
  const supabase = getSupabaseClient()
  
  const updateData: Record<string, unknown> = { estado: status }

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
  
  // Correo Argentino
  if (carrierLower.includes('correo')) {
    return `https://www.correoargentino.com.ar/formularios/e-commerce?codigo=${trackingNumber}`;
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
  const supabase = getSupabaseClient()
  
  // Auto-generate tracking URL if not provided
  let finalUrl = shippingData.url_seguimiento;
  if (!finalUrl && shippingData.numero_seguimiento && shippingData.transportista) {
    finalUrl = generateTrackingUrl(shippingData.transportista, shippingData.numero_seguimiento);
  }
  // Ensure URL has protocol prefix
  if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = `https://${finalUrl}`;
  }
  
  const dataToSave = {
    numero_seguimiento: shippingData.numero_seguimiento || null,
    transportista: shippingData.transportista || 'correo_argentino' as Transportista,
    nombre_transportista: shippingData.nombre_transportista || null,
    url_seguimiento: finalUrl || null,
    entrega_estimada_min: shippingData.entrega_estimada_min || null,
    entrega_estimada_max: shippingData.entrega_estimada_max || null,
    notas: shippingData.notas || null,
  };
  
  // Verificar si ya existe info de envío
  const { data: existing } = await supabase
    .from('info_envio')
    .select('id')
    .eq('pedido_id', orderId)
    .maybeSingle()

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
      throw new Error(`Error al actualizar información de envío: ${error.message || error.code || 'Error desconocido'}`)
    }

    return data as InfoEnvio
  } else {
    // Crear nuevo - Primero actualizar el estado del pedido
    const { error: orderError } = await supabase
      .from('pedidos')
      .update({ 
        estado: 'enviado' as const,
        enviado_el: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (orderError) {
      console.error('Error updating order status:', orderError)
      throw new Error(`Error al actualizar estado del pedido: ${orderError.message || orderError.code || 'Error desconocido'}`)
    }
    
    // Crear info de envío
    const insertData = {
      pedido_id: orderId,
      ...dataToSave,
      enviado_el: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('info_envio')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping info:', error)
      throw new Error(`Error al crear información de envío: ${error.message || error.code || 'Permiso denegado por políticas de seguridad'}`)
    }

    return data as InfoEnvio
  }
}

export async function updateShippingInfo(
  orderId: string,
  updates: Partial<InfoEnvio>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  
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
