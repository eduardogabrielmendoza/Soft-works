'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CustomSection, CustomButton, TextStyle } from '@/lib/types/sections';

// ============ TIPOS PARA CADA PÁGINA ============

// Nosotros Page
export interface NosotrosContent {
  hero: {
    title: string;
    description: string;
    buttons?: CustomButton[];
  };
  headerImage: string;
  vision: {
    image: string;
    title: string;
    paragraph1: string;
    paragraph2: string;
    buttons?: CustomButton[];
  };
  values: {
    image: string;
    title: string;
    items: Array<{
      title: string;
      description: string;
    }>;
    buttons?: CustomButton[];
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    buttons?: CustomButton[];
  };
  customSections?: CustomSection[];
  textStyles?: Record<string, TextStyle>;
}

// Producción Page
export interface ProduccionContent {
  hero: {
    title: string;
    description: string;
    buttons?: CustomButton[];
  };
  pillars: Array<{
    title: string;
    description: string;
    image: string;
    buttons?: CustomButton[];
  }>;
  customSections?: CustomSection[];
  textStyles?: Record<string, TextStyle>;
}

// Eventos Page
export interface EventoItem {
  id: string;
  image: string;
  date: string;
  location: string;
  title: string;
  description: string;
  modalInfo?: {
    time: string;
    fullDescription: string;
    includes: string;
    buttonText: string;
    buttonEmail: string;
  };
}

export interface EventosContent {
  title: string;
  subtitle: string;
  buttons?: CustomButton[];
  upcomingTitle: string;
  upcomingEvents: EventoItem[];
  pastTitle: string;
  pastEvents: EventoItem[];
  customSections?: CustomSection[];
  textStyles?: Record<string, TextStyle>;
}

// Ubicaciones Page
export interface UbicacionesContent {
  hero: {
    title: string;
    description: string;
    buttons?: CustomButton[];
  };
  mapEmbedUrl: string;
  location: {
    title: string;
    address: string;
    note: string;
    buttonText: string;
    buttonEmail: string;
    buttons?: CustomButton[];
  };
  customSections?: CustomSection[];
  textStyles?: Record<string, TextStyle>;
}

// Contacto Page
export interface ContactoContent {
  hero: {
    title: string;
    subtitle1: string;
    subtitle2: string;
    buttons?: CustomButton[];
  };
  formLabels: {
    nombre: string;
    email: string;
    asunto: string;
    mensaje: string;
    submitButton: string;
    submitting: string;
    successMessage: string;
  };
  infoSection: {
    title: string;
  };
  customSections?: CustomSection[];
  textStyles?: Record<string, TextStyle>;
}

// ============ DEFAULTS ============

const defaultNosotrosContent: NosotrosContent = {
  hero: {
    title: 'Nuestra Historia',
    description: 'En Softworks, creemos en hacer una de cada cosa realmente bien. Nuestra filosofía es crear prendas esenciales, intencionadas y de alto rendimiento que uses todos los días.'
  },
  headerImage: '/images/nosotrosheader.png',
  vision: {
    image: '/images/nosotros1.png',
    title: 'Nuestra Visión',
    paragraph1: 'Fundada en 2023, Softworks nació de la frustración con la moda rápida y la necesidad de crear algo verdaderamente atemporal. Queremos que cada prenda cuente una historia de calidad, durabilidad y diseño consciente.',
    paragraph2: 'Creemos que menos es más. Cada pieza de nuestra colección está diseñada para complementar tu guardarropa existente, no para reemplazarlo. Sostenibilidad a través de la simplicidad.'
  },
  values: {
    image: '/images/nosotros2.png',
    title: 'Nuestros Valores',
    items: [
      { title: 'Calidad sobre Cantidad', description: 'Menos piezas, mejor fabricadas' },
      { title: 'Diseño Atemporal', description: 'Prendas que trascienden las tendencias' },
      { title: 'Producción Ética', description: 'Respeto por quienes hacen nuestra ropa' },
      { title: 'Transparencia Total', description: 'Honestidad en cada paso del proceso' }
    ]
  },
  cta: {
    title: 'Conoce más sobre nuestro impacto',
    description: 'Descubre cómo estamos trabajando para crear un futuro más sostenible y equitativo',
    buttonText: 'Ver más',
    buttonLink: '/produccion'
  },
  customSections: []
};

const defaultProduccionContent: ProduccionContent = {
  hero: {
    title: 'Nuestra Producción',
    description: 'Cada prenda es fabricada con dedicación y precisión en nuestro taller. Nos comprometemos con la calidad artesanal y procesos responsables.'
  },
  pillars: [
    { title: 'Diseño Artesanal', description: 'Cada pieza diseñada con atención al detalle', image: '/images/impacto1.png' },
    { title: 'Calidad Premium', description: 'Materiales seleccionados y procesos cuidadosos', image: '/images/impacto2.png' },
    { title: 'Producción Local', description: 'Fabricado en Argentina con orgullo', image: '/images/impacto3.png' }
  ],
  customSections: []
};

