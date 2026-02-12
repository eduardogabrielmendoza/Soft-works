'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer, { SectionButton } from '@/app/components/CustomSections';

export default function EventosPage() {
  const { eventos: content, isLoading } = usePagesContent();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const selectedEventData = content.upcomingEvents.find(e => e.id === selectedEvent);

  return (
    <div className="pt-20 px-4 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl lg:text-4xl font-medium mb-4">{content.title}</h1>
      <p className="text-foreground/70 mb-12">{content.subtitle}</p>

      {content.buttons && content.buttons.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-12">
          {content.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
        </div>
      )}

      {/* Upcoming Events */}
      {content.upcomingEvents.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-medium mb-6">{content.upcomingTitle}</h2>
          <div className="space-y-6">
            {content.upcomingEvents.map((evento) => (
              <div key={evento.id} className="grid lg:grid-cols-[300px_1fr] gap-6 p-6 border border-gray-200 rounded-lg">
                <div className="aspect-square rounded-lg relative overflow-hidden">
                  <Image
                    src={evento.image}
                    alt={evento.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm text-foreground/70 mb-1">{evento.date} · {evento.location}</div>
                  <h3 className="text-xl font-medium mb-2">{evento.title}</h3>
                  <p className="text-foreground/70 mb-4">
                    {evento.description}
                  </p>
                  {evento.modalInfo && (
                    <button 
                      onClick={() => setSelectedEvent(evento.id)}
                      className="px-6 py-2 border border-foreground rounded-md hover:bg-foreground hover:text-white transition-colors"
                    >
                      Más Información
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {content.pastEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-medium mb-6">{content.pastTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {content.pastEvents.map((evento) => (
              <div key={evento.id}>
                <div className="aspect-[4/3] rounded-lg mb-3 relative overflow-hidden">
                  <Image
                    src={evento.image}
                    alt={evento.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="font-medium mb-1">{evento.title}</h3>
                <p className="text-sm text-foreground/70">{evento.date} · {evento.location}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedEvent && selectedEventData?.modalInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-medium mb-4">{selectedEventData.title}</h3>
              <div className="space-y-3 text-foreground/70">
                <p><strong>Fecha:</strong> {selectedEventData.date}</p>
                <p><strong>Ubicación:</strong> {selectedEventData.location}</p>
                <p><strong>Horario:</strong> {selectedEventData.modalInfo.time}</p>
                <p className="pt-2">
                  {selectedEventData.modalInfo.fullDescription}
                </p>
                <p className="pt-2">
                  <strong>Incluye:</strong> {selectedEventData.modalInfo.includes}
                </p>
                <div className="pt-4">
                  <a
                    href={`mailto:${selectedEventData.modalInfo.buttonEmail}`}
                    className="inline-block px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
                  >
                    {selectedEventData.modalInfo.buttonText}
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
