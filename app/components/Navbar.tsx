'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag, Search as SearchIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLayoutContent } from '@/lib/hooks/useLayoutContent';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';
import { SectionButton } from './CustomSections';
import SearchDrawer from './SearchDrawer';
import CartDrawer from './CartDrawer';
import AdminChatIcon from './AdminChatIcon';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef(0);
  
  const pathname = usePathname();
  
  const isHomePage = pathname === '/';
  const isInAdminArea = pathname?.startsWith('/admin');

  const { itemCount } = useCart();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { layout } = useLayoutContent();


  // Cerrar menú móvil al cambiar de página
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Hide header on scroll down, show near top
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 100) {
          setHeaderHidden(false);
        } else if (y > lastScrollY.current && y > 100) {
          setHeaderHidden(true);
          setIsMenuOpen(false);
        }
        lastScrollY.current = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

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
  const leftLinks = layout.header.navLinks.map(l => ({ href: l.href, label: l.label, id: l.id }));

  const textColorClass = 'text-[#545454] hover:text-black';

  return (
    <>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-[#F2F0EB]/95 backdrop-blur-md shadow-sm transition-transform duration-300 ease-in-out"
        style={{ transform: headerHidden ? 'translateY(-100%)' : 'translateY(0)' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex items-center h-16 lg:h-[72px]">
            {/* Left Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-8 flex-1">
              {leftLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors uppercase tracking-wide ${textColorClass}`}
                  style={textStyleCSS(layout.textStyles, `nav-${link.id}`)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Header CTA buttons */}
              {layout.header.buttons && layout.header.buttons.length > 0 && (
                <div className={`flex items-center gap-3 ${BTN_ALIGN_CLASS[layout.header.buttonAlignment || 'left']}`}>
                  {layout.header.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
              aria-label="Menú"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Center Logo */}
              <>
                {/* Desktop logo */}
                <Link
                  href="/"
                  className="absolute left-1/2 hidden lg:flex items-center"
                  style={{
                    transform: `translateX(calc(-50% + ${layout.header.logoOffsetX ?? 0}px)) translateY(${layout.header.logoOffsetY ?? 0}px)`,
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: `${(layout.header.logoScale ?? 100) * 2.08}px`,
                      height: `${(layout.header.logoScale ?? 100) * 0.64}px`,
                    }}
                  >
                    {layout.header.logoUrl ? (
                    <img
                      src={layout.header.logoUrl}
                      alt="Softworks"
                      fetchPriority="high"
                      decoding="sync"
                      className="absolute inset-0 w-full h-full object-contain brightness-0"
                    />
                    ) : (
                      <span className="font-bold text-lg text-black">SOFTWORKS</span>
                    )}
                  </div>
                </Link>
                {/* Mobile logo */}
                <Link
                  href="/"
                  className="absolute left-1/2 flex lg:hidden items-center"
                  style={{
                    transform: `translateX(calc(-50% + ${layout.header.mobileLogoOffsetX ?? 0}px)) translateY(${layout.header.mobileLogoOffsetY ?? 0}px)`,
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: `${(layout.header.mobileLogoScale ?? 100) * 2.08}px`,
                      height: `${(layout.header.mobileLogoScale ?? 100) * 0.64}px`,
                    }}
                  >
                    {layout.header.logoUrl ? (
                    <img
                      src={layout.header.logoUrl}
                      alt="Softworks"
                      fetchPriority="high"
                      decoding="sync"
                      className="absolute inset-0 w-full h-full object-contain brightness-0"
                    />
                    ) : (
                      <span className="font-bold text-lg text-black">SOFTWORKS</span>
                    )}
                  </div>
                </Link>
              </>

            {/* Right Navigation - Desktop (Grupo B: acciones) */}
            <div className="hidden lg:flex items-center justify-end space-x-8 flex-1">
              {/* Cuenta/Admin */}
              {!authLoading && (
                <Link
                  href={accountButton.href}
                  className={`text-sm font-medium transition-colors uppercase tracking-wide ${textColorClass}`}
                >
                  {accountButton.label}
                </Link>
              )}
              
              {!authLoading && user && <AdminChatIcon />}

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
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full font-medium bg-black text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Right Actions */}
            <div className="lg:hidden flex items-center space-x-1 ml-auto">
              {!authLoading && user && <AdminChatIcon />}
              <button
                onClick={() => setShowSearchDrawer(true)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
                aria-label="Buscar"
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCartDrawer(true)}
                className="p-2 rounded-lg transition-colors relative hover:bg-gray-100 text-gray-700"
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
      </header>

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
              style={{ top: 64 }}
              className="absolute left-0 right-0 bg-[#F2F0EB] shadow-xl border-b border-[#E8DED3]"
            >
              <nav className="px-6 py-6 space-y-1">
                {leftLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 text-base font-medium text-[#545454] hover:text-black transition-colors uppercase tracking-wide"
                    style={textStyleCSS(layout.textStyles, `nav-${link.id}`)}
                  >
                    {link.label}
                  </Link>
                ))}
                {/* Header CTA buttons - mobile */}
                {layout.header.buttons && layout.header.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E8DED3] mt-4">
                    {layout.header.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
                  </div>
                )}
                <div className="pt-4 border-t border-[#E8DED3] mt-4">
                  {!authLoading && (
                    <Link
                      href={accountButton.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3 text-base font-medium text-[#545454] hover:text-black transition-colors uppercase tracking-wide"
                    >
                      {accountButton.label}
                    </Link>
                  )}
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
      
      {/* Layout Spacer */}
      {!isHomePage && (
        <div className="h-16 lg:h-[72px]" />
      )}
    </>
  );
}
