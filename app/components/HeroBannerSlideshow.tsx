'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIndexContent } from '@/lib/hooks/useIndexContent';
import { SectionButton } from '@/app/components/CustomSections';
import type { CustomButton } from '@/lib/types/sections';

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  buttons?: CustomButton[];
}

// Variantes para transición horizontal suave sin parpadeos
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
    zIndex: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 1, // Mantener opacidad completa para evitar fundido a blanco
    zIndex: 0,
  }),
};

// Variantes para el contenido con animaciones sincronizadas
const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.3 },
  }),
};

// Variantes para elementos hijos (título, botón, subtítulo)
const childVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function HeroBannerSlideshow() {
  const { content } = useIndexContent();
  const slides = content.heroSlides;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax effect con scroll - el contenedor se desvanece y la imagen se mueve
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, 100]);
  const contentY = useTransform(scrollY, [0, 400], [0, 50]);
  const containerOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const imageScale = useTransform(scrollY, [0, 500], [1, 1.15]);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentSlide((prev) => {
      const next = prev + newDirection;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  // Swipe handlers para móvil
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      paginate(1);
    }
    if (touchStart - touchEnd < -75) {
      paginate(-1);
    }
  };

  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity: containerOpacity }}
      className="relative"
    >
      {/* Contenedor del slider con márgenes y bordes redondeados */}
      <div className="px-4 lg:px-8 pt-0 pb-4">
        <div 
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Aspect ratio container */}
          <div className="relative aspect-[9/16] sm:aspect-[4/5] md:aspect-[16/10] lg:aspect-[21/9]">
            {/* Slides con transición horizontal */}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 200, damping: 30 },
                  opacity: { duration: 0.4 },
                }}
                className="absolute inset-0"
              >
                {/* Imagen con parallax interno */}
                <motion.div 
                  style={{ y: imageY, scale: imageScale }}
                  className="absolute inset-0 will-change-transform"
                >
                  <Image
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    fill
                    priority
                    quality={90}
                    className="object-cover"
                    sizes="100vw"
                  />
                </motion.div>
                
                {/* Overlay gradiente elegante */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              </motion.div>
            </AnimatePresence>

            {/* Contenido con animaciones sincronizadas via staggerChildren */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ y: contentY }}
                  className="text-center px-6 max-w-4xl mx-auto"
                >
                  {/* Título principal - sincronizado con stagger */}
                  <motion.h1 
                    variants={childVariants}
                    className="text-5xl sm:text-6xl lg:text-8xl font-medium text-white mb-8 tracking-tight"
                  >
                    {slides[currentSlide].title}
                  </motion.h1>
                  
                  {/* CTA Button - sincronizado con stagger */}
                  <motion.div variants={childVariants}>
                    <Link
                      href={slides[currentSlide].ctaLink}
                      className="inline-block px-12 py-4 bg-white text-black rounded-full font-medium text-lg shadow-xl hover:bg-white/95 hover:scale-105 active:scale-100 transition-all duration-200"
                    >
                      {slides[currentSlide].ctaText}
                    </Link>
                  </motion.div>

                  {/* Botones adicionales del slide */}
                  {slides[currentSlide].buttons && slides[currentSlide].buttons!.length > 0 && (
                    <motion.div variants={childVariants} className="flex flex-wrap gap-3 justify-center mt-4">
                      {slides[currentSlide].buttons!.map(btn => <SectionButton key={btn.id} btn={btn} />)}
                    </motion.div>
                  )}
                  
                  {/* Subtítulo - sincronizado con stagger */}
                  <motion.p 
                    variants={childVariants}
                    className="text-base lg:text-lg text-white/60 mt-8 tracking-widest uppercase"
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Botones de navegación laterales - Minimalistas */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 lg:w-12 lg:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 lg:w-12 lg:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </button>

            {/* Indicadores de navegación - Dots simples */}
            <div className="absolute bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="group p-1"
                  aria-label={`Ir al slide ${index + 1}`}
                >
                  <motion.span
                    className="block w-2.5 h-2.5 rounded-full transition-colors duration-300"
                    animate={{
                      backgroundColor: index === currentSlide ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.4)',
                      scale: index === currentSlide ? 1.2 : 1,
                    }}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                    transition={{ duration: 0.2 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
