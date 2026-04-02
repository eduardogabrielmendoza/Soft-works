'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIndexContent } from '@/lib/hooks/useIndexContent';
import { SectionButton } from '@/app/components/CustomSections';
import type { CustomButton } from '@/lib/types/sections';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';

interface Slide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  buttons?: CustomButton[];
}

// Crossfade suave para las imágenes
const slideVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1, zIndex: 1 },
  exit: { opacity: 0, zIndex: 0 },
};

// Fade suave para textos (título, subtítulo)
const textVariants = {
  enter: { opacity: 0, y: 12 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export default function HeroBannerSlideshow() {
  const { content, isLoading } = useIndexContent();
  const slides = content.heroSlides;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const contentLayerRef = useRef<HTMLDivElement>(null);
  const parallaxRaf = useRef(0);

  // Parallax suave con CSS transforms en rAF
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(parallaxRaf.current);
      parallaxRaf.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (containerRef.current) {
          containerRef.current.style.opacity = String(Math.max(0.3, 1 - (y / 400) * 0.7));
        }
        if (imageLayerRef.current) {
          const imgY = Math.min(y * 0.2, 100);
          const s = 1 + Math.min(y / 500, 1) * 0.15;
          imageLayerRef.current.style.transform = `translate3d(0,${imgY}px,0) scale(${s})`;
        }
        if (contentLayerRef.current) {
          contentLayerRef.current.style.transform = `translate3d(0,${Math.min(y * 0.125, 50)}px,0)`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(parallaxRaf.current);
    };
  }, []);

  const paginate = useCallback((newDirection: number) => {
    setCurrentSlide((prev) => {
      const next = prev + newDirection;
      if (next < 0) return slides.length - 1;
      if (next >= slides.length) return 0;
      return next;
    });
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

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

  // Don't render until content is loaded to avoid flash of defaults
  if (isLoading) {
    return (
      <div className="px-4 lg:px-8 pt-0 pb-4">
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-neutral-900 animate-pulse">
          <div className="aspect-[3/4] sm:aspect-[4/3] lg:aspect-[21/9]" />
        </div>
      </div>
    );
  }

  return (
    <section ref={containerRef} className="relative" style={{ willChange: 'opacity' }}>
      {/* Contenedor del slider con márgenes y bordes redondeados */}
      <div className="px-4 lg:px-8 pt-0 pb-4">
        <div 
          className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Aspect ratio container */}
          <div className="relative aspect-[3/4] sm:aspect-[4/3] lg:aspect-[21/9]">
            {/* Slides con transición horizontal */}
            <AnimatePresence initial={false}>
              <motion.div
                key={currentSlide}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-0"
              >
                {/* Imagen con parallax */}
                <div 
                  ref={imageLayerRef}
                  className="absolute inset-0"
                  style={{ willChange: 'transform' }}
                >
                  <Image
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    fill
                    priority
                    quality={100}
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
                
                {/* Overlay gradiente elegante */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              </motion.div>
            </AnimatePresence>

            {/* Contenido del slide */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div
                ref={contentLayerRef}
                className="text-center px-6 max-w-4xl mx-auto"
                style={{ willChange: 'transform' }}
              >
                {/* Título - fade suave entre slides */}
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={`title-${currentSlide}`}
                    variants={textVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="text-3xl sm:text-5xl lg:text-8xl font-medium text-white mb-4 sm:mb-8 tracking-tight"
                    style={textStyleCSS(content.textStyles, `slide-${slides[currentSlide].id}-title`)}
                  >
                    {slides[currentSlide].title}
                  </motion.h1>
                </AnimatePresence>
                  
                {/* CTA Button - fijo, sin transición */}
                <div>
                  <Link
                    href={slides[currentSlide].ctaLink}
                    className="inline-block px-8 py-3 sm:px-12 sm:py-4 bg-white text-black rounded-full font-medium text-sm sm:text-lg shadow-xl hover:bg-white/95 hover:scale-105 active:scale-100 transition-all duration-200"
                    style={textStyleCSS(content.textStyles, `slide-${slides[currentSlide].id}-cta`)}
                  >
                    {slides[currentSlide].ctaText}
                  </Link>
                </div>

                {/* Botones adicionales del slide */}
                {slides[currentSlide].buttons && slides[currentSlide].buttons!.length > 0 && (
                  <div className={`flex flex-wrap gap-3 mt-4 ${BTN_ALIGN_CLASS[slides[currentSlide].buttonAlignment || 'center']}`}>
                    {slides[currentSlide].buttons!.map(btn => <SectionButton key={btn.id} btn={btn} />)}
                  </div>
                )}
                  
                {/* Subtítulo - fade suave entre slides */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`subtitle-${currentSlide}`}
                    variants={textVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="text-xs sm:text-base lg:text-lg text-white/60 mt-4 sm:mt-8 tracking-widest uppercase"
                    style={textStyleCSS(content.textStyles, `slide-${slides[currentSlide].id}-subtitle`)}
                  >
                    {slides[currentSlide].subtitle}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Botones de navegación laterales - Minimalistas */}
            <button
              onClick={() => paginate(-1)}
              className="absolute left-3 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="absolute right-3 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 lg:w-12 lg:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Siguiente slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </button>

            {/* Indicadores de navegación - Dots simples */}
            <div className="absolute bottom-4 sm:bottom-8 lg:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3">
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
    </section>
  );
}
