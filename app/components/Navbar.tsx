'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLayoutContent } from '@/lib/hooks/useLayoutContent';
import SearchDrawer from './SearchDrawer';
import CartDrawer from './CartDrawer';
import AnnouncementBar from './AnnouncementBar';

// Altura de la barra de anuncios (incluye mt-2)
const ANNOUNCEMENT_HEIGHT = 44; // 36px altura + 8px margin-top

// Estados del header
type HeaderState = 'transparent' | 'hidden' | 'solid';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  
  // Smart sticky state
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const pathname = usePathname();
  
  // Detectar si estamos en la home para el estilo transparente inicial
  const isHomePage = pathname === '/';
  const isInAdminArea = pathname?.startsWith('/admin');
  
  // Estado inicial: transparente en home, sólido en otras páginas
  // Inicializar directamente basado en la ruta para evitar flash
  const [headerState, setHeaderState] = useState<HeaderState>(() => 
    isHomePage ? 'transparent' : 'solid'
  );
  const { itemCount } = useCart();
  const { user, isAdmin } = useAuth();
  const { layout } = useLayoutContent();

  // Smart sticky behavior con AnnouncementBar
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollThreshold = 100;
    
    // AnnouncementBar: visible solo en scrollY === 0 y fuera de admin
    if (!isInAdminArea) {
      setShowAnnouncement(currentScrollY < 10);
    }
    
    if (currentScrollY < 10) {
      // En el tope absoluto - transparente en home, sólido en otras páginas
      setHeaderState(isHomePage ? 'transparent' : 'solid');
    } else if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
      // Scrolleando hacia abajo - ocultar header
      setHeaderState('hidden');
    } else if (currentScrollY < lastScrollY) {
      // Scrolleando hacia arriba - mostrar header sólido
      setHeaderState('solid');
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY, isHomePage, isInAdminArea]);

  useEffect(() => {
    // Inicializar el estado
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Cerrar menú móvil al cambiar de página
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Determinar qué mostrar en el botón de cuenta
  const getAccountButtonConfig = () => {
    if (!user) {
      return { label: 'Cuenta', href: '/cuenta' };
    }
    if (isAdmin) {
      if (isInAdminArea) {
        return { label: 'Cuenta', href: '/cuenta/perfil' };
      } else {
        return { label: 'Panel Admin', href: '/admin' };
      }
    }
    return { label: 'Cuenta', href: '/cuenta/perfil' };
  };

  const accountButton = getAccountButtonConfig();

  // Navigation links from layout config
  const leftLinks = layout.header.navLinks.map(l => ({ href: l.href, label: l.label }));

  // Determinar estilos basados en el estado
  const isTransparent = isHomePage && headerState === 'transparent';
  const isHidden = headerState === 'hidden';

  const textColorClass = isTransparent 
    ? 'text-white/90 hover:text-white' 
    : 'text-[#545454] hover:text-black';

  const bgClass = isTransparent 
    ? 'bg-transparent' 
    : 'bg-[#F2F0EB]/95 backdrop-blur-md shadow-sm';

  return (
    <>
      {/* Announcement Bar - Oculto en panel admin */}
      {!isInAdminArea && (
        <>
          <AnnouncementBar isVisible={showAnnouncement} />
          {/* Gap elegante entre announcement y header en páginas no-home */}
          {!isHomePage && showAnnouncement && (
            <div className="fixed top-[44px] left-0 right-0 h-4 z-[54] pointer-events-none" />
          )}
        </>
      )}
      
      {/* Header - Debajo de AnnouncementBar o fijo en scroll */}
      <motion.header
        initial={{ y: 0 }}
        animate={{ 
          y: isHidden ? '-100%' : 0,
          top: !isInAdminArea && showAnnouncement && !isHidden ? (isHomePage ? ANNOUNCEMENT_HEIGHT : ANNOUNCEMENT_HEIGHT + 16) : 0
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 right-0 z-50 transition-colors duration-300 ${bgClass}`}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex items-end h-16 lg:h-20 pb-2">
            {/* Left Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-8 flex-1">
              {leftLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors uppercase tracking-wide ${textColorClass}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              } ${isTransparent ? 'text-white' : 'text-gray-700'}`}
              aria-label="Menú"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Center Logo */}
            <Link 
              href="/" 
              className="absolute left-1/2 -translate-x-1/2 flex items-center"
            >
              <div className="relative w-32 h-10 lg:w-40 lg:h-12">
                <Image
                  src={layout.header.logoUrl || '/images/logosoftworks.png'}
                  alt="Softworks"
                  fill
                  className={`object-contain transition-all duration-300 ${
                    isTransparent ? 'brightness-0 invert' : ''
                  }`}
                  priority
                />
              </div>
            </Link>

            {/* Right Navigation - Desktop (Grupo B: acciones) */}
            <div className="hidden lg:flex items-center justify-end space-x-8 flex-1">
              {/* Cuenta/Admin */}
              <Link
                href={accountButton.href}
                className={`text-sm font-medium transition-colors uppercase tracking-wide ${textColorClass}`}
              >
                {accountButton.label}
              </Link>
              
              {/* Buscar */}
              <button
                onClick={() => setShowSearchDrawer(true)}
                className={`text-sm font-medium transition-colors uppercase tracking-wide ${textColorClass}`}
              >
                Buscar
              </button>
              
              {/* Carrito */}
              <button
                onClick={() => setShowCartDrawer(true)}
                className={`text-sm font-medium transition-colors uppercase tracking-wide relative flex items-center gap-1 ${textColorClass}`}
              >
                Carrito
                {itemCount > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full font-medium ${
                    isTransparent ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Right Actions */}
            <div className="lg:hidden flex items-center space-x-1 ml-auto">
              <button
                onClick={() => setShowSearchDrawer(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isTransparent ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-label="Buscar"
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCartDrawer(true)}
                className={`p-2 rounded-lg transition-colors relative ${
                  isTransparent ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-label="Carrito"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[10px] rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
              onClick={() => setIsMenuOpen(false)} 
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ top: showAnnouncement ? 64 + ANNOUNCEMENT_HEIGHT : 64 }}
              className="absolute left-0 right-0 bg-[#F2F0EB] shadow-xl border-b border-[#E8DED3]"
            >
              <nav className="px-6 py-6 space-y-1">
                {leftLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 text-base font-medium text-[#545454] hover:text-black transition-colors uppercase tracking-wide"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t border-[#E8DED3] mt-4">
                  <Link
                    href={accountButton.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 text-base font-medium text-[#545454] hover:text-black transition-colors uppercase tracking-wide"
                  >
                    {accountButton.label}
                  </Link>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Drawers */}
      <SearchDrawer 
        isOpen={showSearchDrawer} 
        onClose={() => setShowSearchDrawer(false)} 
      />
      <CartDrawer 
        isOpen={showCartDrawer} 
        onClose={() => setShowCartDrawer(false)} 
      />
      
      {/* Layout Spacer - Solo en páginas que no sean home */}
      {!isHomePage && (
        <div 
          style={{ 
            height: !isInAdminArea && showAnnouncement 
              ? `calc(64px + ${ANNOUNCEMENT_HEIGHT}px + 16px)` 
              : '64px' 
          }}
          className="lg:h-20"
        />
      )}
    </>
  );
}
