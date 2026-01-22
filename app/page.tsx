'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import HeroBannerSlideshow from '@/app/components/HeroBannerSlideshow';
import FAQSection from '@/app/components/FAQSection';

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="pt-16">
      {/* Hero Principal - Banner Slideshow */}
      <HeroBannerSlideshow />

      {/* Grid de Productos Destacados 1 */}
      <section className="px-4 py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Producto Grande Izquierda */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group cursor-pointer"
          >
            <div className="aspect-[3/4] rounded-lg mb-4 relative overflow-hidden">
              <Image
                src="/images/hoodies.png"
                alt="Hoodies Softworks"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 z-10">
                <h3 className="text-2xl font-medium text-white mb-2">Hoodies</h3>
                <p className="text-sm text-white/90">"For the obsessed"</p>
              </div>
            </div>
            <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">
              Confort urbano que redefine el estilo casual contemporáneo. Cada hoodie es una declaración de intención, 
              fusionando siluetas oversized con detalles minimalistas que elevan tu guardarropa esencial. 
              Diseñado para quienes entienden que el verdadero lujo reside en la simplicidad perfectamente ejecutada.
            </p>
          </motion.div>

          {/* Grid Derecha - 2 productos */}
          <div className="grid grid-rows-2 gap-4 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[16/9] lg:aspect-[21/9] rounded-lg mb-3 relative overflow-hidden">
                <Image
                  src="/images/shirts.png"
                  alt="T-Shirts Softworks"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 z-10">
                  <h3 className="text-xl font-medium text-white">Remeras</h3>
                </div>
              </div>
              <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">
                Esencialismo minimalista en cada trazo y textura. Prendas fundamentales que trascienden 
                temporadas, confeccionadas con tejidos premium que hablan por sí solos. La base perfecta 
                para construir un estilo personal auténtico y atemporal.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[16/9] lg:aspect-[21/9] rounded-lg mb-3 relative overflow-hidden">
                <Image
                  src="/images/caps.png"
                  alt="Gorras Softworks"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 z-10">
                  <h3 className="text-xl font-medium text-white">Gorras</h3>
                </div>
              </div>
              <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">
                El detalle perfecto para un statement atemporal. Accesorios esenciales que completan 
                cualquier outfit con un toque de sofisticación urbana. Diseño limpio y construcción 
                impecable para quienes aprecian la elegancia en cada detalle.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sección "Una de cada cosa realmente bien" */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-medium mb-6">
              Una de cada cosa<br />realmente bien
            </h2>
            <p className="max-w-2xl mx-auto text-foreground/70 leading-relaxed">
              En Softworks, nuestra filosofía es hacer una de cada cosa realmente bien. 
              Para nosotros, eso significa una colección de prendas esenciales e intencionadas 
              de alto rendimiento que uses todos los días. Las que amas, en las que confías 
              y a las que siempre vuelves.
            </p>
            <Link 
              href="/colecciones"
              className="inline-block mt-8 px-8 py-3 bg-foreground text-white rounded-full hover:bg-foreground/90 transition-all font-medium"
            >
              Ver Colecciones
            </Link>
          </motion.div>

          {/* Grid de Imágenes Lifestyle */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Detalle Textura', img: '/images/item1.png' },
              { label: 'Lifestyle 1', img: '/images/item2.png' },
              { label: 'Producto Plano', img: '/images/item3.png' },
              { label: 'Lifestyle 2', img: '/images/item4.png' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer"
              >
                <Image
                  src={item.img}
                  alt={item.label}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Contenido Full Width */}
      <section className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative aspect-[9/12] lg:aspect-[21/9]"
        >
          <Image
            src="/images/lifebanner.png"
            alt="Lifestyle Softworks"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <h2 className="text-3xl lg:text-5xl font-medium mb-4">Diseñado para durar</h2>
              <p className="text-white/90">Calidad atemporal, estilo consciente</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Grid de Contenido - 3 Columnas */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {[
            { title: 'Nuestra Misión', desc: 'Restaurar, diseñar y crear', img: '/images/mision.png', link: '/nosotros' },
            { title: 'Filantropía', desc: 'Apoyando estilos de vida', img: '/images/filantropia.png', link: '/futuros-softworks' },
            { title: 'Sostenibilidad', desc: 'Moda consciente y responsable', img: '/images/sostenibilidad.png', link: '/produccion' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="aspect-square rounded-lg mb-6 relative overflow-hidden group cursor-pointer">
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium mb-2">{item.title}</h3>
              <p className="text-foreground/70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
}
