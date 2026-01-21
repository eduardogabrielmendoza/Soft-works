'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Check, Loader2, ArrowRight, CreditCard } from 'lucide-react';
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
  const { user, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (user && orderId) {
      loadData();
    }
  }, [user, orderId]);

  const loadData = async () => {
    setIsLoading(true);
    const [orderData, accounts] = await Promise.all([
      getOrderById(orderId!),
      getActiveBankAccounts(),
    ]);
    setOrder(orderData);
    setBankAccounts(accounts);
    setIsLoading(false);
  };

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
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

  return (
    <div className="pt-20 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Success Header */}
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

          {/* Payment Instructions */}
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

          {/* Next Steps */}
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
                    Verificaremos tu pago en un plazo de 24-48 horas hábiles y te notificaremos por email.
                  </p>
                </div>
              </div>
            </div>
          </div>

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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/cuenta/pedidos/${order.id}`}
              className="flex-1 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              Subir Comprobante
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cuenta/pedidos"
              className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-center"
            >
              Ver Mis Pedidos
            </Link>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Te enviamos un email con los detalles de tu pedido a{' '}
            <span className="font-medium">{order.cliente_email}</span>
          </p>
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
