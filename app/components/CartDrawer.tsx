'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus, Trash2, Truck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SideDrawer from './SideDrawer';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/helpers';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Umbral para envío gratis
const FREE_SHIPPING_THRESHOLD = 100000;

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  // Calcular progreso para envío gratis
  const freeShippingProgress = useMemo(() => {
    const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
    return { progress, remaining, achieved: subtotal >= FREE_SHIPPING_THRESHOLD };
  }, [subtotal]);

  // Header personalizado con contador
  const headerContent = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#545454] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
            {itemCount}
          </span>
        )}
      </div>
      <span className="font-semibold text-lg">Tu Carrito</span>
    </div>
  );

  // Footer con subtotal y checkout
  const footerContent = items.length > 0 ? (
    <div className="p-6 space-y-4">
      {/* Línea separadora sutil */}
      <div className="flex justify-between items-baseline">
        <span className="text-[#545454]">Subtotal</span>
        <span className="text-xl font-semibold text-[#545454]">{formatPrice(subtotal)}</span>
      </div>
      <p className="text-xs text-[#545454]/70 text-center">
        Los impuestos y el envío se calculan en el checkout
      </p>
      <Link
        href="/checkout"
        onClick={onClose}
        className="flex items-center justify-center gap-2 w-full py-4 bg-[#545454] text-[#F2F0EB] rounded-xl hover:bg-[#3a3a3a] transition-colors font-medium group"
      >
        Finalizar Compra
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
      <button
        onClick={onClose}
        className="block w-full py-3 text-[#545454] hover:text-black transition-colors text-sm"
      >
        Seguir Comprando
      </button>
    </div>
  ) : null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      headerContent={headerContent}
      footerContent={footerContent}
      width="md"
    >
      {/* Barra de progreso para envío gratis */}
      {items.length > 0 && (
        <div className="px-6 py-4 bg-[#F2F0EB]/30 border-b border-[#545454]/10">
          <div className="flex items-center gap-2 mb-2">
            <Truck className={`w-4 h-4 ${freeShippingProgress.achieved ? 'text-green-600' : 'text-[#545454]/60'}`} />
            {freeShippingProgress.achieved ? (
              <span className="text-sm font-medium text-green-600">
                ¡Envío gratis desbloqueado!
              </span>
            ) : (
              <span className="text-sm text-[#545454]">
                Te faltan <span className="font-semibold">{formatPrice(freeShippingProgress.remaining)}</span> para envío gratis
              </span>
            )}
          </div>
          <div className="h-1.5 bg-[#545454]/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${freeShippingProgress.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${freeShippingProgress.achieved ? 'bg-green-500' : 'bg-[#545454]'}`}
            />
          </div>
        </div>
      )}

      {/* Contenido del carrito */}
      <div className="p-6">
        {items.length === 0 ? (
          // Estado vacío
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#F2F0EB] flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-[#545454]/40" />
            </div>
            <h3 className="text-xl font-medium text-[#545454] mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-[#545454]/70 mb-8 max-w-xs mx-auto">
              Descubrí nuestras colecciones y encontrá tu próximo favorito
            </p>
            <Link
              href="/colecciones"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#545454] text-[#F2F0EB] rounded-full hover:bg-[#3a3a3a] transition-colors font-medium group"
            >
              Ver Colecciones
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ) : (
          // Lista de productos
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.producto_id}-${item.talle}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
              >
                {/* Imagen del producto */}
                <Link
                  href={`/producto/${item.slug}`}
                  onClick={onClose}
                  className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 group"
                >
                  {item.imagen ? (
                    <Image
                      src={item.imagen}
                      alt={item.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </Link>

                {/* Detalles del producto */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={onClose}
                      className="font-medium text-gray-900 hover:text-black line-clamp-1 transition-colors"
                    >
                      {item.nombre}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">Talle: {item.talle}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.producto_id, item.talle, item.cantidad - 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white transition-colors"
                        disabled={item.cantidad <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.producto_id, item.talle, item.cantidad + 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Precio y eliminar */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatPrice(item.precio * item.cantidad)}</span>
                      <button
                        onClick={() => removeItem(item.producto_id, item.talle)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
