'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Package, LogOut, Loader2, Eye, ChevronRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getOrdersByUser } from '@/lib/api/orders';
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils/helpers';
import type { OrderWithItems } from '@/lib/types/database.types';

export default function PedidosPage() {
  const router = useRouter();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadOrders();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  const loadOrders = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getOrdersByUser();
    setOrders(data);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
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
        <h1 className="text-3xl lg:text-4xl font-medium mb-8">Mi Cuenta</h1>

        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-200 pb-4">
          <Link
            href="/cuenta/perfil"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4" />
            Perfil
          </Link>
          <Link
            href="/cuenta/pedidos"
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded-md"
          >
            <Package className="w-4 h-4" />
            Mis Pedidos
          </Link>
          <Link
            href="/cuenta/direcciones"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Direcciones
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors ml-auto"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Todavía no tenés pedidos</p>
              <Link
                href="/colecciones"
                className="inline-block px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors"
              >
                Ver Colecciones
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/cuenta/pedidos/${order.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-lg">{order.numero_pedido}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.fecha_creacion)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.estado)}`}>
                      {getOrderStatusLabel(order.estado)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Items Preview */}
                <div className="flex items-center gap-4 mb-4">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div
                      key={item.id}
                      className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden"
                    >
                      {item.producto_imagen ? (
                        <img
                          src={item.producto_imagen}
                          alt={item.producto_nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">{index + 1}</span>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{order.items.length - 3}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                  </span>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </div>

                {/* Action required indicator */}
                {order.estado === 'pendiente_pago' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                    ⚠️ Acción requerida: Subir comprobante de pago
                  </div>
                )}
                {order.estado === 'pago_rechazado' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                    ❌ Pago rechazado - Ver detalles
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
