'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventosPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="pt-20 px-4 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-4">Eventos</h1>
      <p className="text-foreground/70 mb-12">Únete a nosotros en nuestros próximos eventos y experiencias</p>

      {/* Upcoming Events */}
      <section className="mb-16">
        <h2 className="text-2xl font-medium mb-6">Próximos Eventos</h2>
        <div className="space-y-6">
          <div className="grid lg:grid-cols-[300px_1fr] gap-6 p-6 border border-gray-200 rounded-lg">
            <div className="aspect-square rounded-lg relative overflow-hidden">
              <Image
                src="/images/showroom2.png"
                alt="Showroom Palermo Nº2"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-sm text-foreground/70 mb-1">06/05/2026 · CABA</div>
              <h3 className="text-xl font-medium mb-2">Showroom Palermo Nº2</h3>
              <p className="text-foreground/70 mb-4">
                Presentación de nuevas colecciones y productos.
              </p>
              <button 
                onClick={() => setShowModal(true)}
                className="px-6 py-2 border border-foreground rounded-md hover:bg-foreground hover:text-white transition-colors"
              >
                Más Información
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section>
        <h2 className="text-2xl font-medium mb-6">Eventos Pasados</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="aspect-[4/3] rounded-lg mb-3 relative overflow-hidden">
              <Image
                src="/images/showroom1.png"
                alt="Showroom Palermo Nº1"
                fill
                className="object-cover"
              />
            </div>
            <h3 className="font-medium mb-1">Showroom Palermo Nº1</h3>
            <p className="text-sm text-foreground/70">15/12/2025 · Buenos Aires</p>
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-medium mb-4">Showroom Palermo Nº2</h3>
              <div className="space-y-3 text-foreground/70">
                <p><strong>Fecha:</strong> 06 de Mayo, 2026</p>
                <p><strong>Ubicación:</strong> Palermo, Buenos Aires, Argentina</p>
                <p><strong>Horario:</strong> 18:00 - 22:00 hs</p>
                <p className="pt-2">
                  Únete a nosotros para la presentación exclusiva de nuestra nueva colección. 
                  Descubre las últimas tendencias, conoce el proceso detrás de cada diseño y 
                  disfruta de una experiencia única en nuestro showroom.
                </p>
                <p className="pt-2">
                  <strong>Incluye:</strong> Cocktail de bienvenida, música en vivo y descuentos exclusivos 
                  para asistentes.
                </p>
                <div className="pt-4">
                  <a
                    href="mailto:eventos@softworks.com"
                    className="inline-block px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                  >
                    Reservar Entrada
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
