'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Loader2, Minus, Plus, Trash2, MapPin, Truck, CreditCard, ShoppingBag, Building2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/lib/hooks/useCart';
import { getUserAddresses } from '@/lib/api/addresses';
import { getActiveShippingZones } from '@/lib/api/settings';
import { formatPrice } from '@/lib/utils/helpers';
import type { Address, ShippingZone, MetodoPago } from '@/lib/types/database.types';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingZone, setSelectedShippingZone] = useState<ShippingZone | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('mercadopago');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest checkout state
  const isGuest = !authLoading && !user;
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [guestAccepted, setGuestAccepted] = useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem('softworks_guest_accepted') === 'true'; } catch { return false; }
  });
  const [guestInfo, setGuestInfo] = useState({
    nombre: '',
    email: '',
    telefono: '',
    calle: '',
    numero: '',
    piso_depto: '',
    ciudad: '',
    provincia: '',
    codigo_postal: '',
  });

  // Show guest prompt when unauthenticated user arrives
  const guestPromptShownRef = useRef(false);
  useEffect(() => {
    if (!authLoading && !user && !guestAccepted && !guestPromptShownRef.current) {
      guestPromptShownRef.current = true;
      setShowGuestPrompt(true);
    }
  }, [authLoading, user, guestAccepted]);

  // Load addresses and shipping zones
  useEffect(() => {
    if (user) {
      loadData();
    } else if (!authLoading) {
      // Guest: only load shipping zones
      loadGuestData();
    }
  }, [user, authLoading]);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((a) => a.es_predeterminada) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  // Auto-select shipping zone based on address province
  useEffect(() => {
    const province = isGuest ? guestInfo.provincia : addresses.find((a) => a.id === selectedAddressId)?.provincia;
    if (province && shippingZones.length > 0) {
      const matchingZone = shippingZones.find((z) =>
        z.provincias.includes(province)
      );
      const defaultZone = shippingZones.find((z) => z.activa) || shippingZones[0];
      setSelectedShippingZone(matchingZone || defaultZone);
    }
  }, [selectedAddressId, addresses, shippingZones, isGuest, guestInfo.provincia]);

  const loadData = async () => {
    setIsLoading(true);
    const [addressData, zonesData] = await Promise.all([
      getUserAddresses(user!.id),
      getActiveShippingZones(),
    ]);
    setAddresses(addressData);
    setShippingZones(zonesData);
    setIsLoading(false);
  };

  const loadGuestData = async () => {
    setIsLoading(true);
    const zonesData = await getActiveShippingZones();
    setShippingZones(zonesData);
    setIsLoading(false);
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const shippingCost = selectedShippingZone?.precio || 0;
  const freeShippingThreshold = selectedShippingZone?.envio_gratis_minimo;
  const isFreeShipping = freeShippingThreshold && subtotal >= freeShippingThreshold;
  const finalShippingCost = isFreeShipping ? 0 : shippingCost;
  const total = subtotal + finalShippingCost;

  const handleCreateOrder = async () => {
    if (isGuest) {
      // Validate guest fields
      if (!guestInfo.nombre || !guestInfo.email || !guestInfo.calle || !guestInfo.numero || !guestInfo.ciudad || !guestInfo.provincia || !guestInfo.codigo_postal) {
        setError('Por favor completá todos los campos de envío');
        return;
      }
    } else if (!selectedAddressId || !selectedAddress) {
      setError('Por favor seleccioná una dirección de envío');
      return;
    }

    if (items.length === 0) return;

    setIsCreatingOrder(true);
    setError(null);

    try {
      const direccion_envio = isGuest
        ? {
            nombre_destinatario: guestInfo.nombre,
            calle: guestInfo.calle,
            numero: guestInfo.numero,
            piso_depto: guestInfo.piso_depto || undefined,
            ciudad: guestInfo.ciudad,
            provincia: guestInfo.provincia,
            codigo_postal: guestInfo.codigo_postal,
            telefono: guestInfo.telefono || undefined,
          }
        : {
            nombre_destinatario: selectedAddress!.nombre_destinatario,
            calle: selectedAddress!.calle,
            numero: selectedAddress!.numero,
            piso_depto: selectedAddress!.piso_depto || undefined,
            ciudad: selectedAddress!.ciudad,
            provincia: selectedAddress!.provincia,
            codigo_postal: selectedAddress!.codigo_postal,
            telefono: selectedAddress!.telefono || undefined,
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
        customer_notes: customerNotes || undefined,
        shipping_zone_id: selectedShippingZone?.id,
        metodo_pago: paymentMethod,
        ...(isGuest && {
          guest_nombre: guestInfo.nombre,
          guest_email: guestInfo.email,
          guest_telefono: guestInfo.telefono || undefined,
        }),
      };

      // Use server API for order creation (supports both guest and auth)
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

      // If MercadoPago, create preference and redirect to MP checkout
      if (paymentMethod === 'mercadopago') {
        const payerEmail = isGuest ? guestInfo.email : (profile?.email || user?.email || '');
        const payerName = isGuest ? guestInfo.nombre : (profile ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() : '');

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

        // Clear cart and redirect to MercadoPago
        clearCart();
        window.location.href = mpData.mode === 'sandbox'
          ? (mpData.sandbox_init_point || mpData.init_point)
          : (mpData.init_point || mpData.sandbox_init_point);
        return;
      }

      // For bank transfer, redirect to confirmation
      clearCart();
      router.push(`/checkout/confirmacion?order=${order.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Error al crear el pedido. Por favor intentá de nuevo.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

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
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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

  return (
    <div className="pt-20 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back link */}
          <Link
            href="/colecciones"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Seguir comprando
          </Link>

          <h1 className="text-2xl lg:text-3xl font-medium mb-8">Checkout</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Productos ({itemCount})
                </h2>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={`${item.producto_id}-${item.talle}`} className="py-4 flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.imagen ? (
                          <img
                            src={item.imagen}
                            alt={item.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/producto/${item.slug}`}
                          className="font-medium hover:underline"
                        >
                          {item.nombre}
                        </Link>
                        <p className="text-sm text-gray-500">Talla: {item.talle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.producto_id, item.talle, item.cantidad - 1)}
                            className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(item.producto_id, item.talle, item.cantidad + 1)}
                            className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.precio * item.cantidad)}</p>
                        <button
                          onClick={() => removeItem(item.producto_id, item.talle)}
                          className="text-gray-400 hover:text-red-500 mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección de Envío
                </h2>

                {isGuest ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                        <input
                          type="text"
                          value={guestInfo.nombre}
                          onChange={(e) => setGuestInfo({ ...guestInfo, nombre: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="tu@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="tel"
                          value={guestInfo.telefono}
                          onChange={(e) => setGuestInfo({ ...guestInfo, telefono: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="+54 11 1234-5678"
                        />
                      </div>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calle *</label>
                        <input
                          type="text"
                          value={guestInfo.calle}
                          onChange={(e) => setGuestInfo({ ...guestInfo, calle: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="Av. Corrientes"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                        <input
                          type="text"
                          value={guestInfo.numero}
                          onChange={(e) => setGuestInfo({ ...guestInfo, numero: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="1234"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Piso/Depto</label>
                        <input
                          type="text"
                          value={guestInfo.piso_depto}
                          onChange={(e) => setGuestInfo({ ...guestInfo, piso_depto: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="3°A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                        <input
                          type="text"
                          value={guestInfo.ciudad}
                          onChange={(e) => setGuestInfo({ ...guestInfo, ciudad: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="CABA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                        <input
                          type="text"
                          value={guestInfo.provincia}
                          onChange={(e) => setGuestInfo({ ...guestInfo, provincia: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="Buenos Aires"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
                        <input
                          type="text"
                          value={guestInfo.codigo_postal}
                          onChange={(e) => setGuestInfo({ ...guestInfo, codigo_postal: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                          placeholder="C1000"
                        />
                      </div>
                    </div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">No tenés direcciones guardadas</p>
                    <Link
                      href="/cuenta/direcciones?redirect=/checkout"
                      className="inline-block px-6 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors"
                    >
                      Agregar Dirección
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-foreground bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">{address.nombre_destinatario}</p>
                            <p className="text-sm text-gray-600">
                              {address.calle} {address.numero}
                              {address.piso_depto && `, ${address.piso_depto}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.ciudad}, {address.provincia} - CP {address.codigo_postal}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                    <Link
                      href="/cuenta/direcciones?redirect=/checkout"
                      className="block text-center text-sm text-foreground hover:underline mt-4"
                    >
                      + Agregar otra dirección
                    </Link>
                  </div>
                )}
              </div>

              {/* Shipping Method */}
              {shippingZones.length > 0 && selectedAddress && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Método de Envío
                  </h2>
                  <div className="space-y-3">
                    {shippingZones.map((zone) => (
                      <label
                        key={zone.id}
                        className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedShippingZone?.id === zone.id
                            ? 'border-foreground bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              value={zone.id}
                              checked={selectedShippingZone?.id === zone.id}
                              onChange={() => setSelectedShippingZone(zone)}
                            />
                            <div>
                              <p className="font-medium">{zone.nombre}</p>
                              <p className="text-sm text-gray-500">
                                {zone.dias_estimados_min}-{zone.dias_estimados_max} días hábiles
                              </p>
                              {zone.envio_gratis_minimo && (
                                <p className="text-sm text-green-600">
                                  Envío gratis en compras mayores a {formatPrice(zone.envio_gratis_minimo)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {zone.envio_gratis_minimo && subtotal >= zone.envio_gratis_minimo ? (
                              <span className="text-green-600 font-medium">Gratis</span>
                            ) : (
                              <span className="font-medium">{formatPrice(zone.precio)}</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4">Notas del Pedido (opcional)</h2>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                  placeholder="¿Alguna indicación especial para tu pedido?"
                />
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
                <h2 className="text-lg font-medium mb-4">Resumen del Pedido</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({itemCount} productos)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    {isFreeShipping ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      <span>{formatPrice(shippingCost)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-lg font-medium pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Método de Pago</span>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'mercadopago'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="mercadopago"
                          checked={paymentMethod === 'mercadopago'}
                          onChange={() => setPaymentMethod('mercadopago')}
                          className="accent-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Tarjeta de Crédito / Débito</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Pagá de forma segura con MercadoPago
                          </p>
                        </div>
                        <img
                          src="/images/mercadopago-logo.svg"
                          alt="MercadoPago"
                          className="h-6 object-contain"
                        />
                      </div>
                    </label>
                    <label
                      className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'transferencia'
                          ? 'border-foreground bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transferencia"
                          checked={paymentMethod === 'transferencia'}
                          onChange={() => setPaymentMethod('transferencia')}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-sm">Transferencia Bancaria</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Te mostraremos los datos para transferir
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder || (!isGuest && !selectedAddressId) || items.length === 0}
                  className="w-full py-4 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-medium"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : paymentMethod === 'mercadopago' ? (
                    'Pagar con MercadoPago'
                  ) : (
                    'Confirmar Pedido'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Al confirmar, aceptás nuestros{' '}
                  <Link href="/terminos-servicio" className="underline">
                    términos y condiciones
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Guest Checkout Prompt Modal - Step 1 */}
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
                Si creás una cuenta, vas a poder hacer seguimiento de tus pedidos y ver tu historial de compras. Recibirás emails con las actualizaciones de tus envíos.
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
                  onClick={() => { setShowGuestPrompt(false); setShowGuestWarning(true); }}
                  className="block w-full py-3 text-gray-500 hover:text-foreground transition-colors text-sm underline"
                >
                  Continuar sin registrarme
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest Checkout Warning Modal - Step 2 */}
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
                Al comprar sin cuenta, <strong>no vas a poder visualizar ni hacer seguimiento de tus pedidos</strong> desde la web. Igualmente recibirás emails con las actualizaciones de tu pedido.
              </p>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Si tenés alguna duda sobre tu compra, podés contactarnos a:{' '}
                <a href="mailto:administracion@softworks.com.ar" className="text-foreground font-medium underline">
                  administracion@softworks.com.ar
                </a>
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setShowGuestWarning(false); setGuestAccepted(true); try { localStorage.setItem('softworks_guest_accepted', 'true'); } catch {} }}
                  className="block w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                >
                  Entendido, continuar
                </button>
                <button
                  onClick={() => { setShowGuestWarning(false); setShowGuestPrompt(true); }}
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
