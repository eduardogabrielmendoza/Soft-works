'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showHeader?: boolean;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export default function SideDrawer({
  isOpen,
  onClose,
  title,
  children,
  showHeader = true,
  headerContent,
  footerContent,
  width = 'md',
}: SideDrawerProps) {
  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Panel deslizante */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed top-0 right-0 bottom-0 w-full ${widthClasses[width]} bg-white shadow-2xl z-[70] flex flex-col`}
          >
            {/* Header */}
            {showHeader && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                {headerContent || (
                  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                )}
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

            {/* Footer - Sticky */}
            {footerContent && (
              <div className="border-t border-gray-100 bg-white">
                {footerContent}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Usar portal para evitar conflictos de capas
  if (typeof window === 'undefined') return null;
  
  return createPortal(drawerContent, document.body);
}
