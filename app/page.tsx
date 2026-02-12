'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import HeroBannerSlideshow from '@/app/components/HeroBannerSlideshow';
import CustomSectionsRenderer from '@/app/components/CustomSections';
import { useIndexContent } from '@/lib/hooks/useIndexContent';

export default function Home() {
  const { content } = useIndexContent();
  
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  // Obtener las tarjetas de productos
  const productCards = content.productCardsSection1;
  const largeCard = productCards.find(c => c.size === 'large') || productCards[0];
  const mediumCards = productCards.filter(c => c.size === 'medium' || c.id !== largeCard?.id).slice(0, 2);

  return (
    <div className="pt-16">
      {/* Hero Principal - Banner Slideshow */}
      <HeroBannerSlideshow />

      {/* Grid de Productos Destacados 1 */}
      <section className="px-4 py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Producto Grande Izquierda */}
          {largeCard && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group cursor-pointer"
            >
              <Link href={largeCard.link}>
                <div className="aspect-[3/4] rounded-lg mb-4 relative overflow-hidden">
                  <Image
                    src={largeCard.image}
                    alt={largeCard.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 z-10">
                    <h3 className="text-2xl font-medium text-white mb-2">{largeCard.title}</h3>
                    {largeCard.subtitle && <p className="text-sm text-white/90">{largeCard.subtitle}</p>}
                  </div>
                </div>
              </Link>
              <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">
                {largeCard.description}
              </p>
            </motion.div>
          )}

          {/* Grid Derecha - 2 productos */}
          <div className="grid grid-rows-2 gap-4 lg:gap-6">
            {mediumCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <Link href={card.link}>
                  <div className="aspect-[16/9] lg:aspect-[21/9] rounded-lg mb-3 relative overflow-hidden">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 z-10">
                      <h3 className="text-xl font-medium text-white">{card.title}</h3>
                    </div>
                  </div>
                </Link>
                <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">
                  {card.description}
                </p>
              </motion.div>
            ))}
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
            <h2 className="text-3xl lg:text-4xl font-medium mb-6 whitespace-pre-line">
              {content.philosophySection.title}
            </h2>
            <p className="max-w-2xl mx-auto text-foreground/70 leading-relaxed">
              {content.philosophySection.description}
            </p>
            <Link 
              href={content.philosophySection.ctaLink}
              className="inline-block mt-8 px-8 py-3 bg-foreground text-white rounded-full hover:bg-foreground/90 transition-all font-medium"
            >
              {content.philosophySection.ctaText}
            </Link>
          </motion.div>

          {/* Grid de Imágenes Lifestyle */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.lifestyleImages.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="aspect-[3/4] rounded-lg overflow-hidden relative group cursor-pointer"
              >
                <Image
                  src={item.image}
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
            src={content.fullWidthBanner.image}
            alt={content.fullWidthBanner.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <h2 className="text-3xl lg:text-5xl font-medium mb-4">{content.fullWidthBanner.title}</h2>
              <p className="text-white/90">{content.fullWidthBanner.subtitle}</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Grid de Contenido - 3 Columnas */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {content.contentGrid.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <Link href={item.link}>
                <div className="aspect-square rounded-lg mb-6 relative overflow-hidden group cursor-pointer">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </Link>
              <h3 className="text-xl font-medium mb-2">{item.title}</h3>
              <p className="text-foreground/70">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
