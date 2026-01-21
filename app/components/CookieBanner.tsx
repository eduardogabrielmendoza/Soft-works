'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'softworks_cookie_consent';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Siempre activas
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Verificar si ya se aceptaron las cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Mostrar el banner después de un pequeño delay para mejor UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Cargar preferencias guardadas
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
      } catch {
        // Si hay error parseando, mantener las preferencias por defecto
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(necessaryOnly));
    setPreferences(necessaryOnly);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            {!showPreferences ? (
              // Vista principal
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-medium text-gray-900">
                    Usamos cookies
                  </h3>
                </div>
                
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                  Utilizamos cookies para mejorar tu experiencia de navegación, analizar el tráfico del sitio 
                  y personalizar el contenido. Al hacer clic en "Aceptar todas", aceptás el almacenamiento 
                  de cookies en tu dispositivo.{' '}
                  <Link 
                    href="/politica-cookies" 
                    className="text-gray-900 underline hover:text-gray-700 transition-colors"
                  >
                    Más información
                  </Link>
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    Aceptar todas
                  </button>
                  <button
                    onClick={handleAcceptNecessary}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    Solo necesarias
                  </button>
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    Personalizar
                  </button>
                </div>
              </div>
            ) : (
              // Vista de preferencias
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium text-gray-900">
                    Preferencias de cookies
                  </h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Cookies necesarias */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-gray-900 mb-1">Cookies necesarias</h4>
                      <p className="text-sm text-gray-600">
                        Esenciales para el funcionamiento del sitio. Incluyen autenticación, carrito de compras y seguridad.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-12 h-6 bg-black rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Cookies de analytics */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-gray-900 mb-1">Cookies de análisis</h4>
                      <p className="text-sm text-gray-600">
                        Nos ayudan a entender cómo interactuás con el sitio para mejorar tu experiencia.
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.analytics ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <div 
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          preferences.analytics ? 'right-1' : 'left-1'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Cookies de marketing */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-gray-900 mb-1">Cookies de marketing</h4>
                      <p className="text-sm text-gray-600">
                        Utilizadas para mostrarte anuncios relevantes y medir la efectividad de nuestras campañas.
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        preferences.marketing ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <div 
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          preferences.marketing ? 'right-1' : 'left-1'
                        }`} 
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    Guardar preferencias
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm uppercase tracking-wide"
                  >
                    Aceptar todas
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
