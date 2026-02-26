'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CustomButton, TextStyle, ButtonAlignment } from '@/lib/types/sections';

// ============================================================
// Types for editable layout sections (Header, Footer, BrandSection)
// ============================================================

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  id: string;
  title: string;
  links: Array<{ id: string; label: string; href: string }>;
}

export interface HeaderContent {
  navLinks: NavLink[];
  logoUrl: string;
  logoVariant?: 'dark' | 'light';
  buttons?: CustomButton[];
  buttonAlignment?: ButtonAlignment;
}

export interface FooterContent {
  newsletterTitle: string;
  newsletterDescription: string;
  privacyNote: string;
  linkColumns: FooterLinkColumn[];
  contactEmail: string;
  buttons?: CustomButton[];
  buttonAlignment?: ButtonAlignment;
}

export interface BrandSectionContent {
  text: string;
  enabled: boolean;
}

export interface LayoutContent {
  header: HeaderContent;
  footer: FooterContent;
  brandSection: BrandSectionContent;
  textStyles?: Record<string, TextStyle>;
}

// ============================================================
// Defaults — mirror what's currently hardcoded in components
// ============================================================

export const defaultLayoutContent: LayoutContent = {
  header: {
    navLinks: [
      { id: '1', label: 'Colecciones', href: '/colecciones' },
      { id: '2', label: 'Nosotros', href: '/nosotros' },
      { id: '3', label: 'Producción', href: '/produccion' },
    ],
    logoUrl: '/images/logosoftworks.png',
  },
  footer: {
    newsletterTitle: 'Unite a la comunidad {site_name}',
    newsletterDescription: 'Recibi contenido exclusivo, tips de estilo y acceso anticipado a nuevas colecciones.',
    privacyNote: 'Al suscribirte, aceptas nuestra Política de Privacidad.',
    linkColumns: [
      {
        id: '1',
        title: 'Comprar',
        links: [
          { id: '1a', label: 'Toda la Ropa', href: '/colecciones/toda-la-ropa' },
          { id: '1b', label: 'Colecciones', href: '/colecciones' },
          { id: '1c', label: 'Ubicaciones', href: '/ubicaciones' },
        ],
      },
      {
        id: '2',
        title: 'Sobre Nosotros',
        links: [
          { id: '2a', label: 'Nuestra Historia', href: '/nosotros' },
          { id: '2b', label: 'Nuestra Producción', href: '/produccion' },
        ],
      },
      {
        id: '3',
        title: 'Ayuda',
        links: [
          { id: '3a', label: 'Preguntas Frecuentes', href: '/preguntas-frecuentes' },
          { id: '3b', label: 'Contacto', href: '/contacto' },
          { id: '3c', label: 'Eventos', href: '/eventos' },
        ],
      },
      {
        id: '4',
        title: 'Legal',
        links: [
          { id: '4a', label: 'Privacidad', href: '/politica-privacidad' },
          { id: '4b', label: 'Términos', href: '/terminos-servicio' },
          { id: '4c', label: 'Cookies', href: '/politica-cookies' },
          { id: '4d', label: 'Accesibilidad', href: '/accesibilidad' },
        ],
      },
    ],
    contactEmail: 'softworksargentina@gmail.com',
  },
  brandSection: {
    text: 'Softworks',
    enabled: true,
  },
};

// ============================================================
// Context & Provider
// ============================================================

interface LayoutContentContextType {
  layout: LayoutContent;
  isLoading: boolean;
  refreshLayout: () => Promise<void>;
}

const LayoutContentContext = createContext<LayoutContentContextType | undefined>(undefined);

export function LayoutContentProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutContent>(defaultLayoutContent);
  const [isLoading, setIsLoading] = useState(true);

  const loadLayout = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('valor')
        .eq('clave', 'contenido_layout')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando layout:', error);
      }

      if (data?.valor) {
        const parsed = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
        setLayout({ ...defaultLayoutContent, ...parsed });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  // Listen for real-time preview updates from the admin editor
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'content-preview' && e.data?.key === 'contenido_layout') {
        setLayout({ ...defaultLayoutContent, ...e.data.value });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <LayoutContentContext.Provider value={{ layout, isLoading, refreshLayout: loadLayout }}>
      {children}
    </LayoutContentContext.Provider>
  );
}

export function useLayoutContent() {
  const context = useContext(LayoutContentContext);
  if (context === undefined) {
    // Return defaults if not in provider (SSR fallback)
    return { layout: defaultLayoutContent, isLoading: false, refreshLayout: async () => {} };
  }
  return context;
}
