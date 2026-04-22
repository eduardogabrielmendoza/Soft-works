'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Loader2, Check, MapPin, Truck, CreditCard,
  Building2, UserPlus, Package, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CorreoArgentinoBranchSelector from '../components/CorreoArgentinoBranchSelector';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/lib/hooks/useCart';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { getUserAddresses, createAddress, ARGENTINA_PROVINCES } from '@/lib/api/addresses';
import { formatPrice, getShippingMethodEtaLabel, getShippingMethodLabel } from '@/lib/utils/helpers';
import { lookupPostalCode, isValidPostalFormat } from '@/lib/utils/postalCodes';
import {
  getEffectiveShippingCost,
  getFreeShippingThreshold,
  getShippingCostForProvince,
  hasFreeShipping,
} from '@/lib/utils/shipping';
import type { Direccion, MetodoPago, SucursalCorreoSeleccionada, TipoEntrega } from '@/lib/types/database.types';

const SHIPPING_DAYS = 6;

// =============================================
// TYPES
// =============================================

interface Identificacion {
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
}

interface DireccionEnvio {
  calle: string;
  numero: string;
  piso_depto: string;
  localidad: string;
  destinatario: string;
}

// =============================================
// STEP HEADER COMPONENT
// =============================================

function StepHeader({
  number,
  title,
  isCompleted,
  isActive,
  onEdit,
}: {
  number: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-wide text-foreground">
          {title}
        </span>
        <span className="text-xs text-gray-500 font-medium">{number}/3</span>
      </div>
      {isCompleted && !isActive && onEdit && (
        <button
          onClick={onEdit}
          className="text-sm font-medium text-foreground hover:underline"
        >
          Editar
        </button>
      )}
    </div>
  );
}

// =============================================
// PROGRESS BAR
// =============================================

