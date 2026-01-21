'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function NosotrosPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl lg:text-6xl font-medium mb-6">Nuestra Historia</h1>
          <p className="text-lg lg:text-xl text-foreground/70 leading-relaxed">
            En Softworks, creemos en hacer una de cada cosa realmente bien. 
            Nuestra filosofía es crear prendas esenciales, intencionadas y de alto rendimiento 
            que uses todos los días.
          </p>
        </motion.div>
      </section>

      {/* Image Header */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="aspect-[16/9] lg:aspect-[21/9] relative mb-16 overflow-hidden"
      >
        <Image
          src="/images/nosotrosheader.png"
          alt="Equipo Fundador Softworks"
          fill
          className="object-cover"
        />
      </motion.div>

      {/* Misión y Visión */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="aspect-[4/5] relative rounded-lg overflow-hidden"
          >
            <Image
              src="/images/nosotros1.png"
              alt="Equipo Softworks"
              fill
              className="object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-medium mb-6">Nuestra Visión</h2>
            <p className="text-foreground/70 leading-relaxed mb-4">
              Fundada en 2023, Softworks nació de la frustración con la moda rápida 
              y la necesidad de crear algo verdaderamente atemporal. Queremos que cada 
              prenda cuente una historia de calidad, durabilidad y diseño consciente.
            </p>
            <p className="text-foreground/70 leading-relaxed">
              Creemos que menos es más. Cada pieza de nuestra colección está diseñada 
              para complementar tu guardarropa existente, no para reemplazarlo. 
              Sostenibilidad a través de la simplicidad.
            </p>
          </motion.div>
        </div>

        {/* Valores invertido */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl lg:text-4xl font-medium mb-6">Nuestros Valores</h2>
            <ul className="space-y-4">
              {[
                { title: 'Calidad sobre Cantidad', desc: 'Menos piezas, mejor fabricadas' },
                { title: 'Diseño Atemporal', desc: 'Prendas que trascienden las tendencias' },
                { title: 'Producción Ética', desc: 'Respeto por quienes hacen nuestra ropa' },
                { title: 'Transparencia Total', desc: 'Honestidad en cada paso del proceso' }
              ].map((value, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="border-l-2 border-foreground pl-4"
                >
                  <h3 className="font-medium mb-1">{value.title}</h3>
                  <p className="text-sm text-foreground/70">{value.desc}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="aspect-[4/5] relative rounded-lg overflow-hidden order-1 lg:order-2"
          >
            <Image
              src="/images/nosotros2.png"
              alt="Proceso de Producción"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center px-4"
        >
          <h2 className="text-3xl lg:text-4xl font-medium mb-6">Conoce más sobre nuestro impacto</h2>
          <p className="text-foreground/70 mb-8">
            Descubre cómo estamos trabajando para crear un futuro más sostenible y equitativo
          </p>
          <Link
            href="/produccion"
            className="inline-block px-8 py-3 border-2 border-foreground rounded-full hover:bg-foreground hover:text-white transition-all font-medium"
          >
            Ver más
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
