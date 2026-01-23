'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function HeroBannerSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  // Parallax effect con scroll
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.1]);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <section className="relative px-4 lg:px-8 pt-20 lg:pt-24 pb-4">
      {/* Card container con márgenes y bordes redondeados */}
      <motion.div 
        style={{ opacity }}
        className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl"
      >
        <div className="relative aspect-[9/16] sm:aspect-[4/5] lg:aspect-[21/9]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'tween', duration: 0.5, ease: 'easeInOut' },
                opacity: { duration: 0.3 },
              }}
              className="absolute inset-0"
            >
              {/* Parallax image container */}
              <motion.div 
                style={{ y, scale }}
                className="absolute inset-0"
              >
                <Image
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  fill
                  priority
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-center px-6"
              >
                <motion.h1 
                  className="text-5xl sm:text-6xl lg:text-8xl font-medium text-white mb-6 tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Link
                    href={slides[currentSlide].ctaLink}
                    className="inline-block px-10 py-4 bg-white text-foreground rounded-full hover:bg-white/90 hover:scale-105 transition-all font-medium text-lg shadow-lg"
                  >
                    {slides[currentSlide].ctaText}
                  </Link>
                </motion.div>
                <motion.p 
                  className="text-base lg:text-lg text-white/70 mt-6 tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {slides[currentSlide].subtitle}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 transition-all hover:scale-110 border border-white/20"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 transition-all hover:scale-110 border border-white/20"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </button>

          {/* Dots Indicator - Improved design */}
          <div className="absolute bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white w-10'
                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