function ProgressBar({ currentStep, stepsCompleted }: { currentStep: number; stepsCompleted: boolean[] }) {
  const steps = [
    { label: 'CARRITO', completed: true },
    { label: 'IDENTIFICACIÓN', completed: stepsCompleted[0] },
    { label: 'ENVÍO', completed: stepsCompleted[1] },
    { label: 'PAGO', completed: stepsCompleted[2] },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                step.completed
                  ? 'bg-foreground border-foreground text-white'
                  : i === currentStep
                  ? 'border-foreground text-foreground'
                  : 'border-gray-300 text-gray-300'
              }`}
            >
              {step.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs font-medium">{i + 1}</span>
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium tracking-wider ${
                step.completed || i === currentStep ? 'text-foreground' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-0.5 mx-1 mt-[-12px] ${
                step.completed ? 'bg-foreground' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================
// MAIN CHECKOUT PAGE
// =============================================

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { config: siteConfig } = useSiteConfig();

  // Guest state
  const isGuest = !authLoading && !user;
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [guestAccepted, setGuestAccepted] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('softworks_guest_accepted') === 'true';
    } catch {
      return false;
    }
  });

  const guestPromptShownRef = useRef(false);
  useEffect(() => {
    if (!authLoading && !user && !guestAccepted && !guestPromptShownRef.current) {
      guestPromptShownRef.current = true;
      setShowGuestPrompt(true);
    }
  }, [authLoading, user, guestAccepted]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  // Step 1: Identificación
  const [ident, setIdent] = useState<Identificacion>({
    email: '',
    nombre: '',
    apellido: '',
    telefono: '',
  });
  const [step1Error, setStep1Error] = useState('');

  // Step 2: Envío
  const [codigoPostal, setCodigoPostal] = useState('');
  const [provinciaDetectada, setProvinciaDetectada] = useState('');
  const [postalError, setPostalError] = useState('');
  const [postalValidated, setPostalValidated] = useState(false);
  const [showProvinciaSelector, setShowProvinciaSelector] = useState(false);
  const [shippingMode, setShippingMode] = useState<TipoEntrega>('domicilio');
  const [selectedBranch, setSelectedBranch] = useState<SucursalCorreoSeleccionada | null>(null);
  const [direccion, setDireccion] = useState<DireccionEnvio>({
    calle: '',
    numero: '',
    piso_depto: '',
    localidad: '',
    destinatario: '',
  });
  const [step2Error, setStep2Error] = useState('');

  // Step 3: Pago
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('mercadopago');

  // Order
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Data
  const [isLoading, setIsLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<Direccion[]>([]);

  // =============================================
  // COMPUTED VALUES
  // =============================================

  const domicilioShippingBaseCost = provinciaDetectada
    ? getShippingCostForProvince(provinciaDetectada, 'domicilio', siteConfig.shipping_rates)
    : 0;
  const branchShippingBaseCost = provinciaDetectada
    ? getShippingCostForProvince(provinciaDetectada, 'sucursal_correo', siteConfig.shipping_rates)
    : 0;
  const freeShippingThreshold = getFreeShippingThreshold(siteConfig.free_shipping_threshold);
  const freeShippingApplied = hasFreeShipping(subtotal, freeShippingThreshold);
  const domicilioShippingCost = getEffectiveShippingCost(
    subtotal,
    domicilioShippingBaseCost,
    freeShippingThreshold,
  );
  const branchShippingCost = getEffectiveShippingCost(
    subtotal,
    branchShippingBaseCost,
    freeShippingThreshold,
  );
  const finalShippingCost = shippingMode === 'sucursal_correo' ? branchShippingCost : domicilioShippingCost;
  const total = subtotal + finalShippingCost;
  const canFinalize = step1Done && step2Done && step3Done && acceptedTerms && !isCreatingOrder;
  const shippingLabel = getShippingMethodLabel(shippingMode);
  const shippingEtaLabel = getShippingMethodEtaLabel(shippingMode);

  // =============================================
  // DATA LOADING
  // =============================================

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const addrs = await getUserAddresses(user.id);
          setSavedAddresses(addrs);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
      setIsLoading(false);
    };

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  // Pre-fill for logged-in users
  useEffect(() => {
    if (profile && !step1Done) {
      setIdent({
        email: profile.email || user?.email || '',
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        telefono: profile.telefono || '',
      });

      // If profile has all required fields, auto-complete step 1
      if (profile.email && profile.nombre && profile.apellido) {
        setStep1Done(true);
        setCurrentStep(2);
      }
    }
  }, [profile, user]);

  // Pre-fill address from saved default address
  useEffect(() => {
    if (savedAddresses.length > 0 && !postalValidated) {
      const defaultAddr = savedAddresses.find((a) => a.es_predeterminada) || savedAddresses[0];
      setCodigoPostal(defaultAddr.codigo_postal);
      setDireccion({
        calle: defaultAddr.calle,
        numero: defaultAddr.numero,
        piso_depto: defaultAddr.piso_depto || '',
        localidad: defaultAddr.ciudad,
        destinatario: defaultAddr.nombre_destinatario,
      });
      setShippingMode('domicilio');
      setSelectedBranch(null);

      const result = lookupPostalCode(defaultAddr.codigo_postal);
      if (result) {
        setProvinciaDetectada(result.provincia);
        setPostalValidated(true);
      } else {
        setProvinciaDetectada(defaultAddr.provincia);
        setPostalValidated(true);
      }
    }
  }, [savedAddresses]);

  // Auto-fill destinatario from step 1
  useEffect(() => {
    if (step1Done && !direccion.destinatario) {
      setDireccion((d) => ({
        ...d,
        destinatario: `${ident.nombre} ${ident.apellido}`.trim(),
      }));
    }
  }, [step1Done, ident.nombre, ident.apellido]);

  // =============================================
  // STEP 1 HANDLERS
  // =============================================

  const handleStep1Submit = () => {
    setStep1Error('');
    if (!ident.email || !ident.nombre || !ident.apellido) {
      setStep1Error('Completá email, nombre y apellido para continuar.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ident.email)) {
      setStep1Error('Ingresá un email válido.');
      return;
    }
    setStep1Done(true);
    setCurrentStep(2);
    if (!direccion.destinatario) {
      setDireccion((d) => ({ ...d, destinatario: `${ident.nombre} ${ident.apellido}`.trim() }));
    }
  };

  const handleStep1Edit = () => {
    setStep1Done(false);
    setCurrentStep(1);
  };

  // =============================================
  // STEP 2 HANDLERS
  // =============================================

  const handlePostalCodeSubmit = useCallback(() => {
    setPostalError('');
    if (!codigoPostal.trim()) {
      setPostalError('Ingresá tu código postal.');
      return;
    }
    if (!isValidPostalFormat(codigoPostal)) {
      setPostalError('Código postal inválido. Ingresá 4 dígitos.');
      return;
    }
    const result = lookupPostalCode(codigoPostal);
    if (result) {
      setProvinciaDetectada(result.provincia);
      setPostalValidated(true);
    } else {
      setPostalError('No encontramos tu código postal. Seleccioná tu provincia manualmente.');
      setShowProvinciaSelector(true);
      setPostalValidated(true);
    }
  }, [codigoPostal]);

  // Auto-lookup on 4-digit input
  useEffect(() => {
    if (codigoPostal.length === 4 && /^\d{4}$/.test(codigoPostal)) {
      handlePostalCodeSubmit();
    }
  }, [codigoPostal, handlePostalCodeSubmit]);

  const handleStep2Submit = () => {
    setStep2Error('');
    if (!postalValidated || !provinciaDetectada) {
      setStep2Error('Ingresá tu código postal primero.');
      return;
    }
    if (!direccion.destinatario) {
      setStep2Error('Indicá quién retira o recibe el pedido.');
      return;
    }
    if (shippingMode === 'sucursal_correo' && !selectedBranch) {
      setStep2Error('Seleccioná una sucursal de Correo Argentino para continuar.');
      return;
    }
    if (shippingMode === 'domicilio' && (!direccion.calle || !direccion.numero || !direccion.localidad)) {
      setStep2Error('Completá todos los campos obligatorios de la dirección.');
      return;
    }
    setStep2Done(true);
    setCurrentStep(3);
    setStep3Done(true);
  };

  const handleStep2Edit = () => {
    setStep2Done(false);
    setStep3Done(false);
    setCurrentStep(2);
  };

  // =============================================
  // STEP 3 HANDLER
  // =============================================

  const handleSelectPaymentMethod = (method: MetodoPago) => {
    setPaymentMethod(method);
    setStep3Done(true);
  };

  // =============================================
  // ORDER CREATION
  // =============================================

  const handleCreateOrder = async () => {
    if (!canFinalize) return;

    setIsCreatingOrder(true);
    setError(null);

    try {
      const provincia = provinciaDetectada;
      const direccion_envio = shippingMode === 'sucursal_correo' && selectedBranch
        ? {
            tipo_entrega: 'sucursal_correo' as const,
            nombre_destinatario: direccion.destinatario,
            calle: selectedBranch.direccion,
            numero: '',
            piso_depto: undefined,
            ciudad: selectedBranch.localidad_nombre,
            provincia,
            codigo_postal: selectedBranch.codigo_postal || codigoPostal,
            telefono: ident.telefono || undefined,
            sucursal_correo: selectedBranch,
          }
        : {
            tipo_entrega: 'domicilio' as const,
            nombre_destinatario: direccion.destinatario,
            calle: direccion.calle,
            numero: direccion.numero,
            piso_depto: direccion.piso_depto || undefined,
            ciudad: direccion.localidad,
            provincia,
            codigo_postal: codigoPostal,
            telefono: ident.telefono || undefined,
          };

      const orderPayload = {
        direccion_envio,
        items: items.map((item) => ({
          producto_id: item.producto_id,
          talle: item.talle,
          cantidad: item.cantidad,
          producto_precio: item.precio,
          producto_nombre: item.nombre,
          producto_imagen: item.imagen,
          producto_slug: item.slug,
        })),
        subtotal,
        costo_envio: finalShippingCost,
        total,

        metodo_pago: paymentMethod,
        ...(isGuest && {
          guest_nombre: `${ident.nombre} ${ident.apellido}`.trim(),
          guest_email: ident.email,
          guest_telefono: ident.telefono || undefined,
        }),
      };

      const orderRes = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order) {
        setError(orderData.error || 'Error al crear el pedido. Por favor intentá de nuevo.');
        return;
      }

      const order = orderData.order;

      // Auto-save address for logged-in users
      if (user && !isGuest && shippingMode === 'domicilio') {
        try {
          const existingMatch = savedAddresses.find(
            (a) =>
              a.codigo_postal === codigoPostal &&
              a.calle.toLowerCase() === direccion.calle.toLowerCase() &&
              a.numero === direccion.numero
          );

          if (!existingMatch) {
            await createAddress({
              usuario_id: user.id,
              etiqueta: 'Casa',
              nombre_destinatario: direccion.destinatario,
              calle: direccion.calle,
              numero: direccion.numero,
              piso_depto: direccion.piso_depto || null,
              ciudad: direccion.localidad,
              provincia,
              codigo_postal: codigoPostal,
              pais: 'Argentina',
              telefono: ident.telefono || null,
              indicaciones: null,
              es_predeterminada: savedAddresses.length === 0,
            });
          }
        } catch (err) {
          console.error('Error auto-saving address:', err);
        }
      }

      // MercadoPago redirect
      if (paymentMethod === 'mercadopago') {
        const payerEmail = ident.email;
        const payerName = `${ident.nombre} ${ident.apellido}`.trim();

        const mpResponse = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            orderNumber: order.numero_pedido,
            items: items.map((item) => ({
              title: item.nombre,
              quantity: item.cantidad,
              unit_price: item.precio,
              picture_url: item.imagen || undefined,
            })),
            shipping: finalShippingCost,
            total,
            payerEmail,
            payerName,
          }),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok || !mpData.id) {
          setError('Error al conectar con MercadoPago. Intentá de nuevo.');
          return;
        }

        clearCart();
        window.location.href =
          mpData.mode === 'sandbox'
            ? mpData.sandbox_init_point || mpData.init_point
            : mpData.init_point || mpData.sandbox_init_point;
        return;
      }

      // Bank transfer → confirmation page
      clearCart();
      router.push(`/checkout/confirmacion?order=${order.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear el pedido. Por favor intentá de nuevo.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // =============================================
  // LOADING & EMPTY STATES
  // =============================================

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-20 px-4 py-12 max-w-4xl mx-auto text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-medium mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-6">Agregá productos para continuar con la compra</p>
        <Link
          href="/colecciones"
          className="inline-block px-8 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors"
        >
          Ver Colecciones
        </Link>
      </div>
    );
  }

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
          Ir al inicio
        </Link>

        {/* Progress Bar */}
        <ProgressBar
          currentStep={currentStep}
          stepsCompleted={[step1Done, step2Done, step3Done]}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ============================== */}
          {/* LEFT COLUMN: Steps */}
          {/* ============================== */}
          <div className="lg:col-span-2 space-y-4">
            {/* =================== STEP 1: IDENTIFICACIÓN =================== */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <StepHeader
                number={1}
                title="IDENTIFICACIÓN"
                isCompleted={step1Done}
                isActive={currentStep === 1}
                onEdit={handleStep1Edit}
              />

              {step1Done && currentStep !== 1 ? (
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-800">{ident.email}</p>
                  <p className="text-sm text-gray-600">
                    {ident.nombre} {ident.apellido}
                  </p>
                  {ident.telefono && (
                    <p className="text-sm text-gray-600">{ident.telefono}</p>
                  )}
                </div>
              ) : currentStep === 1 ? (
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Ingresa correo</label>
                    <input
                      type="email"
                      value={ident.email}
                      onChange={(e) => setIdent({ ...ident, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={ident.nombre}
                        onChange={(e) => setIdent({ ...ident, nombre: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={ident.apellido}
                        onChange={(e) => setIdent({ ...ident, apellido: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                        placeholder="Apellido"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Teléfono / Móvil</label>
                    <input
                      type="tel"
                      value={ident.telefono}
                      onChange={(e) => setIdent({ ...ident, telefono: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  {step1Error && (
                    <p className="text-red-500 text-sm">{step1Error}</p>
                  )}

                  <button
                    onClick={handleStep1Submit}
                    className="px-6 py-2.5 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Ir al envío
                  </button>
                </div>
              ) : null}
            </div>

            {/* =================== STEP 2: ENVÍO =================== */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <StepHeader
                number={2}
                title="ENVÍO"
                isCompleted={step2Done}
                isActive={currentStep === 2}
                onEdit={handleStep2Edit}
              />

              {step2Done && currentStep !== 2 ? (
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-600 mb-1">
                    {shippingLabel} — {shippingEtaLabel}
                  </p>
                  {shippingMode === 'sucursal_correo' && selectedBranch ? (
                    <>
                      <p className="text-sm font-medium text-gray-800">{selectedBranch.nombre}</p>
                      <p className="text-sm text-gray-800">{selectedBranch.direccion}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {selectedBranch.localidad_nombre}, {selectedBranch.provincia_nombre}
                          {selectedBranch.codigo_postal ? ` - CP ${selectedBranch.codigo_postal}` : ''}
                        </p>
                        <span className="text-sm font-medium">{formatPrice(finalShippingCost)}</span>
                      </div>
                      {selectedBranch.horarios && (
                        <p className="text-xs text-gray-500">{selectedBranch.horarios}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800">
                        {direccion.calle} {direccion.numero}
                        {direccion.piso_depto && `, ${direccion.piso_depto}`}
                      </p>
                      <p className="text-sm text-gray-800">{codigoPostal}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {direccion.localidad}, {provinciaDetectada}
                        </p>
                        <span className="text-sm font-medium">
                          {formatPrice(finalShippingCost)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : currentStep === 2 ? (
                <div className="px-6 py-5 space-y-5">
                  {/* Postal code input */}
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Código postal</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={codigoPostal}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setCodigoPostal(val);
                          setSelectedBranch(null);
                          setStep2Done(false);
                          setStep3Done(false);
                          if (val.length < 4) {
                            setPostalValidated(false);
                            setProvinciaDetectada('');
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm ${
                          postalValidated && provinciaDetectada
                            ? 'border-green-400'
                            : postalError
                            ? 'border-red-400'
                            : 'border-gray-300'
                        }`}
                        placeholder="Ej: 4000"
                        maxLength={4}
                        inputMode="numeric"
                      />
                      {postalValidated && provinciaDetectada && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {postalError && (
                      <p className="text-red-500 text-xs mt-1">{postalError}</p>
                    )}
                    <a
                      href="https://www.correoargentino.com.ar/formularios/cpa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-foreground mt-1"
                    >
                      No sé mi código postal
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Shipping method */}
                  {postalValidated && provinciaDetectada && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-gray-500 mb-2">Método de entrega</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShippingMode('domicilio');
                            setStep2Done(false);
                            setStep3Done(false);
                            setStep2Error('');
                          }}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            shippingMode === 'domicilio'
                              ? 'border-foreground bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <div className={`h-4 w-4 rounded-full border-4 ${shippingMode === 'domicilio' ? 'border-foreground' : 'border-gray-300'}`} />
                            <p className="font-medium text-sm">Envío a domicilio</p>
                          </div>
                          <p className="text-xs text-gray-500">{SHIPPING_DAYS} días hábiles aprox.</p>
                          {freeShippingApplied && (
                            <p className="mt-2 text-xs font-medium text-green-600">Envío gratis aplicado</p>
                          )}
                          <p className="mt-2 text-sm font-medium">{formatPrice(domicilioShippingCost)}</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShippingMode('sucursal_correo');
                            setStep2Done(false);
                            setStep3Done(false);
                            setStep2Error('');
                          }}
                          className={`rounded-lg border p-4 text-left transition-colors ${
                            shippingMode === 'sucursal_correo'
                              ? 'border-foreground bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <div className={`h-4 w-4 rounded-full border-4 ${shippingMode === 'sucursal_correo' ? 'border-foreground' : 'border-gray-300'}`} />
                            <p className="font-medium text-sm">Envío a sucursal</p>
                          </div>
                          <p className="text-xs text-gray-500">Retirá en la sucursal que prefieras segun tu codigo postal.</p>
                          {freeShippingApplied && (
                            <p className="mt-2 text-xs font-medium text-green-600">Envío gratis aplicado</p>
                          )}
                          <p className="mt-2 text-sm font-medium">{formatPrice(branchShippingCost)}</p>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Address fields */}
                  {postalValidated && provinciaDetectada && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="space-y-4"
                    >
                      <p className="text-sm text-gray-500">
                        {shippingMode === 'sucursal_correo'
                          ? 'Elegí la sucursal donde querés retirar tu pedido.'
                          : 'Completá tu dirección de entrega.'}
                      </p>

                      {/* Province auto-detected */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{provinciaDetectada}</span>
                        <span className="text-sm text-gray-400">-</span>
                        {!showProvinciaSelector ? (
                          <button
                            onClick={() => setShowProvinciaSelector(true)}
                            className="text-sm font-semibold text-foreground hover:underline"
                          >
                            Cambiar
                          </button>
                        ) : (
                          <select
                            value={provinciaDetectada}
                            onChange={(e) => {
                              setProvinciaDetectada(e.target.value);
                              setSelectedBranch(null);
                              setStep2Done(false);
                              setStep3Done(false);
                              setShowProvinciaSelector(false);
                            }}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            {ARGENTINA_PROVINCES.map((prov) => (
                              <option key={prov} value={prov}>
                                {prov}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {shippingMode === 'sucursal_correo' ? (
                        <CorreoArgentinoBranchSelector
                          postalCode={codigoPostal}
                          province={provinciaDetectada}
                          selectedBranch={selectedBranch}
                          onSelect={(branch: SucursalCorreoSeleccionada) => {
                            setSelectedBranch(branch);
                            setDireccion((current) => ({
                              ...current,
                              localidad: branch.localidad_nombre,
                            }));
                            setStep2Done(false);
                            setStep3Done(false);
                            setStep2Error('');
                          }}
                        />
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Calle</label>
                            <input
                              type="text"
                              value={direccion.calle}
                              onChange={(e) => setDireccion({ ...direccion, calle: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                              placeholder="Av. Corrientes"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-500 mb-1">Número</label>
                              <input
                                type="text"
                                value={direccion.numero}
                                onChange={(e) => setDireccion({ ...direccion, numero: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                                placeholder="1234"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500 mb-1">Piso/Departamento</label>
                              <input
                                type="text"
                                value={direccion.piso_depto}
                                onChange={(e) => setDireccion({ ...direccion, piso_depto: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                                placeholder="3°A"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-500 mb-1">Localidad</label>
                            <input
                              type="text"
                              value={direccion.localidad}
                              onChange={(e) => setDireccion({ ...direccion, localidad: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                              placeholder="Tu localidad"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm text-gray-500 mb-1">
                          {shippingMode === 'sucursal_correo' ? 'Nombre de quien retira' : 'Destinatario'}
                        </label>
                        <input
                          type="text"
                          value={direccion.destinatario}
                          onChange={(e) => setDireccion({ ...direccion, destinatario: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                          placeholder="Nombre del destinatario"
                        />
                      </div>

                      {step2Error && (
                        <p className="text-red-500 text-sm">{step2Error}</p>
                      )}

                      <button
                        onClick={handleStep2Submit}
                        disabled={!postalValidated}
                        className="px-6 py-2.5 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        Continuar al pago
                      </button>
                    </motion.div>
                  )}

                  {/* Waiting state */}
                  {!postalValidated && !codigoPostal && (
                    <p className="text-sm text-gray-400 italic">
                      Ingresá tu código postal para ver las opciones de envío.
                    </p>
                  )}
                </div>
              ) : currentStep < 2 ? (
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-400 italic text-center">
                    Esperando que se complete la información
                  </p>
                </div>
              ) : null}
            </div>

            {/* =================== STEP 3: PAGO =================== */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <StepHeader
                number={3}
                title="PAGO"
                isCompleted={step3Done}
                isActive={currentStep === 3}
              />

              {currentStep === 3 ? (
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-0 border border-gray-200 rounded-lg overflow-hidden">
                    {/* Payment method tabs */}
                    <div className="flex sm:flex-col border-b sm:border-b-0 sm:border-r border-gray-200">
                      <button
                        onClick={() => handleSelectPaymentMethod('mercadopago')}
                        className={`flex items-center gap-2 px-4 py-4 text-sm transition-colors w-full text-left ${
                          paymentMethod === 'mercadopago'
                            ? 'bg-gray-50 font-medium border-l-2 border-l-foreground'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span>MercadoPago</span>
                      </button>
                      <button
                        onClick={() => handleSelectPaymentMethod('transferencia')}
                        className={`flex items-center gap-2 px-4 py-4 text-sm transition-colors w-full text-left ${
                          paymentMethod === 'transferencia'
                            ? 'bg-gray-50 font-medium border-l-2 border-l-foreground'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span>Transferencia</span>
                      </button>
                    </div>

                    {/* Payment method details */}
                    <div className="p-5">
                      {paymentMethod === 'mercadopago' ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Pagá con tarjeta de crédito o débito</p>
                          <p className="text-sm text-gray-500">
                            Serás redirigido a MercadoPago para completar el pago de forma segura.
                            Aceptamos todas las tarjetas.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <img
                              src="/images/mercadopago-logo.svg"
                              alt="MercadoPago"
                              className="h-6 object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Pagá mediante transferencia bancaria</p>
                          <p className="text-sm text-gray-500">
                            Al confirmar tu pedido, te mostraremos los datos bancarios para realizar
                            la transferencia. Tu pedido será procesado una vez que confirmemos el pago.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-400 italic text-center">
                    Aún falta llenar con los datos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================== */}
          {/* RIGHT COLUMN: Order Summary */}
          {/* ============================== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
              {/* Header */}
              <div className="bg-gray-100 px-6 py-3 flex items-center gap-2">
                <span className="text-sm font-bold uppercase tracking-wide">
                  Resumen de compra
                </span>
                <span className="bg-foreground text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>

              {/* Product list */}
              <div className="px-6 py-4 divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.producto_id}-${item.talle}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      {item.cantidad > 1 && (
                        <span className="absolute -top-1 -right-1 bg-foreground text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {item.cantidad}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.nombre}</p>
                      <p className="text-xs text-gray-500">Talle: {item.talle}</p>
                    </div>
                    <p className="text-sm font-medium whitespace-nowrap">
                      {formatPrice(item.precio * item.cantidad)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="px-6 py-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {step2Done && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Gastos del envío</span>
                    <span>{formatPrice(finalShippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(step2Done ? total : subtotal)}</span>
                </div>
              </div>

              {/* Terms & Finalize */}
              <div className="px-6 py-4 border-t border-gray-200 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 accent-foreground"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    Acepto los{' '}
                    <Link href="/terminos-servicio" className="underline font-medium" target="_blank">
                      Términos y Condiciones
                    </Link>
                  </span>
                </label>

                <button
                  onClick={handleCreateOrder}
                  disabled={!canFinalize}
                  className="w-full py-3.5 bg-foreground text-white text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Finalizar compra'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* GUEST MODALS */}
      {/* ============================== */}

      <AnimatePresence>
        {showGuestPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6 text-center"
            >
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-foreground" />
              <h2 className="text-xl font-medium mb-2">¿Querés registrarte?</h2>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Si creás una cuenta, vas a poder hacer seguimiento de tus pedidos y ver tu historial
                de compras. Recibirás emails con las actualizaciones de tus envíos.
              </p>
              <div className="space-y-3">
                <Link
                  href="/cuenta/registro?redirect=/checkout"
                  className="block w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/cuenta?redirect=/checkout"
                  className="block w-full py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  Ya tengo cuenta
                </Link>
                <button
                  onClick={() => {
                    setShowGuestPrompt(false);
                    setShowGuestWarning(true);
                  }}
                  className="block w-full py-3 text-gray-500 hover:text-foreground transition-colors text-sm underline"
                >
                  Continuar sin registrarme
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuestWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-medium mb-2">Antes de continuar</h2>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Al comprar sin cuenta,{' '}
                <strong>no vas a poder visualizar ni hacer seguimiento de tus pedidos</strong> desde
                la web. Igualmente recibirás emails con las actualizaciones de tu pedido.
              </p>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Si tenés alguna duda sobre tu compra, podés contactarnos a:{' '}
                <a
                  href="mailto:administracion@softworks.com.ar"
                  className="text-foreground font-medium underline"
                >
                  administracion@softworks.com.ar
                </a>
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowGuestWarning(false);
                    setGuestAccepted(true);
                    try {
                      localStorage.setItem('softworks_guest_accepted', 'true');
                    } catch {}
                  }}
                  className="block w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                >
                  Entendido, continuar
                </button>
                <button
                  onClick={() => {
                    setShowGuestWarning(false);
                    setShowGuestPrompt(true);
                  }}
                  className="block w-full py-3 text-gray-500 hover:text-foreground transition-colors text-sm"
                >
                  Volver
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