const defaultEventosContent: EventosContent = {
  title: 'Eventos',
  subtitle: 'Únete a nosotros en nuestros próximos eventos y experiencias',
  upcomingTitle: 'Próximos Eventos',
  upcomingEvents: [
    {
      id: '1',
      image: '/images/showroom2.png',
      date: '06/05/2026',
      location: 'CABA',
      title: 'Showroom Palermo Nº2',
      description: 'Presentación de nuevas colecciones y productos.',
      modalInfo: {
        time: '18:00 - 22:00 hs',
        fullDescription: 'Únete a nosotros para la presentación exclusiva de nuestra nueva colección. Descubre las últimas tendencias, conoce el proceso detrás de cada diseño y disfruta de una experiencia única en nuestro showroom.',
        includes: 'Cocktail de bienvenida, música en vivo y descuentos exclusivos para asistentes.',
        buttonText: 'Reservar Entrada',
        buttonEmail: 'eventos@softworks.com'
      }
    }
  ],
  pastTitle: 'Eventos Pasados',
  pastEvents: [
    {
      id: '2',
      image: '/images/showroom1.png',
      date: '15/12/2025',
      location: 'Buenos Aires',
      title: 'Showroom Palermo Nº1',
      description: ''
    }
  ],
  customSections: []
};

const defaultUbicacionesContent: UbicacionesContent = {
  hero: {
    title: 'Dónde Encontrarnos',
    description: 'Visitanos en nuestro showroom en Palermo, Buenos Aires'
  },
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52562.20252003802!2d-58.45328229999999!3d-34.5875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb59c771eb933%3A0x6b3113b596d78c69!2sPalermo%2C%20Buenos%20Aires%2C%20Argentina!5e0!3m2!1ses!2sar!4v1234567890',
  location: {
    title: 'Showroom Palermo',
    address: 'Palermo, Buenos Aires, Argentina',
    note: 'Visítanos con cita previa',
    buttonText: 'Solicitar Cita',
    buttonEmail: 'contacto@softworks.com'
  },
  customSections: []
};

const defaultContactoContent: ContactoContent = {
  hero: {
    title: 'Contacto',
    subtitle1: 'Estamos aquí para ayudarte',
    subtitle2: 'Envíanos un mensaje en cualquier momento'
  },
  formLabels: {
    nombre: 'Nombre',
    email: 'Email',
    asunto: 'Asunto',
    mensaje: 'Mensaje',
    submitButton: 'Enviar Mensaje',
    submitting: 'Enviando...',
    successMessage: '¡Gracias por tu mensaje! Te responderemos pronto.'
  },
  infoSection: {
    title: 'Otras Formas de Contacto'
  },
  customSections: []
};

// ============ CONTEXT ============

interface PagesContentContextType {
  nosotros: NosotrosContent;
  produccion: ProduccionContent;
  eventos: EventosContent;
  ubicaciones: UbicacionesContent;
  contacto: ContactoContent;
  isLoading: boolean;
  refreshContent: () => Promise<void>;
}

const PagesContentContext = createContext<PagesContentContextType | undefined>(undefined);

export function PagesContentProvider({ children }: { children: ReactNode }) {
  const [nosotros, setNosotros] = useState<NosotrosContent>(defaultNosotrosContent);
  const [produccion, setProduccion] = useState<ProduccionContent>(defaultProduccionContent);
  const [eventos, setEventos] = useState<EventosContent>(defaultEventosContent);
  const [ubicaciones, setUbicaciones] = useState<UbicacionesContent>(defaultUbicacionesContent);
  const [contacto, setContacto] = useState<ContactoContent>(defaultContactoContent);
  const [isLoading, setIsLoading] = useState(true);

  const loadContent = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data } = await supabase
        .from('configuracion_sitio')
        .select('clave, valor')
        .in('clave', ['contenido_nosotros', 'contenido_produccion', 'contenido_eventos', 'contenido_ubicaciones', 'contenido_contacto']);

      if (data) {
        data.forEach((row: { clave: string; valor: string }) => {
          try {
            const parsed = JSON.parse(row.valor);
            switch (row.clave) {
              case 'contenido_nosotros':
                setNosotros({ ...defaultNosotrosContent, ...parsed });
                break;
              case 'contenido_produccion':
                setProduccion({ ...defaultProduccionContent, ...parsed });
                break;
              case 'contenido_eventos':
                setEventos({ ...defaultEventosContent, ...parsed });
                break;
              case 'contenido_ubicaciones':
                setUbicaciones({ ...defaultUbicacionesContent, ...parsed });
                break;
              case 'contenido_contacto':
                setContacto({ ...defaultContactoContent, ...parsed });
                break;
            }
          } catch (e) {
            console.error(`Error parsing ${row.clave}:`, e);
          }
        });
      }
    } catch (error) {
      console.error('Error loading pages content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Listen for real-time preview updates from the admin editor
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'content-preview') {
        try {
          const val = e.data.value;
          switch (e.data.key) {
            case 'contenido_nosotros':
              setNosotros({ ...defaultNosotrosContent, ...val });
              break;
            case 'contenido_produccion':
              setProduccion({ ...defaultProduccionContent, ...val });
              break;
            case 'contenido_eventos':
              setEventos({ ...defaultEventosContent, ...val });
              break;
            case 'contenido_ubicaciones':
              setUbicaciones({ ...defaultUbicacionesContent, ...val });
              break;
            case 'contenido_contacto':
              setContacto({ ...defaultContactoContent, ...val });
              break;
          }
        } catch (err) {
          console.error('Preview message error:', err);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <PagesContentContext.Provider value={{
      nosotros,
      produccion,
      eventos,
      ubicaciones,
      contacto,
      isLoading,
      refreshContent: loadContent
    }}>
      {children}
    </PagesContentContext.Provider>
  );
}

export function usePagesContent() {
  const context = useContext(PagesContentContext);
  if (context === undefined) {
    throw new Error('usePagesContent must be used within a PagesContentProvider');
  }
  return context;
}

// Export defaults for use in admin
export const defaultContents = {
  nosotros: defaultNosotrosContent,
  produccion: defaultProduccionContent,
  eventos: defaultEventosContent,
  ubicaciones: defaultUbicacionesContent,
  contacto: defaultContactoContent
};
