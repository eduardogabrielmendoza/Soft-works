'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Package, Truck, CheckCircle, XCircle, Clock, Upload, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrderById, submitPaymentVerification } from '@/lib/api/orders';
import { getActiveBankAccounts } from '@/lib/api/settings';
import { uploadReceipt } from '@/lib/api/storage';
import { formatPrice, formatDate, formatDateTime, getOrderStatusLabel, getOrderStatusColor, copyToClipboard } from '@/lib/utils/helpers';
import type { OrderWithItems, BankAccount } from '@/lib/types/database.types';

export default function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Upload state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    transfer_reference: '',
    transfer_date: '',
    transfer_amount: '',
    customer_notes: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadOrder();
      loadBankAccounts();
    }
  }, [user, id]);

  const loadOrder = async () => {
    setIsLoading(true);
    const data = await getOrderById(id);
    setOrder(data);
    setIsLoading(false);
  };

  const loadBankAccounts = async () => {
    const accounts = await getActiveBankAccounts();
    setBankAccounts(accounts);
  };

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setUploadError('Solo se permiten imágenes o PDFs');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('El archivo no puede superar 5MB');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !order) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload file to storage
      console.log('Subiendo archivo al storage...');
      const { url, filename } = await uploadReceipt(selectedFile, order.id);
      console.log('Archivo subido:', url);

      // Create verification record
      console.log('Creando registro de verificación...');
      await submitPaymentVerification(order.id, {
        comprobante_url: url,
        comprobante_nombre: filename,
        referencia_transferencia: uploadData.transfer_reference || undefined,
        fecha_transferencia: uploadData.transfer_date || undefined,
        monto_transferido: uploadData.transfer_amount ? parseFloat(uploadData.transfer_amount) : undefined,
        notas_cliente: uploadData.customer_notes || undefined,
      });
      console.log('Verificación enviada correctamente');

      // Reload order to get updated status
      await loadOrder();
      setShowUploadForm(false);
      // Reset form
      setSelectedFile(null);
      setUploadData({
        transfer_reference: '',
        transfer_date: '',
        transfer_amount: '',
        customer_notes: '',
      });
    } catch (error: any) {
      console.error('Error uploading receipt:', error);
      setUploadError(error.message || 'Error al subir el comprobante. Por favor intentá de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente_pago':
        return <Clock className="w-5 h-5" />;
      case 'esperando_verificacion':
        return <Clock className="w-5 h-5" />;
      case 'pago_aprobado':
        return <CheckCircle className="w-5 h-5" />;
      case 'pago_rechazado':
        return <XCircle className="w-5 h-5" />;
      case 'enviado':
        return <Truck className="w-5 h-5" />;
      case 'entregado':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
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
        <Link href="/cuenta/pedidos" className="text-foreground underline mt-4 inline-block">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back link */}
        <Link
          href="/cuenta/pedidos"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a mis pedidos
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-medium">{order.numero_pedido}</h1>
            <p className="text-gray-500">{formatDateTime(order.fecha_creacion)}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getOrderStatusColor(order.estado)}`}>
            {getStatusIcon(order.estado)}
            {getOrderStatusLabel(order.estado)}
          </span>
        </div>

        {/* Action Required for Pending Payment */}
        {order.estado === 'pendiente_pago' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-yellow-800 mb-4">
              ⚠️ Acción Requerida: Realizar Transferencia
            </h2>
            <p className="text-yellow-700 mb-4">
              Para completar tu pedido, realizá una transferencia bancaria con los siguientes datos:
            </p>

            {bankAccounts.map((account) => (
              <div key={account.id} className="bg-white rounded-lg p-4 mb-4">
                <p className="font-medium mb-2">{account.banco}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Titular:</span>
                    <span className="font-medium">{account.titular}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">CBU:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{account.cbu}</span>
                      <button
                        onClick={() => handleCopy(account.cbu, 'cbu')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copiedField === 'cbu' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {account.alias && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Alias:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.alias}</span>
                        <button
                          onClick={() => handleCopy(account.alias!, 'alias')}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {copiedField === 'alias' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Monto a transferir:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{formatPrice(order.total)}</span>
                  <button
                    onClick={() => handleCopy(order.total.toString(), 'total')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {copiedField === 'total' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowUploadForm(true)}
              className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Ya transferí, subir comprobante
            </button>
          </div>
        )}

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-medium mb-4">Subir Comprobante de Pago</h3>
              
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante (imagen o PDF) *
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-1">✓ {selectedFile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de operación/referencia
                  </label>
                  <input
                    type="text"
                    value={uploadData.transfer_reference}
                    onChange={(e) => setUploadData({ ...uploadData, transfer_reference: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Ej: 123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de transferencia
                    </label>
                    <input
                      type="date"
                      value={uploadData.transfer_date}
                      onChange={(e) => setUploadData({ ...uploadData, transfer_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto transferido
                    </label>
                    <input
                      type="number"
                      value={uploadData.transfer_amount}
                      onChange={(e) => setUploadData({ ...uploadData, transfer_amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder={order.total.toString()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={uploadData.customer_notes}
                    onChange={(e) => setUploadData({ ...uploadData, customer_notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                    placeholder="Información adicional..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      'Enviar Comprobante'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Awaiting Verification */}
        {order.estado === 'esperando_verificacion' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-blue-800 mb-2">
              ⏳ Comprobante en Revisión
            </h2>
            <p className="text-blue-700">
              Tu comprobante ha sido recibido y está siendo verificado. Te notificaremos cuando el pago sea aprobado.
            </p>
          </div>
        )}

        {/* Payment Rejected */}
        {order.estado === 'pago_rechazado' && order.verificacion && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-red-800 mb-2">
              ❌ Pago Rechazado
            </h2>
            <p className="text-red-700 mb-4">
              {order.verificacion.motivo_rechazo || 'El pago no pudo ser verificado.'}
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Subir Nuevo Comprobante
            </button>
          </div>
        )}

        {/* Shipping Info */}
        {order.envio && (order.estado === 'enviado' || order.estado === 'entregado') && (
          <div className={`rounded-lg p-6 mb-8 border ${
            order.estado === 'entregado' 
              ? 'bg-gray-100 border-gray-300' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
              order.estado === 'entregado' ? 'text-gray-600' : 'text-purple-800'
            }`}>
              {order.estado === 'entregado' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
              {order.estado === 'entregado' ? 'Pedido Entregado' : 'Tu Pedido Está en Camino'}
            </h2>
            
            {order.estado === 'entregado' ? (
              // Diseño para pedido entregado - todo en gris
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 font-medium">
                    Tu pedido fue entregado exitosamente
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Gracias por tu compra en Softworks
                  </p>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Transportista:</span>
                    <span className="text-gray-500">{order.envio.nombre_transportista || order.envio.transportista}</span>
                  </div>
                  {order.envio.numero_seguimiento && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">N° Seguimiento:</span>
                      <span className="font-mono text-gray-500">{order.envio.numero_seguimiento}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Diseño para pedido en camino
              <>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Transportista</p>
                      <p className="font-medium text-gray-900">
                        {order.envio.nombre_transportista || order.envio.transportista}
                      </p>
                    </div>
                    
                    {order.envio.numero_seguimiento && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Número de Seguimiento</p>
                        <p className="font-mono text-gray-900">{order.envio.numero_seguimiento}</p>
                      </div>
                    )}
                    
                    {order.envio.entrega_estimada_min && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Entrega Estimada</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(order.envio.entrega_estimada_min)}
                          {order.envio.entrega_estimada_max && ` - ${formatDate(order.envio.entrega_estimada_max)}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {order.envio.url_seguimiento && order.envio.numero_seguimiento && (
                  <a
                    href={order.envio.url_seguimiento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Truck className="w-5 h-5" />
                    Rastrear mi Pedido
                  </a>
                )}
              </>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Productos</h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {item.producto_imagen ? (
                    <img
                      src={item.producto_imagen}
                      alt={item.producto_nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/producto/${item.producto_slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.producto_nombre}
                  </Link>
                  <p className="text-sm text-gray-500">Talla: {item.talle}</p>
                  <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.total_linea)}</p>
                  <p className="text-sm text-gray-500">{formatPrice(item.producto_precio)} c/u</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Resumen</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Envío</span>
              <span>{order.costo_envio > 0 ? formatPrice(order.costo_envio) : 'Gratis'}</span>
            </div>
            {order.monto_descuento > 0 && (
              <div className="flex justify-between text-sm text-green-600">
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

        {/* Shipping Address */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium mb-4">Dirección de Envío</h2>
          <div className="text-gray-600">
            <p className="font-medium text-foreground">{order.direccion_envio.nombre_destinatario}</p>
            <p>
              {order.direccion_envio.calle} {order.direccion_envio.numero}
              {order.direccion_envio.piso_depto && `, ${order.direccion_envio.piso_depto}`}
            </p>
            <p>
              {order.direccion_envio.ciudad}, {order.direccion_envio.provincia} - CP {order.direccion_envio.codigo_postal}
            </p>
            {order.direccion_envio.telefono && <p>Tel: {order.direccion_envio.telefono}</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
