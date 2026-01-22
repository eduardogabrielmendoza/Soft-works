'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag, Search as SearchIcon, Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatPrice } from '@/lib/utils/helpers';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const pathname = usePathname();
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const { user, isAdmin } = useAuth();

  // Control de visibilidad del navbar en scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Cerca del top, siempre mostrar
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolleando hacia abajo, ocultar
        setIsVisible(false);
      } else {
        // Scrolleando hacia arriba, mostrar
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Determinar si estamos en el área de admin o de cuenta
  const isInAdminArea = pathname?.startsWith('/admin');
  const isInAccountArea = pathname?.startsWith('/cuenta');

  // Determinar qué mostrar en el botón
  const getAccountButtonConfig = () => {
    if (!user) {
      return { label: 'Cuenta', href: '/cuenta' };
    }
    if (isAdmin) {
      // Si es admin, mostrar el botón opuesto a donde está
      if (isInAdminArea) {
        return { label: 'Cuenta', href: '/cuenta/perfil' };
      } else {
        return { label: 'Panel Admin', href: '/admin' };
      }
    }
    // Usuario normal
    return { label: 'Cuenta', href: '/cuenta/perfil' };
  };

  const accountButton = getAccountButtonConfig();

  const navLinks = [
    { href: '/colecciones', label: 'Colecciones' },
    { href: '/nosotros', label: 'Nosotros' },
    { href: '/produccion', label: 'Producción' },
  ];

  return (
    <>
      <motion.nav 
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-gray-200"
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 hover:bg-gray-200 rounded transition-colors"
              aria-label="Menú"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>

            {/* Center Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <div className="relative w-32 h-10 lg:w-40 lg:h-12">
                <Image
                  src="/images/logosoftworks.png"
                  alt="Softworks"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center space-x-6">
              <button
                onClick={() => setShowSearchModal(true)}
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                Buscar
              </button>
              <Link
                href={accountButton.href}
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide"
              >
                {accountButton.label}
              </Link>
              <button
                onClick={() => setShowCartModal(true)}
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors uppercase tracking-wide relative"
              >
                Carrito ({itemCount})
              </button>
            </div>

            {/* Mobile Right Actions */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                aria-label="Buscar"
              >
                <SearchIcon className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setShowCartModal(true)}
                className="p-2 hover:bg-gray-200 rounded transition-colors relative"
                aria-label="Carrito"
              >
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-white text-xs rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
                  <X className="w-6 h-6 text-foreground" />
                ) : (

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              className="fixed top-16 left-0 right-0 bg-[#F5F5F0] shadow-lg border-b border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="px-6 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-base font-medium text-gray-700 hover:text-black transition-colors py-2 uppercase tracking-wide"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={accountButton.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base font-medium text-gray-700 hover:text-black transition-colors py-2 uppercase tracking-wide border-t border-gray-300 pt-4"
                >
                  {accountButton.label}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4"
            onClick={() => setShowSearchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-white rounded-lg max-w-2xl w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSearchModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-medium mb-6">Buscar Productos</h3>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-base"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">Productos disponibles:</p>
                {['Camiseta Monkey 01', 'Camiseta Monkey 02', 'Camiseta Monkey 03', 'Hoodie Smoking Billy', 'Gorra Obsessed']
                  .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item, index) => (
                    <Link
                      key={index}
                      href={`/producto/${item.toLowerCase().replaceAll(' ', '-')}`}
                      onClick={() => {
                        setShowSearchModal(false);
                        setSearchQuery('');
                      }}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">{item}</p>
                    </Link>
                  ))}
                {searchQuery && ['Camiseta Monkey 01', 'Camiseta Monkey 02', 'Camiseta Monkey 03', 'Hoodie Smoking Billy', 'Gorra Obsessed']
                  .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No se encontraron productos</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowCartModal(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-medium">Carrito ({itemCount})</h3>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Cart Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                    <Link
                      href="/colecciones"
                      onClick={() => setShowCartModal(false)}
                      className="inline-block px-6 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors"
                    >
                      Ver Colecciones
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={`${item.producto_id}-${item.talle}`}
                        className="flex gap-4 pb-4 border-b border-gray-100"
                      >
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/producto/${item.slug}`}
                            onClick={() => setShowCartModal(false)}
                            className="font-medium hover:underline line-clamp-1"
                          >
                            {item.nombre}
                          </Link>
                          <p className="text-sm text-gray-500">Talla: {item.talle}</p>
                          <p className="font-medium">{formatPrice(item.precio)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.producto_id, item.talle, item.cantidad - 1)}
                              className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm">{item.cantidad}</span>
                            <button
                              onClick={() => updateQuantity(item.producto_id, item.talle, item.cantidad + 1)}
                              className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeItem(item.producto_id, item.talle)}
                              className="ml-auto p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Cart Footer */}
              {items.length > 0 && (
                <div className="border-t border-gray-200 p-6 space-y-4">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    El envío se calcula en el checkout
                  </p>
                  <Link
                    href="/checkout"
                    onClick={() => setShowCartModal(false)}
                    className="block w-full py-3 bg-foreground text-white text-center rounded-md hover:bg-foreground/90 transition-colors font-medium"
                  >
                    Finalizar Compra
                  </Link>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="block w-full py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Seguir Comprando
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
