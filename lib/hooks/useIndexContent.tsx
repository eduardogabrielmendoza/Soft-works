'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CustomSection } from '@/lib/types/sections';

// Tipos para el contenido del index
export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface ProductCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  size: 'large' | 'medium' | 'small';
}

export interface LifestyleImage {
  id: string;
  image: string;
  label: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface BannerSection {
  image: string;
  title: string;
  subtitle: string;
}

export interface PhilosophySection {
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

export interface IndexContent {
  heroSlides: HeroSlide[];
  productCardsSection1: ProductCard[];
  philosophySection: PhilosophySection;
  lifestyleImages: LifestyleImage[];
  fullWidthBanner: BannerSection;
  contentGrid: ContentItem[];
  customSections?: CustomSection[];
}

const defaultContent: IndexContent = {
  heroSlides: [
    {
      id: '1',
      image: '/images/Herobanner.png',
      title: 'Colecciones',
      subtitle: 'Buenos Aires - Argentina',
      ctaText: 'Explorar',
      ctaLink: '/colecciones',
    },
    {
      id: '2',
      image: '/images/hoodies.png',
      title: 'Hoodies',
      subtitle: 'For the obsessed',
      ctaText: 'Ver Hoodies',
      ctaLink: '/colecciones?categoria=hoodies',
    },
    {
      id: '3',
      image: '/images/shirts.png',
      title: 'T-Shirts',
      subtitle: 'Esenciales minimalistas',
      ctaText: 'Ver T-Shirts',
      ctaLink: '/colecciones?categoria=t-shirts',
    },
  ],
  productCardsSection1: [
    {
      id: '1',
      title: 'Hoodies',
      subtitle: '"For the obsessed"',
      description: 'Confort urbano que redefine el estilo casual contemporáneo. Cada hoodie es una declaración de intención, fusionando siluetas oversized con detalles minimalistas que elevan tu guardarropa esencial. Diseñado para quienes entienden que el verdadero lujo reside en la simplicidad perfectamente ejecutada.',
      image: '/images/hoodies.png',
      link: '/colecciones?categoria=hoodies',
      size: 'large',
    },
    {
      id: '2',
      title: 'Remeras',
      subtitle: '',
      description: 'Esencialismo minimalista en cada trazo y textura. Prendas fundamentales que trascienden temporadas, confeccionadas con tejidos premium que hablan por sí solos. La base perfecta para construir un estilo personal auténtico y atemporal.',
      image: '/images/shirts.png',
      link: '/colecciones?categoria=t-shirts',
      size: 'medium',
    },
    {
      id: '3',
      title: 'Gorras',
      subtitle: '',
      description: 'El detalle perfecto para un statement atemporal. Accesorios esenciales que completan cualquier outfit con un toque de sofisticación urbana. Diseño limpio y construcción impecable para quienes aprecian la elegancia en cada detalle.',
      image: '/images/caps.png',
      link: '/colecciones?categoria=gorras',
      size: 'medium',
    },
  ],
  philosophySection: {
    title: 'Una de cada cosa\nrealmente bien',
    description: 'En Softworks, nuestra filosofía es hacer una de cada cosa realmente bien. Para nosotros, eso significa una colección de prendas esenciales e intencionadas de alto rendimiento que uses todos los días. Las que amas, en las que confías y a las que siempre vuelves.',
    ctaText: 'Ver Colecciones',
    ctaLink: '/colecciones',
  },
  lifestyleImages: [
    { id: '1', image: '/images/item1.png', label: 'Detalle Textura' },
    { id: '2', image: '/images/item2.png', label: 'Lifestyle 1' },
    { id: '3', image: '/images/item3.png', label: 'Producto Plano' },
    { id: '4', image: '/images/item4.png', label: 'Lifestyle 2' },
  ],
  fullWidthBanner: {
    image: '/images/lifebanner.png',
    title: 'Diseñado para durar',
    subtitle: 'Calidad atemporal, estilo consciente',
  },
  contentGrid: [
    { id: '1', title: 'Nuestra Misión', description: 'Restaurar, diseñar y crear', image: '/images/mision.png', link: '/nosotros' },
    { id: '2', title: 'Filantropía', description: 'Apoyando estilos de vida', image: '/images/filantropia.png', link: '/futuros-softworks' },
    { id: '3', title: 'Sostenibilidad', description: 'Moda consciente y responsable', image: '/images/sostenibilidad.png', link: '/produccion' },
  ],
  customSections: [],
};

interface IndexContentContextType {
  content: IndexContent;
  isLoading: boolean;
  refreshContent: () => Promise<void>;
}

const IndexContentContext = createContext<IndexContentContextType | undefined>(undefined);

export function IndexContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<IndexContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  const loadContent = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('valor')
        .eq('clave', 'contenido_index')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando contenido del index:', error);
      }

      if (data?.valor) {
        setContent({ ...defaultContent, ...data.valor });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const refreshContent = async () => {
    await loadContent();
  };

  return (
    <IndexContentContext.Provider value={{ content, isLoading, refreshContent }}>
      {children}
    </IndexContentContext.Provider>
  );
}

export function useIndexContent() {
  const context = useContext(IndexContentContext);
  if (context === undefined) {
    // Return default content if not in provider (for SSR)
    return { content: defaultContent, isLoading: false, refreshContent: async () => {} };
  }
  return context;
}

export { defaultContent };
