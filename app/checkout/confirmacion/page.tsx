'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Copy, Check, Loader2, ArrowRight, CreditCard, AlertTriangle, Mail, Upload } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrderById } from '@/lib/api/orders';
import { getActiveBankAccounts } from '@/lib/api/settings';
import { formatPrice, copyToClipboard } from '@/lib/utils/helpers';
import type { OrderWithItems, BankAccount } from '@/lib/types/database.types';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const mpStatus = searchParams.get('mp_status');
  const { user, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Guest upload state
  const [showGuestUpload, setShowGuestUpload] = useState(false);
  const [guestFile, setGuestFile] = useState<File | null>(null);
  const [guestUploadData, setGuestUploadData] = useState({
    transfer_reference: '',
    transfer_date: '',
    transfer_amount: '',
    customer_notes: '',
  });
  const [isGuestUploading, setIsGuestUploading] = useState(false);
  const [guestUploadError, setGuestUploadError] = useState<string | null>(null);
  const [guestUploadSuccess, setGuestUploadSuccess] = useState(false);

  const isMercadoPago = !!mpStatus || order?.metodo_pago === 'mercadopago';
  const isApproved = mpStatus === 'approved';
  const isRejected = mpStatus === 'rejected';
  const isPending = mpStatus === 'pending';

  // Load data for authenticated users
  useEffect(() => {
    if (!authLoading && user && orderId) {
      loadAuthData();
    }
  }, [user, authLoading, orderId]);

  // Load data for guest users
  useEffect(() => {
    if (!authLoading && !user && orderId) {
      loadGuestData();
    }
  }, [user, authLoading, orderId]);

  const loadAuthData = async () => {
    setIsLoading(true);
    const [orderData, accounts] = await Promise.all([
      getOrderById(orderId!),
      getActiveBankAccounts(),
    ]);
    setOrder(orderData);
    setBankAccounts(accounts);
    setIsGuest(false);
    setIsLoading(false);
  };

  const loadGuestData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/checkout/guest-order?id=${encodeURIComponent(orderId!)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setBankAccounts(data.bankAccounts || []);
        setIsGuest(true);
      }
    } catch (err) {
      console.error('Error loading guest order:', err);
    }
    setIsLoading(false);
  };

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleGuestFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setGuestUploadError('Solo se permiten imágenes o PDFs');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setGuestUploadError('El archivo no puede superar 5MB');
        return;
      }
      setGuestFile(file);
      setGuestUploadError(null);
    }
  };

  const handleGuestUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFile || !order) return;

    setIsGuestUploading(true);
    setGuestUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', guestFile);
      formData.append('orderId', order.id);
      if (guestUploadData.transfer_reference) formData.append('transfer_reference', guestUploadData.transfer_reference);
      if (guestUploadData.transfer_date) formData.append('transfer_date', guestUploadData.transfer_date);
      if (guestUploadData.transfer_amount) formData.append('transfer_amount', guestUploadData.transfer_amount);
      if (guestUploadData.customer_notes) formData.append('customer_notes', guestUploadData.customer_notes);

      const res = await fetch('/api/checkout/guest-upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al subir el comprobante');
      }

      setGuestUploadSuccess(true);
      setShowGuestUpload(false);
    } catch (error: any) {
      setGuestUploadError(error.message || 'Error al subir el comprobante');
    } finally {
      setIsGuestUploading(false);
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
        <Link href="/" className="text-foreground underline mt-4 inline-block">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const guestEmail = order.cliente_email;

  return (
    <div className="pt-20 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header — different based on payment method & status */}
          {isMercadoPago && isApproved && (
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl lg:text-3xl font-medium mb-2">¡Pago Aprobado!</h1>
              <p className="text-gray-600">
                Tu pago fue procesado exitosamente. Pedido: <span className="font-medium">{order.numero_pedido}</span>
              </p>
            </div>
          )}

          {isMercadoPago && isRejected && (
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <XCircle className="w-10 h-10 text-red-600" />
              </motion.div>
              <h1 className="text-2xl lg:text-3xl font-medium mb-2">Pago Rechazado</h1>
              <p className="text-gray-600">
                No se pudo procesar tu pago. Pedido: <span className="font-medium">{order.numero_pedido}</span>
              </p>
            </div>
          )}

          {isMercadoPago && isPending && (
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Clock className="w-10 h-10 text-yellow-600" />
              </motion.div>
              <h1 className="text-2xl lg:text-3xl font-medium mb-2">Pago Pendiente</h1>
              <p className="text-gray-600">
                Tu pago está siendo procesado. Pedido: <span className="font-medium">{order.numero_pedido}</span>
              </p>
            </div>
          )}

          {!isMercadoPago && (
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h1 className="text-2xl lg:text-3xl font-medium mb-2">¡Pedido Confirmado!</h1>
              <p className="text-gray-600">
                Tu número de pedido es: <span className="font-medium">{order.numero_pedido}</span>
              </p>
            </div>
          )}

          {/* MercadoPago Status Messages */}
          {isMercadoPago && isApproved && !isGuest && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-700" />
                <h2 className="text-lg font-medium text-green-800">Pago Exitoso</h2>
              </div>
              <p className="text-green-700">
                Tu pago con tarjeta fue aprobado correctamente. Vamos a preparar tu pedido para enviarlo lo antes posible.
                Recibirás un email cuando tu pedido sea despachado.
              </p>
            </div>
          )}

          {isMercadoPago && isApproved && isGuest && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-700" />
                <h2 className="text-lg font-medium text-green-800">Pago Exitoso</h2>
              </div>
              <p className="text-green-700 mb-3">
                Tu pago con tarjeta fue aprobado correctamente. Vamos a preparar tu pedido para enviarlo lo antes posible.
              </p>
              <div className="flex items-center gap-2 text-green-700 bg-green-100 rounded-lg p-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">
                  Como no tenés una cuenta en Softworks, recibirás todas las actualizaciones de tu pedido por correo electrónico a <strong>{guestEmail}</strong>.
                  Guardá tu número de pedido: <strong>{order.numero_pedido}</strong>
                </p>
              </div>
            </div>
          )}

          {isMercadoPago && isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-700" />
                <h2 className="text-lg font-medium text-red-800">Pago No Procesado</h2>
              </div>
              <p className="text-red-700 mb-4">
                Tu pago no pudo ser procesado. Esto puede ocurrir por fondos insuficientes, datos incorrectos o un rechazo del emisor de tu tarjeta.
              </p>
              <Link
                href="/checkout"
                className="inline-block px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Intentar de Nuevo
              </Link>
            </div>
          )}

          {isMercadoPago && isPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-yellow-700" />
                <h2 className="text-lg font-medium text-yellow-800">Procesando Pago</h2>
              </div>
              <p className="text-yellow-700">
                Tu pago está siendo procesado por MercadoPago. Este proceso puede demorar unos minutos.
                Recibirás un email cuando se confirme el pago.
              </p>
            </div>
          )}

          {/* Bank Transfer Instructions — only for transfer method */}
          {!isMercadoPago && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-yellow-700" />
                <h2 className="text-lg font-medium text-yellow-800">
                  Realizá la Transferencia Bancaria
                </h2>
              </div>
              <p className="text-yellow-700 mb-4">
                Para completar tu compra, transferí el monto indicado a cualquiera de nuestras cuentas:
              </p>

              {bankAccounts.map((account) => (
                <div key={account.id} className="bg-white rounded-lg p-4 mb-4">
                  <p className="font-medium text-foreground mb-3">{account.banco}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Titular:</span>
                      <span className="font-medium">{account.titular}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">CUIT:</span>
                      <span className="font-medium">{account.cuit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">CBU:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm">{account.cbu}</span>
                        <button
                          onClick={() => handleCopy(account.cbu, `cbu-${account.id}`)}
                          className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                          title="Copiar CBU"
                        >
                          {copiedField === `cbu-${account.id}` ? (
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
                            onClick={() => handleCopy(account.alias!, `alias-${account.id}`)}
                            className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                            title="Copiar Alias"
                          >
                            {copiedField === `alias-${account.id}` ? (
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

              <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monto a transferir:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{formatPrice(order.total)}</span>
                    <button
                      onClick={() => handleCopy(order.total.toString(), 'total')}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copiar monto"
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
            </div>
          )}

          {/* Guest Warning Banner */}
          {isGuest && !isMercadoPago && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-medium text-orange-800">¡Importante! Guardá esta página</h2>
              </div>
              <p className="text-orange-700 mb-3">
                Como no tenés una cuenta en Softworks, <strong>guardá el link de esta página o hacé una captura de pantalla</strong> con los datos bancarios para realizar la transferencia y subir tu comprobante.
              </p>
              <div className="flex items-center gap-2 text-orange-700">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">
                  Una vez que tu pago sea verificado, recibirás un correo electrónico a <strong>{guestEmail}</strong> con los datos de seguimiento de tu pedido.
                </p>
              </div>
            </div>
          )}

          {/* Next Steps — different for each method */}
          {!isMercadoPago && !isGuest && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Próximos Pasos</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Realizá la transferencia</p>
                    <p className="text-sm text-gray-600">
                      Usá los datos bancarios de arriba para transferir el monto exacto.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Subí el comprobante</p>
                    <p className="text-sm text-gray-600">
                      Accedé a tu pedido y subí una foto o captura del comprobante de transferencia.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Esperá la verificación</p>
                    <p className="text-sm text-gray-600">
                      Verificaremos tu pago en un plazo de 24-48 horas hábiles y recibirás un email con la confirmación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guest Next Steps */}
          {!isMercadoPago && isGuest && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Próximos Pasos</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Guardá esta información</p>
                    <p className="text-sm text-gray-600">
                      Hacé una captura de pantalla o anotá los datos bancarios y tu número de pedido: <strong>{order.numero_pedido}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Realizá la transferencia</p>
                    <p className="text-sm text-gray-600">
                      Usá los datos bancarios de arriba para transferir el monto exacto.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Subí el comprobante</p>
                    <p className="text-sm text-gray-600">
                      Una vez realizada la transferencia, subí una foto o captura del comprobante usando el botón de abajo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Esperá la verificación</p>
                    <p className="text-sm text-gray-600">
                      Verificaremos tu pago en un plazo de 24-48 horas hábiles y recibirás un correo electrónico a <strong>{guestEmail}</strong> con la confirmación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMercadoPago && isApproved && !isGuest && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">¿Qué sigue?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Preparamos tu pedido</p>
                    <p className="text-sm text-gray-600">
                      Nuestro equipo comenzará a preparar tu pedido.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Envío</p>
                    <p className="text-sm text-gray-600">
                      Recibirás un email cuando tu pedido sea despachado con el código de seguimiento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMercadoPago && isApproved && isGuest && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">¿Qué sigue?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Guardá tu número de pedido</p>
                    <p className="text-sm text-gray-600">
                      Anotá tu número de pedido <strong>{order.numero_pedido}</strong> para futuras consultas.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Preparamos tu pedido</p>
                    <p className="text-sm text-gray-600">
                      Nuestro equipo comenzará a preparar tu pedido.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Recibirás un correo electrónico</p>
                    <p className="text-sm text-gray-600">
                      Te enviaremos actualizaciones y el código de seguimiento a <strong>{guestEmail}</strong> cuando tu pedido sea despachado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Resumen del Pedido</h2>
            <div className="divide-y divide-gray-100 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.producto_nombre}</p>
                    <p className="text-sm text-gray-500">
                      Talla {item.talle} × {item.cantidad}
                    </p>
                  </div>
                  <span>{formatPrice(item.total_linea)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span>{order.costo_envio > 0 ? formatPrice(order.costo_envio) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Método de pago</span>
                <span>{order.metodo_pago === 'mercadopago' || isMercadoPago ? 'MercadoPago' : 'Transferencia'}</span>
              </div>
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Dirección de Envío</h2>
            <div className="text-gray-600">
              <p className="font-medium text-foreground">{order.direccion_envio.nombre_destinatario}</p>
              <p>
                {order.direccion_envio.calle} {order.direccion_envio.numero}
                {order.direccion_envio.piso_depto && `, ${order.direccion_envio.piso_depto}`}
              </p>
              <p>
                {order.direccion_envio.ciudad}, {order.direccion_envio.provincia} - CP{' '}
                {order.direccion_envio.codigo_postal}
              </p>
            </div>
          </div>

          {/* Guest Upload Success */}
          {guestUploadSuccess && isGuest && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-700" />
                <h2 className="text-lg font-medium text-green-800">Comprobante enviado</h2>
              </div>
              <p className="text-green-700">
                Tu comprobante fue subido correctamente. Verificaremos tu pago en un plazo de 24-48 horas hábiles y recibirás un email a <strong>{guestEmail}</strong> con la confirmación.
              </p>
            </div>
          )}

          {/* Guest Upload Form Modal */}
          {showGuestUpload && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-xl font-medium mb-4">Subir Comprobante de Pago</h3>
                
                {guestUploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {guestUploadError}
                  </div>
                )}

                <form onSubmit={handleGuestUploadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comprobante (imagen o PDF) *
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleGuestFileSelect}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    {guestFile && (
                      <p className="text-sm text-green-600 mt-1">✓ {guestFile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de operación/referencia
                    </label>
                    <input
                      type="text"
                      value={guestUploadData.transfer_reference}
                      onChange={(e) => setGuestUploadData({ ...guestUploadData, transfer_reference: e.target.value })}
                      placeholder="Ej: 12345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de transferencia
                      </label>
                      <input
                        type="date"
                        value={guestUploadData.transfer_date}
                        onChange={(e) => setGuestUploadData({ ...guestUploadData, transfer_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto transferido
                      </label>
                      <input
                        type="number"
                        value={guestUploadData.transfer_amount}
                        onChange={(e) => setGuestUploadData({ ...guestUploadData, transfer_amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas adicionales
                    </label>
                    <textarea
                      value={guestUploadData.customer_notes}
                      onChange={(e) => setGuestUploadData({ ...guestUploadData, customer_notes: e.target.value })}
                      placeholder="Información adicional sobre la transferencia..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGuestUpload(false)}
                      className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!guestFile || isGuestUploading}
                      className="flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGuestUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Enviar Comprobante
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {!isMercadoPago && !isGuest && (
              <Link
                href={`/cuenta/pedidos/${order.id}`}
                className="flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                Subir Comprobante
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {!isMercadoPago && isGuest && !guestUploadSuccess && (
              <button
                onClick={() => setShowGuestUpload(true)}
                className="flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Subir Comprobante
              </button>
            )}
            {!isGuest && (
              <Link
                href="/cuenta/pedidos"
                className={`${isMercadoPago ? 'flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90' : 'flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50'} transition-colors text-center`}
              >
                Ver Mis Pedidos
              </Link>
            )}
            <Link
              href="/colecciones"
              className={`${isGuest && !isMercadoPago ? 'flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90' : 'flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50'} transition-colors text-center`}
            >
              Seguir Comprando
            </Link>
          </div>

          {isGuest ? (
            <p className="text-center text-sm text-gray-500 mt-6">
              Recibirás actualizaciones sobre tu pedido en <strong>{guestEmail}</strong>.
            </p>
          ) : (
            <p className="text-center text-sm text-gray-500 mt-6">
              Recibirás emails con las actualizaciones de tu pedido.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
