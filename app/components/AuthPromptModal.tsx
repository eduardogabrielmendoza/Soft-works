'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'

interface AuthPromptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#F2F0EB] rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Creá tu cuenta
                </h3>
                <p className="text-sm text-foreground/60">
                  Registrate para agregar productos a tu carrito y realizar compras.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/cuenta/registro"
                  onClick={onClose}
                  className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrarse
                </Link>

                <Link
                  href="/cuenta"
                  onClick={onClose}
                  className="w-full py-3 border border-foreground/20 text-foreground rounded-md hover:bg-[#F2F0EB] transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
