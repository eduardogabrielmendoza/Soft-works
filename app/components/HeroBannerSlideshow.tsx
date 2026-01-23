'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

const slides: Slide[] = [
  {
    image: '/images/Herobanner.png',
    title: 'Colecciones',
    subtitle: 'Buenos Aires - Argentina',
    ctaText: 'Explorar',
    ctaLink: '/colecciones',
  },
  {
    image: '/images/hoodies.png',
    title: 'Hoodies',
    subtitle: 'For the obsessed',
    ctaText: 'Ver Hoodies',
    ctaLink: '/colecciones?categoria=hoodies',
  },
  {
    image: '/images/shirts.png',
    title: 'T-Shirts',
    subtitle: 'Esenciales minimalistas',
    ctaText: 'Ver T-Shirts',
    ctaLink: '/colecciones?categoria=t-shirts',
  },
];

// Variantes para transición horizontal suave sin parpadeos
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 1, // Mantener opacidad al 100% para evitar parpadeos
  }),
  center: {
    x: 0,
    opacity: 1,
    zIndex: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-30%' : '30%', // Movimiento más sutil al salir
    opacity: 0.5,
    zIndex: 0,
  }),
};

// Variantes para el contenido con parallax interno
const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
};

export default function HeroBannerSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax effect con scroll - el contenedor se desvanece y la imagen se mueve
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 500], [0, 100]);
  const contentY = useTransform(scrollY, [0, 400], [0, 50]);
  const containerOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const imageScale = useTransform(scrollY, [0, 500], [1, 1.15]);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, currentSlide]);

  const paginate = useCallback((newDirection: number) => {
    setIsAutoPlaying(false);
    setDirection(newDirection);
    setCurrentSlide((prev) => {
      const next = prev + newDirection;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
    
    // Reanudar autoplay después de interacción
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setIsAutoPlaying(false);
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setTimeout(() => setIsAutoPlaying(true), 10000);
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

            {/* Contenido con animación de parallax */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ y: contentY }}
                  className="text-center px-6 max-w-4xl mx-auto"
                >
                  {/* Título principal con animación escalonada */}
                  <motion.h1 
                    className="text-5xl sm:text-6xl lg:text-8xl font-medium text-white mb-8 tracking-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                  >
                    {slides[currentSlide].title}
                  </motion.h1>
                  
                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Link
                      href={slides[currentSlide].ctaLink}
                      className="inline-block px-12 py-4 bg-white text-black rounded-full font-medium text-lg shadow-xl hover:bg-white/95 hover:scale-105 active:scale-100 transition-all duration-200"
                    >
                      {slides[currentSlide].ctaText}
                    </Link>
                  </motion.div>
                  
                  {/* Subtítulo */}
                  <motion.p 
                    className="text-base lg:text-lg text-white/60 mt-8 tracking-widest uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Flechas de navegación - Estilo minimal */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full transition-all duration-200 hover:scale-110 active:scale-100 border border-white/20"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full transition-all duration-200 hover:scale-110 active:scale-100 border border-white/20"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </button>

            {/* Indicadores de progreso - Estilo línea */}
            <div className="absolute bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="group relative h-1 transition-all duration-500 ease-out"
                  style={{ width: index === currentSlide ? '48px' : '8px' }}
                  aria-label={`Ir al slide ${index + 1}`}
                >
                  {/* Fondo base */}
                  <span className="absolute inset-0 bg-white/30 rounded-full" />
                  
                  {/* Barra de progreso activa */}
                  {index === currentSlide && (
                    <motion.span
                      className="absolute inset-0 bg-white rounded-full origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 6, ease: 'linear' }}
                      key={`progress-${currentSlide}`}
                    />
                  )}
                  
                  {/* Indicador completado */}
                  {index !== currentSlide && (
                    <span className="absolute inset-0 bg-white/50 rounded-full group-hover:bg-white/70 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
