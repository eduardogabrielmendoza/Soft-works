'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  Mail,
  Upload,
  ChevronLeft,
  Package,
  MapPin,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrderById } from '@/lib/api/orders';
import { getActiveBankAccounts } from '@/lib/api/settings';
import { formatPrice, copyToClipboard } from '@/lib/utils/helpers';
import type { OrderWithItems, BankAccount } from '@/lib/types/database.types';

// =============================================
// STATUS BADGE COMPONENT
// =============================================
function StatusBadge({
  status,
  mpStatus,
}: {
  status: string;
  mpStatus: string | null;
}) {
  if (mpStatus === 'approved' || status === 'pago_aprobado' || status === 'enviado' || status === 'finalizado') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3.5 h-3.5" />
        {status === 'enviado' ? 'Enviado' : status === 'finalizado' ? 'Finalizado' : 'Pago Aprobado'}
      </span>
    );
  }
  if (mpStatus === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3.5 h-3.5" />
        Pago Rechazado
      </span>
    );
  }
  if (mpStatus === 'pending' || status === 'pendiente_pago') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3.5 h-3.5" />
        Pago Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      <Clock className="w-3.5 h-3.5" />
      En Proceso
    </span>
  );
}

// =============================================
// SECTION HEADER
// =============================================
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
      <Icon className="w-5 h-5 text-gray-600" />
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h2>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================
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

  useEffect(() => {
    if (!authLoading && user && orderId) {
      loadAuthData();
    }
  }, [user, authLoading, orderId]);

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

  // =============================================
  // LOADING / ERROR STATES
  // =============================================

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-20 px-4 py-12 bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <p className="text-gray-500 mb-4">Pedido no encontrado</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const guestEmail = order.cliente_email;

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="pt-20 px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <Link
          href="/colecciones"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Seguir comprando
        </Link>

        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              {isMercadoPago && isApproved && (
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              )}
              {isMercadoPago && isRejected && (
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-7 h-7 text-red-600" />
                </div>
              )}
              {isMercadoPago && isPending && (
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-yellow-600" />
                </div>
              )}
              {!isMercadoPago && (
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              )}

              <div>
                <h1 className="text-xl lg:text-2xl font-medium">
                  {isMercadoPago && isApproved && '¡Pago Aprobado!'}
                  {isMercadoPago && isRejected && 'Pago Rechazado'}
                  {isMercadoPago && isPending && 'Pago Pendiente'}
                  {!isMercadoPago && '¡Pedido Confirmado!'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Pedido <span className="font-medium text-foreground">{order.numero_pedido}</span>
                  {' · '}
                  {new Date(order.fecha_creacion).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <StatusBadge status={order.estado} mpStatus={mpStatus} />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ============================== */}
          {/* LEFT COLUMN */}
          {/* ============================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* MP Approved — registered */}
              {isMercadoPago && isApproved && !isGuest && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
                      Pago Exitoso
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-gray-700 mb-4">
                      Tu pago con tarjeta fue aprobado correctamente. Vamos a preparar tu pedido
                      para enviarlo lo antes posible.
                    </p>
                    <div className="space-y-3">
                      {[
                        { n: '1', t: 'Preparamos tu pedido', d: 'Nuestro equipo comenzará a preparar tu pedido.' },
                        { n: '2', t: 'Te avisamos por email', d: 'Recibirás un email cuando tu pedido sea despachado con el código de seguimiento.' },
                      ].map((s) => (
                        <div key={s.n} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                            {s.n}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{s.t}</p>
                            <p className="text-xs text-gray-500">{s.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MP Approved — guest */}
              {isMercadoPago && isApproved && isGuest && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
                      Pago Exitoso
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-gray-700 mb-4">
                      Tu pago con tarjeta fue aprobado correctamente. Vamos a preparar tu pedido
                      para enviarlo lo antes posible.
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        Recibirás todas las actualizaciones por correo electrónico a{' '}
                        <strong>{guestEmail}</strong>. Guardá tu número de pedido:{' '}
                        <strong>{order.numero_pedido}</strong>
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { n: '1', t: 'Anotá tu número de pedido', d: `Tu número es ${order.numero_pedido}. Guardalo para futuras consultas.` },
                        { n: '2', t: 'Preparamos tu pedido', d: 'Nuestro equipo comenzará a preparar tu pedido.' },
                        { n: '3', t: 'Te avisamos por email', d: `Te enviaremos el código de seguimiento a ${guestEmail}.` },
                      ].map((s) => (
                        <div key={s.n} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                            {s.n}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{s.t}</p>
                            <p className="text-xs text-gray-500">{s.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MP Rejected */}
              {isMercadoPago && isRejected && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-700" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-red-800">
                      Pago No Procesado
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-gray-700 mb-4">
                      Tu pago no pudo ser procesado. Esto puede ocurrir por fondos insuficientes,
                      datos incorrectos o un rechazo del emisor de tu tarjeta.
                    </p>
                    <Link
                      href="/checkout"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Intentar de Nuevo
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* MP Pending */}
              {isMercadoPago && isPending && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-700" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-yellow-800">
                      Procesando Pago
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-gray-700">
                      Tu pago está siendo procesado por MercadoPago. Este proceso puede demorar unos
                      minutos. Recibirás un email cuando se confirme el pago.
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Transfer Instructions */}
              {!isMercadoPago && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-yellow-700" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-yellow-800">
                      Transferencia Bancaria
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-gray-700 mb-4">
                      Para completar tu compra, transferí el monto indicado a cualquiera de nuestras
                      cuentas:
                    </p>

                    {bankAccounts.map((account) => (
                      <div key={account.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                        <p className="font-medium text-foreground mb-3">{account.banco}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Titular:</span>
                            <span className="font-medium">{account.titular}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">CUIT:</span>
                            <span className="font-medium">{account.cuit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">CBU:</span>
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
                              <span className="text-gray-500">Alias:</span>
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

                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Monto a transferir:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-foreground">
                            {formatPrice(order.total)}
                          </span>
                          <button
                            onClick={() => handleCopy(order.total.toString(), 'total')}
                            className="p-1 hover:bg-gray-200 rounded"
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
                </div>
              )}
            </motion.div>

            {/* Guest Warning */}
            {isGuest && !isMercadoPago && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-white rounded-lg border-2 border-orange-300 overflow-hidden"
              >
                <div className="px-6 py-4 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-800">
                    ¡Importante!
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="text-gray-700 mb-3">
                    Como no tenés una cuenta en Softworks,{' '}
                    <strong>guardá el link de esta página o hacé una captura de pantalla</strong> con
                    los datos bancarios para realizar la transferencia y subir tu comprobante.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Una vez que tu pago sea verificado, recibirás un correo electrónico a{' '}
                      <strong>{guestEmail}</strong> con los datos de seguimiento.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next Steps (Transfer — registered) */}
            {!isMercadoPago && !isGuest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <SectionHeader icon={ArrowRight} title="Próximos Pasos" />
                <div className="px-6 py-5 space-y-4">
                  {[
                    { n: '1', t: 'Realizá la transferencia', d: 'Usá los datos bancarios de arriba para transferir el monto exacto.' },
                    { n: '2', t: 'Subí el comprobante', d: 'Accedé a tu pedido y subí una foto o captura del comprobante de transferencia.' },
                    { n: '3', t: 'Esperá la verificación', d: 'Verificaremos tu pago en un plazo de 24-48 horas hábiles y recibirás un email con la confirmación.' },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {s.n}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.t}</p>
                        <p className="text-xs text-gray-500">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Next Steps (Transfer — guest) */}
            {!isMercadoPago && isGuest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <SectionHeader icon={ArrowRight} title="Próximos Pasos" />
                <div className="px-6 py-5 space-y-4">
                  {[
                    { n: '1', t: 'Guardá esta información', d: `Hacé una captura de pantalla o anotá los datos bancarios y tu número de pedido: ${order.numero_pedido}` },
                    { n: '2', t: 'Realizá la transferencia', d: 'Usá los datos bancarios de arriba para transferir el monto exacto.' },
                    { n: '3', t: 'Subí el comprobante', d: 'Una vez realizada la transferencia, subí una foto o captura del comprobante usando el botón de abajo.' },
                    { n: '4', t: 'Esperá la verificación', d: `Verificaremos tu pago en 24-48 horas hábiles y recibirás un correo a ${guestEmail} con la confirmación.` },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-gray-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {s.n}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.t}</p>
                        <p className="text-xs text-gray-500">{s.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Guest Upload Success */}
            {guestUploadSuccess && isGuest && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-green-200 overflow-hidden"
              >
                <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
                    Comprobante Enviado
                  </h2>
                </div>
                <div className="px-6 py-5">
                  <p className="text-gray-700">
                    Tu comprobante fue subido correctamente. Verificaremos tu pago en un plazo de
                    24-48 horas hábiles y recibirás un email a <strong>{guestEmail}</strong> con la
                    confirmación.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {!isMercadoPago && !isGuest && (
                <Link
                  href={`/cuenta/pedidos/${order.id}`}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  Subir Comprobante
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {!isMercadoPago && isGuest && !guestUploadSuccess && (
                <button
                  onClick={() => setShowGuestUpload(true)}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Subir Comprobante
                </button>
              )}
              {!isGuest && (
                <Link
                  href="/cuenta/pedidos"
                  className={`flex-1 py-3 text-sm font-medium rounded-md transition-colors text-center flex items-center justify-center ${
                    isMercadoPago
                      ? 'bg-gray-700 text-white hover:bg-gray-800'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Ver Mis Pedidos
                </Link>
              )}
              <Link
                href="/colecciones"
                className="flex-1 py-3 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-center flex items-center justify-center"
              >
                Seguir Comprando
              </Link>
            </motion.div>

            {/* Footer notice */}
            {isGuest ? (
              <p className="text-center text-xs text-gray-400">
                Recibirás actualizaciones sobre tu pedido en <strong>{guestEmail}</strong>.
              </p>
            ) : (
              <p className="text-center text-xs text-gray-400">
                Recibirás emails con las actualizaciones de tu pedido.
              </p>
            )}
          </div>

          {/* ============================== */}
          {/* RIGHT COLUMN: Order Summary */}
          {/* ============================== */}
          <div className="space-y-6">
            {/* Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <SectionHeader icon={Package} title="Resumen del Pedido" />
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex gap-4">
                    {item.producto_imagen && (
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={item.producto_imagen}
                          alt={item.producto_nombre}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.producto_nombre}</p>
                      <p className="text-xs text-gray-500">
                        Talla {item.talle} × {item.cantidad}
                      </p>
                    </div>
                    <span className="text-sm font-medium flex-shrink-0">
                      {formatPrice(item.total_linea)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="px-6 py-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span>{formatPrice(order.costo_envio)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Método de pago</span>
                  <span>
                    {order.metodo_pago === 'mercadopago' || isMercadoPago
                      ? 'MercadoPago'
                      : 'Transferencia'}
                  </span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <SectionHeader icon={MapPin} title="Dirección de Envío" />
              <div className="px-6 py-5 text-sm text-gray-600">
                <p className="font-medium text-foreground">
                  {order.direccion_envio.nombre_destinatario}
                </p>
                <p>
                  {order.direccion_envio.calle} {order.direccion_envio.numero}
                  {order.direccion_envio.piso_depto &&
                    `, ${order.direccion_envio.piso_depto}`}
                </p>
                <p>
                  {order.direccion_envio.ciudad}, {order.direccion_envio.provincia} - CP{' '}
                  {order.direccion_envio.codigo_postal}
                </p>
              </div>
            </motion.div>

            {/* Shipping Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <SectionHeader icon={Truck} title="Método de Envío" />
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Correo Argentino Regular</p>
                    <p className="text-xs text-gray-500">En hasta 6 días hábiles</p>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(order.costo_envio)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

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
                  onChange={(e) =>
                    setGuestUploadData({
                      ...guestUploadData,
                      transfer_reference: e.target.value,
                    })
                  }
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
                    onChange={(e) =>
                      setGuestUploadData({
                        ...guestUploadData,
                        transfer_date: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setGuestUploadData({
                        ...guestUploadData,
                        transfer_amount: e.target.value,
                      })
                    }
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
                  onChange={(e) =>
                    setGuestUploadData({
                      ...guestUploadData,
                      customer_notes: e.target.value,
                    })
                  }
                  placeholder="Información adicional sobre la transferencia..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuestUpload(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!guestFile || isGuestUploading}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
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
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      }
    >
      <ConfirmacionContent />
    </Suspense>
  );
}
