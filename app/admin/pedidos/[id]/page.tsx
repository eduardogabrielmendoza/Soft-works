'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  ChevronLeft, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  MessageSquare,
  FileImage,
  ExternalLink,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrderById, updateOrderStatus, approvePayment, rejectPayment, addShippingInfo } from '@/lib/api/orders';
import { formatPrice, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils/helpers';
import { sendOrderEmail, getCarrierDisplayName } from '@/lib/utils/emailClient';
import type { OrderWithItems } from '@/lib/types/database.types';

// Mapeo de transportistas: valor para DB -> nombre para mostrar
// Nota: El enum en BD tiene: 'correo_argentino', 'andreani', 'oca', 'otro'
const CARRIERS = [
  { value: 'andreani', label: 'Andreani' },
  { value: 'oca', label: 'OCA' },
  { value: 'correo_argentino', label: 'Correo Argentino' },
  { value: 'otro', label: 'Otro (especificar)' },
];

export default function AdminPedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Shipping form
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingData, setShippingData] = useState({
    transportista: '',
    tracking_number: '',
    tracking_url: '',
    estimated_days_min: '',
    estimated_days_max: '',
  });

  // Rejection form
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/cuenta');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        loadOrder();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAdmin, authLoading, id]);

  const loadOrder = async () => {
    setIsLoading(true);
    const data = await getOrderById(id);
    setOrder(data);
    setIsLoading(false);
  };

  const handleApprovePayment = async () => {
    if (!order?.verificacion?.id) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await approvePayment(order.verificacion.id);
      
      // Enviar email de pago aprobado
      if (order.cliente_email) {
        await sendOrderEmail('payment_approved', {
          email: order.cliente_email,
          customerName: order.cliente_nombre || 'Cliente',
          orderNumber: order.numero_pedido,
          orderId: order.id,
          total: order.total,
          items: order.items.map(item => ({
            producto_nombre: item.producto_nombre,
            producto_imagen: item.producto_imagen,
            talle: item.talle,
            cantidad: item.cantidad,
            producto_precio: item.producto_precio,
          })),
        });
      }
      
      setSuccess('Pago aprobado correctamente. Se envió notificación al cliente.');
      await loadOrder();
    } catch (err: any) {
      console.error('Error approving payment:', err);
      setError(err.message || 'Error al aprobar el pago');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!order?.verificacion?.id || !rejectionReason) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await rejectPayment(order.verificacion.id, rejectionReason);
      
      // Enviar email de pago rechazado
      if (order.cliente_email) {
        await sendOrderEmail('payment_rejected', {
          email: order.cliente_email,
          customerName: order.cliente_nombre || 'Cliente',
          orderNumber: order.numero_pedido,
          orderId: order.id,
          reason: rejectionReason,
          items: order.items.map(item => ({
            producto_nombre: item.producto_nombre,
            producto_imagen: item.producto_imagen,
            talle: item.talle,
            cantidad: item.cantidad,
            producto_precio: item.producto_precio,
          })),
        });
      }
      
      setSuccess('Pago rechazado. Se envió notificación al cliente.');
      setShowRejectForm(false);
      setRejectionReason('');
      await loadOrder();
    } catch (err: any) {
      console.error('Error rejecting payment:', err);
      setError(err.message || 'Error al rechazar el pago');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsShipped = async () => {
    if (!shippingData.transportista || !shippingData.tracking_number) {
      setError('Completá los datos del envío');
      return;
    }
    setIsUpdating(true);
    setError(null);

    try {
      const shippingResult = await addShippingInfo(order!.id, {
        transportista: shippingData.transportista as any,
        numero_seguimiento: shippingData.tracking_number,
        url_seguimiento: shippingData.tracking_url || undefined,
        entrega_estimada_min: shippingData.estimated_days_min 
          ? new Date(Date.now() + parseInt(shippingData.estimated_days_min) * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        entrega_estimada_max: shippingData.estimated_days_max
          ? new Date(Date.now() + parseInt(shippingData.estimated_days_max) * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      });
      
      // Enviar email de pedido enviado
      if (order!.cliente_email) {
        await sendOrderEmail('order_shipped', {
          items: order!.items.map(item => ({
            producto_nombre: item.producto_nombre,
            producto_imagen: item.producto_imagen,
            talle: item.talle,
            cantidad: item.cantidad,
            producto_precio: item.producto_precio,
          })),
          email: order!.cliente_email,
          customerName: order!.cliente_nombre || 'Cliente',
          orderNumber: order!.numero_pedido,
          orderId: order!.id,
          trackingNumber: shippingData.tracking_number,
          trackingUrl: shippingResult?.url_seguimiento || shippingData.tracking_url,
          carrier: getCarrierDisplayName(shippingData.transportista),
        });
      }
      
      setSuccess('Pedido marcado como enviado. Se envió notificación al cliente.');
      setShowShippingForm(false);
      setShippingData({
        transportista: '',
        tracking_number: '',
        tracking_url: '',
        estimated_days_min: '',
        estimated_days_max: '',
      });
      await loadOrder();
    } catch (err: any) {
      console.error('Error marking as shipped:', err);
      setError(err.message || 'Error al marcar como enviado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateOrderStatus(order!.id, 'entregado');
      
      //  items: order!.items.map(item => ({
            producto_nombre: item.producto_nombre,
            producto_imagen: item.producto_imagen,
            talle: item.talle,
            cantidad: item.cantidad,
            producto_precio: item.producto_precio,
          })),
         Enviar email de pedido entregado
      if (order!.cliente_email) {
        await sendOrderEmail('order_delivered', {
          email: order!.cliente_email,
          customerName: order!.cliente_nombre || 'Cliente',
          orderNumber: order!.numero_pedido,
          orderId: order!.id,
        });
      }
      
      setSuccess('Pedido marcado como entregado. Se envió notificación al cliente.');
      await loadOrder();
    } catch (err) {
      setError('Error al actualizar estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pendiente_pago: Clock,
      esperando_verificacion: AlertCircle,
      pago_aprobado: CheckCircle,
      pago_rechazado: XCircle,
      enviado: Truck,
      entregado: CheckCircle,
    };
    const Icon = icons[status] || Package;
    return <Icon className="w-5 h-5" />;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-20 px-4 py-12 max-w-4xl mx-auto text-center">
        <p className="text-gray-500">Pedido no encontrado</p>
        <Link href="/admin/pedidos" className="text-foreground underline mt-4 inline-block">
          Volver a pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back link */}
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a pedidos
          </Link>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
              {success}
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium">{order.numero_pedido}</h1>
              <p className="text-gray-500">{formatDateTime(order.fecha_creacion)}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 w-fit ${getOrderStatusColor(order.estado)}`}>
              {getStatusIcon(order.estado)}
              {getOrderStatusLabel(order.estado)}
            </span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Verification Section */}
              {order.estado === 'esperando_verificacion' && order.verificacion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-blue-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Verificación de Pago Pendiente
                  </h2>

                  {/* Receipt Image */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Comprobante Subido
                    </p>
                    <a
                      href={order.verificacion.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      Ver comprobante
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {order.verificacion.comprobante_url && (
                      <div className="mt-2 max-w-sm">
                        <img
                          src={order.verificacion.comprobante_url}
                          alt="Comprobante"
                          className="rounded-lg border border-gray-200 max-h-64 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Transfer Details */}
                  <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                    {order.verificacion.referencia_transferencia && (
                      <p>
                        <span className="text-gray-600">Referencia:</span>{' '}
                        <span className="font-medium">{order.verificacion.referencia_transferencia}</span>
                      </p>
                    )}
                    {order.verificacion.fecha_transferencia && (
                      <p>
                        <span className="text-gray-600">Fecha transferencia:</span>{' '}
                        <span className="font-medium">{order.verificacion.fecha_transferencia}</span>
                      </p>
                    )}
                    {order.verificacion.monto_transferido && (
                      <p>
                        <span className="text-gray-600">Monto declarado:</span>{' '}
                        <span className="font-medium">{formatPrice(order.verificacion.monto_transferido)}</span>
                        {order.verificacion.monto_transferido !== order.total && (
                          <span className="text-red-600 ml-2">
                            (Esperado: {formatPrice(order.total)})
                          </span>
                        )}
                      </p>
                    )}
                    {order.verificacion.notas_cliente && (
                      <p>
                        <span className="text-gray-600">Notas del cliente:</span>{' '}
                        <span className="font-medium">{order.verificacion.notas_cliente}</span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprovePayment}
                      disabled={isUpdating}
                      className="flex-1 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Aprobar Pago
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={isUpdating}
                      className="flex-1 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Rechazar
                    </button>
                  </div>

                  {/* Reject Form */}
                  {showRejectForm && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                      <p className="text-sm font-medium mb-2">Motivo del rechazo:</p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none mb-3"
                        placeholder="Ej: El monto no coincide, comprobante ilegible..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRejectForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleRejectPayment}
                          disabled={!rejectionReason || isUpdating}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirmar Rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mark as Shipped Section */}
              {order.estado === 'pago_aprobado' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-green-800 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Listo para Enviar
                  </h2>
                  
                  {!showShippingForm ? (
                    <button
                      onClick={() => setShowShippingForm(true)}
                      className="py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      Marcar como Enviado
                    </button>
                  ) : (
                    <div className="bg-white rounded-lg p-4 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transportista *
                          </label>
                          <select
                            value={shippingData.transportista}
                            onChange={(e) => setShippingData({ ...shippingData, transportista: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            <option value="">Seleccionar...</option>
                            {CARRIERS.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Seguimiento *
                          </label>
                          <input
                            type="text"
                            value={shippingData.tracking_number}
                            onChange={(e) => setShippingData({ ...shippingData, tracking_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                            placeholder="ABC123456789"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL de Seguimiento (opcional)
                        </label>
                        <input
                          type="url"
                          value={shippingData.tracking_url}
                          onChange={(e) => setShippingData({ ...shippingData, tracking_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Días estimados (mín)
                          </label>
                          <input
                            type="number"
                            value={shippingData.estimated_days_min}
                            onChange={(e) => setShippingData({ ...shippingData, estimated_days_min: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                            placeholder="3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Días estimados (máx)
                          </label>
                          <input
                            type="number"
                            value={shippingData.estimated_days_max}
                            onChange={(e) => setShippingData({ ...shippingData, estimated_days_max: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                            placeholder="5"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowShippingForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleMarkAsShipped}
                          disabled={isUpdating}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Confirmar Envío
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mark as Delivered */}
              {order.estado === 'enviado' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-purple-800 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Pedido en Tránsito
                  </h2>
                  {order.envio && (
                    <div className="text-sm text-purple-700 mb-4">
                      <p>Transportista: {order.envio.nombre_transportista || order.envio.transportista}</p>
                      <p>Seguimiento: {order.envio.numero_seguimiento}</p>
                    </div>
                  )}
                  <button
                    onClick={handleMarkAsDelivered}
                    disabled={isUpdating}
                    className="py-3 px-6 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Marcar como Entregado
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos ({order.items.length})
                </h2>
                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-4 flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.producto_imagen ? (
                          <img
                            src={item.producto_imagen}
                            alt={item.producto_nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.producto_nombre}</p>
                        <p className="text-sm text-gray-500">
                          Talla: {item.talle} | Cantidad: {item.cantidad}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.total_linea)}</p>
                        <p className="text-sm text-gray-500">{formatPrice(item.producto_precio)} c/u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Resumen
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span>{order.costo_envio > 0 ? formatPrice(order.costo_envio) : 'Gratis'}</span>
                  </div>
                  {order.monto_descuento > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento</span>
                      <span>-{formatPrice(order.monto_descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-medium pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cliente
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.cliente_nombre}</p>
                  <p className="text-gray-600">{order.cliente_email}</p>
                  {order.cliente_telefono && <p className="text-gray-600">{order.cliente_telefono}</p>}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección de Envío
                </h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-foreground">{order.direccion_envio.nombre_destinatario}</p>
                  <p>
                    {order.direccion_envio.calle} {order.direccion_envio.numero}
                    {order.direccion_envio.piso_depto && `, ${order.direccion_envio.piso_depto}`}
                  </p>
                  <p>
                    {order.direccion_envio.ciudad}, {order.direccion_envio.provincia}
                  </p>
                  <p>CP {order.direccion_envio.codigo_postal}</p>
                  {order.direccion_envio.telefono && <p>Tel: {order.direccion_envio.telefono}</p>}
                </div>
              </div>

              {/* Customer Notes */}
              {order.notas_cliente && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Notas del Cliente
                  </h3>
                  <p className="text-sm text-gray-600">{order.notas_cliente}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
