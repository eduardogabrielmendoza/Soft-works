'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: '¿Cómo puedo rastrear mi pedido?',
    answer: 'Una vez que tu pedido sea enviado, recibirás un email con el número de seguimiento y un link para rastrear tu envío en tiempo real. También podés verificar el estado de tu pedido desde tu cuenta en la sección "Mis Pedidos".',
  },
  {
    question: '¿Cuál es la política de devoluciones?',
    answer: 'Aceptamos devoluciones dentro de los 30 días posteriores a la recepción del pedido. Los productos deben estar sin usar, con las etiquetas originales y en su empaque original. El proceso de reembolso toma entre 5 a 10 días hábiles una vez recibido el producto.',
  },
  {
    question: '¿Cuáles son los tiempos de envío?',
    answer: 'Los envíos dentro de Buenos Aires demoran entre 2-4 días hábiles. Para el interior del país, el tiempo de envío es de 5-8 días hábiles. Una vez confirmado tu pago, procesaremos el pedido en 24-48 horas.',
  },
  {
    question: '¿Cómo elijo mi talla correcta?',
    answer: 'En cada producto encontrarás una guía de talles específica con medidas detalladas. Te recomendamos medir una prenda similar que ya tengas y compararla con nuestra tabla. Si tenés dudas, contactanos y te ayudaremos a elegir la talla perfecta.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos transferencias bancarias y pagos por MercadoPago. Una vez realices el pedido, recibirás las instrucciones de pago. Debés enviar el comprobante de pago para que nuestro equipo lo verifique y apruebe tu pedido.',
  },
  {
    question: '¿Los productos son nacionales?',
    answer: 'Sí, todos nuestros productos son diseñados y producidos en Buenos Aires, Argentina. Trabajamos con talleres locales que comparten nuestros valores de calidad y producción sostenible.',
  },
  {
    question: '¿Ofrecen envío gratis?',
    answer: 'Sí, ofrecemos envío gratis en pedidos superiores a $100. Para compras menores, el costo de envío se calcula según tu ubicación y se muestra antes de finalizar la compra.',
  },
  {
    question: '¿Puedo cambiar un producto por otro talle?',
    answer: 'Sí, aceptamos cambios por talle. Contactanos a softworksargentina@gmail.com con tu número de pedido y te enviaremos las instrucciones. Los gastos de envío del cambio corren por cuenta del cliente.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-medium mb-4">Preguntas Frecuentes</h2>
          <p className="text-foreground/70">
            Encontrá respuestas a las preguntas más comunes
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-base lg:text-lg pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-foreground/70 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-foreground/70 mb-4">
            ¿No encontraste lo que buscabas?
          </p>
          <a
            href="mailto:softworksargentina@gmail.com"
            className="inline-block px-8 py-3 border-2 border-foreground rounded-full hover:bg-foreground hover:text-white transition-all font-medium"
          >
            Contactanos
          </a>
        </motion.div>
      </div>
    </section>
  );
}
