'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Minus, Plus, Trash2, MapPin, Truck, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/lib/hooks/useCart';
import { getUserAddresses } from '@/lib/api/addresses';
import { getActiveShippingZones } from '@/lib/api/settings';
import { createOrder } from '@/lib/api/orders';
import { formatPrice } from '@/lib/utils/helpers';
import type { Address, ShippingZone } from '@/lib/types/database.types';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingZone, setSelectedShippingZone] = useState<ShippingZone | null>(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/cuenta?redirect=/checkout');
    }
  }, [authLoading, user, router]);

  // Load addresses and shipping zones
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((a) => a.es_predeterminada) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  // Auto-select shipping zone based on address province
  useEffect(() => {
    if (selectedAddressId && shippingZones.length > 0) {
      const address = addresses.find((a) => a.id === selectedAddressId);
      if (address) {
        // Try to find a matching zone for the province
        const matchingZone = shippingZones.find((z) =>
          z.provincias.includes(address.provincia)
        );
        // If no match, check for "Nacional" or similar catch-all zone
        const defaultZone = shippingZones.find((z) => z.activa) || shippingZones[0];
        setSelectedShippingZone(matchingZone || defaultZone);
      }
    }
  }, [selectedAddressId, addresses, shippingZones]);

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

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const shippingCost = selectedShippingZone?.precio || 0;
  const freeShippingThreshold = selectedShippingZone?.envio_gratis_minimo;
  const isFreeShipping = freeShippingThreshold && subtotal >= freeShippingThreshold;
  const finalShippingCost = isFreeShipping ? 0 : shippingCost;
  const total = subtotal + finalShippingCost;

  const handleCreateOrder = async () => {
    if (!selectedAddressId || !selectedAddress || items.length === 0) {
      setError('Por favor seleccioná una dirección de envío');
      return;
    }

    setIsCreatingOrder(true);
    setError(null);

    try {
      const orderData = {
        direccion_envio: {
          nombre_destinatario: selectedAddress.nombre_destinatario,
          calle: selectedAddress.calle,
          numero: selectedAddress.numero,
          piso_depto: selectedAddress.piso_depto || undefined,
          ciudad: selectedAddress.ciudad,
          provincia: selectedAddress.provincia,
          codigo_postal: selectedAddress.codigo_postal,
          telefono: selectedAddress.telefono || undefined,
        },
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
      };

      const order = await createOrder(orderData);

      if (order) {
        clearCart();
        router.push(`/checkout/confirmacion?order=${order.id}`);
      } else {
        setError('Error al crear el pedido. Por favor intentá de nuevo.');
      }
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

                {addresses.length === 0 ? (
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

                {/* Payment Method Info */}
                <div className="bg-gray-50 rounded-md p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Método de Pago</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Transferencia Bancaria. Después de confirmar tu pedido, te mostraremos los datos para realizar la transferencia.
                  </p>
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder || !selectedAddressId || items.length === 0}
                  className="w-full py-4 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-medium"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
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
    </div>
  );
}
