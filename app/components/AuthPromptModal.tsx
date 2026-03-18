'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'

interface AuthPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onGuestContinue?: () => void
}

export default function AuthPromptModal({ isOpen, onClose, onGuestContinue }: AuthPromptModalProps) {
  const [showWarning, setShowWarning] = useState(false)

  const handleClose = () => {
    setShowWarning(false)
    onClose()
  }

  const handleGuestContinue = () => {
    setShowWarning(false)
    onClose()
    onGuestContinue?.()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
            {!showWarning ? (
              /* Step 1: Register / Login / Guest */
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#F2F0EB] rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    ¿Querés registrarte?
                  </h3>
                  <p className="text-sm text-foreground/60">
                    Si creás una cuenta, vas a poder hacer seguimiento de tus pedidos y recibir notificaciones sobre el estado de tu envío.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/cuenta/registro"
                    onClick={handleClose}
                    className="w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Registrarse
                  </Link>

                  <Link
                    href="/cuenta"
                    onClick={handleClose}
                    className="w-full py-3 border border-foreground/20 text-foreground rounded-md hover:bg-[#F2F0EB] transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Ya tengo cuenta
                  </Link>

                  {onGuestContinue && (
                    <button
                      type="button"
                      onClick={() => setShowWarning(true)}
                      className="block w-full py-3 text-gray-500 hover:text-foreground transition-colors text-sm underline"
                    >
                      Continuar sin registrarme
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Guest warning */
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl font-medium mb-2">Antes de continuar</h2>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Al comprar sin cuenta, <strong>no vas a poder ver el estado de tu envío</strong> ni recibir notificaciones sobre tu pedido.
                </p>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  Si tenés alguna duda sobre tu compra, podés contactarnos a:{' '}
                  <a href="mailto:softworksargentina@gmail.com" className="text-foreground font-medium underline">
                    softworksargentina@gmail.com
                  </a>
                </p>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGuestContinue}
                    className="block w-full py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                  >
                    Entendido, continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWarning(false)}
                    className="block w-full py-3 text-gray-500 hover:text-foreground transition-colors text-sm"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
