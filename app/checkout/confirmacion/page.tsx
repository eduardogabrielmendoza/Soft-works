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
  ShieldCheck,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrderById, submitPaymentVerification } from '@/lib/api/orders';
import { uploadReceipt } from '@/lib/api/storage';
import { getActiveBankAccounts } from '@/lib/api/settings';
import { formatPrice, copyToClipboard } from '@/lib/utils/helpers';
import type { OrderWithItems, BankAccount } from '@/lib/types/database.types';

// =============================================
// STATUS BADGE
// =============================================
function StatusBadge({ status, mpStatus }: { status: string; mpStatus: string | null }) {
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
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Clock className="w-3.5 h-3.5" />
      Pago Pendiente
    </span>
  );
}

// =============================================
// SECTION HEADER (for sidebar cards)
// =============================================
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
      <Icon className="w-5 h-5 text-gray-600" />
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h2>
    </div>
  );
}

// =============================================
// WIZARD STEP HEADER (for left column steps)
// =============================================
function WizardStepHeader({
  number,
  totalSteps,
  title,
  isCompleted,
  isActive,
  isDisabled,
}: {
  number: number;
  totalSteps: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  isDisabled: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-3 rounded-t-lg transition-colors ${
        isDisabled ? 'bg-gray-50' : 'bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {isCompleted ? (
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        ) : isActive ? (
          <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{number}</span>
          </div>
        ) : (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{number}</span>
          </div>
        )}
        <span
          className={`text-sm font-bold uppercase tracking-wide ${
            isDisabled ? 'text-gray-400' : 'text-foreground'
          }`}
        >
          {title}
        </span>
        <span className="text-xs text-gray-500 font-medium">
          {number}/{totalSteps}
        </span>
      </div>
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

  // Wizard state for transfer flow
  const [wizardStep, setWizardStep] = useState(1);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  // Upload state (unified for guest and registered)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    transfer_reference: '',
    transfer_date: '',
    transfer_amount: '',
    customer_notes: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isMercadoPago = !!mpStatus || order?.metodo_pago === 'mercadopago';
  const isApproved = mpStatus === 'approved';
  const isRejected = mpStatus === 'rejected';
  const isPending = mpStatus === 'pending';

  useEffect(() => {
    if (!authLoading && user && orderId) loadAuthData();
  }, [user, authLoading, orderId]);

  useEffect(() => {
    if (!authLoading && !user && orderId) loadGuestData();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setUploadError('Solo se permiten imágenes o PDFs');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('El archivo no puede superar 5MB');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // Step 1: mark bank data as reviewed
  const handleStep1Continue = () => {
    setStep1Done(true);
    setWizardStep(2);
  };

  // Step 2: upload receipt
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !order) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (isGuest) {
        // Guest: use API route with FormData
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('orderId', order.id);
        if (uploadData.transfer_reference) formData.append('transfer_reference', uploadData.transfer_reference);
        if (uploadData.transfer_date) formData.append('transfer_date', uploadData.transfer_date);
        if (uploadData.transfer_amount) formData.append('transfer_amount', uploadData.transfer_amount);
        if (uploadData.customer_notes) formData.append('customer_notes', uploadData.customer_notes);

        const res = await fetch('/api/checkout/guest-upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al subir el comprobante');
        }
      } else {
        // Registered: use Supabase client-side
        const { url, filename } = await uploadReceipt(selectedFile, order.id);
        await submitPaymentVerification(order.id, {
          comprobante_url: url,
          comprobante_nombre: filename,
          referencia_transferencia: uploadData.transfer_reference || undefined,
          fecha_transferencia: uploadData.transfer_date || undefined,
          monto_transferido: uploadData.transfer_amount ? parseFloat(uploadData.transfer_amount) : undefined,
          notas_cliente: uploadData.customer_notes || undefined,
        });
      }

      setStep2Done(true);
      setWizardStep(3);
    } catch (error: any) {
      setUploadError(error.message || 'Error al subir el comprobante');
    } finally {
      setIsUploading(false);
    }
  };

  // =============================================
  // LOADING / ERROR
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
  const isTransfer = !isMercadoPago;

  // =============================================
  // RENDER: SIDEBAR (shared between transfer wizard & MP)
  // =============================================
  const sidebar = (
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
            <span>{isMercadoPago ? 'MercadoPago' : 'Transferencia'}</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Address */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        <SectionHeader icon={MapPin} title="Dirección de Envío" />
        <div className="px-6 py-5 text-sm text-gray-600">
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
      </motion.div>

      {/* Shipping */}
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
  );

  // =============================================
  // RENDER: MERCADOPAGO FLOW (no wizard)
  // =============================================
  if (isMercadoPago) {
    return (
      <div className="pt-20 px-4 py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/colecciones"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Seguir comprando
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isApproved ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-yellow-100'
                  }`}
                >
                  {isApproved && <CheckCircle className="w-7 h-7 text-green-600" />}
                  {isRejected && <XCircle className="w-7 h-7 text-red-600" />}
                  {isPending && <Clock className="w-7 h-7 text-yellow-600" />}
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-medium">
                    {isApproved && '¡Pago Aprobado!'}
                    {isRejected && 'Pago Rechazado'}
                    {isPending && 'Pago Pendiente'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Pedido{' '}
                    <span className="font-medium text-foreground">{order.numero_pedido}</span>
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
            <div className="lg:col-span-2 space-y-6">
              {/* Approved */}
              {isApproved && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
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
                    {isGuest && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
                        <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-blue-800">
                          Recibirás actualizaciones por email a <strong>{guestEmail}</strong>.
                          Guardá tu número de pedido: <strong>{order.numero_pedido}</strong>
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {(isGuest
                        ? [
                            { n: '1', t: 'Anotá tu número de pedido', d: `Tu número es ${order.numero_pedido}. Guardalo para futuras consultas.` },
                            { n: '2', t: 'Preparamos tu pedido', d: 'Nuestro equipo comenzará a preparar tu pedido.' },
                            { n: '3', t: 'Te avisamos por email', d: `Te enviaremos el código de seguimiento a ${guestEmail}.` },
                          ]
                        : [
                            { n: '1', t: 'Preparamos tu pedido', d: 'Nuestro equipo comenzará a preparar tu pedido.' },
                            { n: '2', t: 'Te avisamos por email', d: 'Recibirás un email cuando tu pedido sea despachado con el código de seguimiento.' },
                          ]
                      ).map((s) => (
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
                </motion.div>
              )}

              {/* Rejected */}
              {isRejected && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
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
                </motion.div>
              )}

              {/* Pending */}
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
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
                </motion.div>
              )}

              {/* MP Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {!isGuest && (
                  <Link
                    href="/cuenta/pedidos"
                    className="flex-1 py-3 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors text-center flex items-center justify-center"
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

            {sidebar}
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // RENDER: TRANSFER WIZARD FLOW (3 steps)
  // =============================================
  return (
    <div className="pt-20 px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Back link — only for registered users */}
        {!isGuest && (
          <Link
            href="/colecciones"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Seguir comprando
          </Link>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${step2Done ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {step2Done ? (
                  <CheckCircle className="w-7 h-7 text-green-600" />
                ) : (
                  <CreditCard className="w-7 h-7 text-yellow-600" />
                )}
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-medium">
                  {step2Done ? '¡Comprobante Enviado!' : '¡Pedido Confirmado!'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Pedido{' '}
                  <span className="font-medium text-foreground">{order.numero_pedido}</span>
                  {' · '}
                  {new Date(order.fecha_creacion).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <StatusBadge status={order.estado} mpStatus={null} />
          </div>
        </motion.div>

        {/* Guest Warning Banner */}
        {isGuest && !step2Done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-6 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">
                ¡Importante! No cierres esta página
              </p>
              <p className="text-xs text-orange-700">
                Como no tenés una cuenta, <strong>no podrás volver a esta página</strong>. Completá
                la transferencia y subí tu comprobante antes de salir. Tu número de pedido es:{' '}
                <strong>{order.numero_pedido}</strong>
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ============================== */}
          {/* LEFT: Wizard Steps */}
          {/* ============================== */}
          <div className="lg:col-span-2 space-y-4">
            {/* ============ STEP 1: DATOS BANCARIOS ============ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <WizardStepHeader
                number={1}
                totalSteps={3}
                title="DATOS BANCARIOS"
                isCompleted={step1Done}
                isActive={wizardStep === 1}
                isDisabled={false}
              />

              {step1Done && wizardStep !== 1 ? (
                // Collapsed summary
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>
                        Monto a transferir:{' '}
                        <span className="font-semibold text-foreground">
                          {formatPrice(order.total)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {bankAccounts.length} cuenta{bankAccounts.length !== 1 ? 's' : ''} disponible{bankAccounts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setWizardStep(1)}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      Ver datos
                    </button>
                  </div>
                </div>
              ) : wizardStep === 1 ? (
                // Expanded
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-gray-700">
                    Para completar tu compra, transferí el monto indicado a cualquiera de nuestras
                    cuentas bancarias:
                  </p>

                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
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
                                onClick={() =>
                                  handleCopy(account.alias!, `alias-${account.id}`)
                                }
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
                      <span className="text-gray-600 text-sm">Monto a transferir:</span>
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

                  <button
                    onClick={handleStep1Continue}
                    className="w-full py-3 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    Ya tengo los datos, continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </motion.div>

            {/* ============ STEP 2: COMPROBANTE DE PAGO ============ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <WizardStepHeader
                number={2}
                totalSteps={3}
                title="COMPROBANTE DE PAGO"
                isCompleted={step2Done}
                isActive={wizardStep === 2}
                isDisabled={!step1Done}
              />

              {step2Done && wizardStep !== 2 ? (
                // Collapsed summary
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Comprobante enviado correctamente</span>
                  </div>
                </div>
              ) : wizardStep === 2 ? (
                // Expanded — inline upload form
                <form onSubmit={handleUploadSubmit} className="px-6 py-5 space-y-4">
                  <p className="text-sm text-gray-700">
                    Una vez realizada la transferencia, subí el comprobante y completá los datos
                    opcionales para agilizar la verificación:
                  </p>

                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {uploadError}
                    </div>
                  )}

                  {/* File */}
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Comprobante (imagen o PDF) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {selectedFile.name}
                      </p>
                    )}
                  </div>

                  {/* Reference */}
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">
                      Número de operación / referencia
                    </label>
                    <input
                      type="text"
                      value={uploadData.transfer_reference}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, transfer_reference: e.target.value })
                      }
                      placeholder="Ej: 12345678"
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                    />
                  </div>

                  {/* Date + Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">
                        Fecha de transferencia
                      </label>
                      <input
                        type="date"
                        value={uploadData.transfer_date}
                        onChange={(e) =>
                          setUploadData({ ...uploadData, transfer_date: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Monto transferido</label>
                      <input
                        type="number"
                        value={uploadData.transfer_amount}
                        onChange={(e) =>
                          setUploadData({ ...uploadData, transfer_amount: e.target.value })
                        }
                        placeholder={order.total.toString()}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Notas adicionales</label>
                    <textarea
                      value={uploadData.customer_notes}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, customer_notes: e.target.value })
                      }
                      placeholder="Información adicional sobre la transferencia..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="w-full py-3 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Enviar Comprobante
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Locked state
                <div className="px-6 py-5 text-center">
                  <p className="text-sm text-gray-400">
                    Revisá los datos bancarios en el paso anterior para continuar.
                  </p>
                </div>
              )}
            </motion.div>

            {/* ============ STEP 3: VERIFICACIÓN ============ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <WizardStepHeader
                number={3}
                totalSteps={3}
                title="VERIFICACIÓN"
                isCompleted={false}
                isActive={wizardStep === 3}
                isDisabled={!step2Done}
              />

              {wizardStep === 3 ? (
                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-green-800">
                        Comprobante recibido correctamente
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        Verificaremos tu pago en un plazo de 24-48 horas hábiles.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">¿Qué sigue?</p>
                    {[
                      {
                        n: '1',
                        t: 'Verificamos tu pago',
                        d: 'Nuestro equipo revisará el comprobante y aprobará el pago.',
                      },
                      {
                        n: '2',
                        t: 'Preparamos tu pedido',
                        d: 'Una vez aprobado, comenzamos a preparar tu envío.',
                      },
                      {
                        n: '3',
                        t: isGuest
                          ? `Te notificamos por email a ${guestEmail}`
                          : 'Te notificamos por email',
                        d: 'Recibirás un correo con la confirmación del pago y luego otro con el código de seguimiento.',
                      },
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

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {!isGuest && (
                      <Link
                        href="/cuenta/pedidos"
                        className="flex-1 py-3 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors text-center flex items-center justify-center"
                      >
                        Ver Mis Pedidos
                      </Link>
                    )}
                    {!isGuest && (
                      <Link
                        href="/colecciones"
                        className="flex-1 py-3 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-center flex items-center justify-center"
                      >
                        Seguir Comprando
                      </Link>
                    )}
                  </div>

                  {isGuest && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        Recibirás todas las actualizaciones por correo electrónico a{' '}
                        <strong>{guestEmail}</strong>. Ya podés cerrar esta página.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Locked state
                <div className="px-6 py-5 text-center">
                  <p className="text-sm text-gray-400">
                    Subí tu comprobante en el paso anterior para continuar.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT: Sidebar */}
          {sidebar}
        </div>
      </div>
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
