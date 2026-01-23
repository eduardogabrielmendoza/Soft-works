'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Pedidos',
    question: '¿Cómo puedo rastrear mi pedido?',
    answer: 'Una vez que tu pedido sea enviado, recibirás un email con el número de seguimiento y un link para rastrear tu envío en tiempo real. También podés verificar el estado de tu pedido desde tu cuenta en la sección "Mis Pedidos".',
  },
  {
    category: 'Pedidos',
    question: '¿Cuáles son los tiempos de envío?',
    answer: 'Los envíos dentro de Buenos Aires demoran entre 2-4 días hábiles. Para el interior del país, el tiempo de envío es de 5-8 días hábiles. Una vez confirmado tu pago, procesaremos el pedido en 24-48 horas.',
  },
  {
    category: 'Pedidos',
    question: '¿Ofrecen envío gratis?',
    answer: 'Sí, ofrecemos envío gratis en pedidos superiores a $100. Para compras menores, el costo de envío se calcula según tu ubicación y se muestra antes de finalizar la compra.',
  },
  {
    category: 'Devoluciones',
    question: '¿Cuál es la política de devoluciones?',
    answer: 'Aceptamos devoluciones dentro de los 30 días posteriores a la recepción del pedido. Los productos deben estar sin usar, con las etiquetas originales y en su empaque original. El proceso de reembolso toma entre 5 a 10 días hábiles una vez recibido el producto.',
  },
  {
    category: 'Devoluciones',
    question: '¿Puedo cambiar un producto por otro talle?',
    answer: 'Sí, aceptamos cambios por talle. Contactanos a softworksargentina@gmail.com con tu número de pedido y te enviaremos las instrucciones. Los gastos de envío del cambio corren por cuenta del cliente.',
  },
  {
    category: 'Productos',
    question: '¿Cómo elijo mi talla correcta?',
    answer: 'En cada producto encontrarás una guía de talles específica con medidas detalladas. Te recomendamos medir una prenda similar que ya tengas y compararla con nuestra tabla. Si tenés dudas, contactanos y te ayudaremos a elegir la talla perfecta.',
  },
  {
    category: 'Productos',
    question: '¿Los productos son nacionales?',
    answer: 'Sí, todos nuestros productos son diseñados y producidos en Buenos Aires, Argentina. Trabajamos con talleres locales que comparten nuestros valores de calidad y producción sostenible.',
  },
  {
    category: 'Pagos',
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos transferencias bancarias y pagos por MercadoPago. Una vez realices el pedido, recibirás las instrucciones de pago. Debés enviar el comprobante de pago para que nuestro equipo lo verifique y apruebe tu pedido.',
  },
];

const categories = ['Todos', 'Pedidos', 'Devoluciones', 'Productos', 'Pagos'];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = activeCategory === 'Todos' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-medium mb-6"
          >
            Preguntas Frecuentes
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-foreground/70 max-w-2xl mx-auto"
          >
            Encontrá respuestas a las preguntas más comunes sobre nuestros productos, 
            envíos, devoluciones y más.
          </motion.p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenIndex(null);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-foreground text-white shadow-lg'
                    : 'bg-white text-foreground/70 hover:bg-foreground/5 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={`${activeCategory}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div 
                    className={`bg-white rounded-2xl overflow-hidden transition-all duration-500 ${
                      openIndex === index 
                        ? 'shadow-xl ring-1 ring-foreground/10' 
                        : 'shadow-sm hover:shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-6 flex items-start justify-between text-left gap-4"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider mb-2 block">
                          {faq.category}
                        </span>
                        <span className="text-base lg:text-lg font-medium text-foreground leading-relaxed block">
                          {faq.question}
                        </span>
                      </div>
                      <motion.div
                        initial={false}
                        animate={{ 
                          rotate: openIndex === index ? 180 : 0,
                          scale: openIndex === index ? 1.1 : 1
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20 
                        }}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          openIndex === index 
                            ? 'bg-foreground text-white' 
                            : 'bg-gray-100 text-foreground/60 group-hover:bg-foreground/10'
                        }`}
                      >
                        {openIndex === index ? (
                          <Minus className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ 
                            height: 'auto', 
                            opacity: 1,
                            transition: {
                              height: { type: "spring", stiffness: 300, damping: 30 },
                              opacity: { duration: 0.2, delay: 0.1 }
                            }
                          }}
                          exit={{ 
                            height: 0, 
                            opacity: 0,
                            transition: {
                              height: { type: "spring", stiffness: 300, damping: 30 },
                              opacity: { duration: 0.1 }
                            }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <div className="pt-2 border-t border-gray-100">
                              <p className="pt-4 text-foreground/70 leading-relaxed text-base">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="px-4 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-foreground/20 mx-auto mb-6" />
              <h2 className="text-2xl lg:text-3xl font-medium mb-4">
                ¿No encontraste lo que buscabas?
              </h2>
              <p className="text-foreground/70 mb-8 max-w-md mx-auto">
                Nuestro equipo está disponible para ayudarte con cualquier consulta adicional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:softworksargentina@gmail.com"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-white rounded-full hover:bg-foreground/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  <Mail className="w-5 h-5" />
                  Escribinos
                </a>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-foreground text-foreground rounded-full hover:bg-foreground hover:text-white transition-all duration-300 font-medium"
                >
                  Ir a Contacto
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
