'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Layout, 
  Image as ImageIcon, 
  Type, 
  Save, 
  Loader2, 
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  X,
  Check,
  Upload,
  Layers,
  Square,
  Grid3X3,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSupabaseClient } from '@/lib/supabase/client';

// Tipos para el contenido del index
interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface ProductCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  size: 'large' | 'medium' | 'small';
}

interface LifestyleImage {
  id: string;
  image: string;
  label: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
}

interface BannerSection {
  image: string;
  title: string;
  subtitle: string;
}

interface PhilosophySection {
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface IndexContent {
  heroSlides: HeroSlide[];
  productCardsSection1: ProductCard[];
  philosophySection: PhilosophySection;
  lifestyleImages: LifestyleImage[];
  fullWidthBanner: BannerSection;
  contentGrid: ContentItem[];
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
      description: 'Confort urbano que redefine el estilo casual contemporáneo. Cada hoodie es una declaración de intención, fusionando siluetas oversized con detalles minimalistas que elevan tu guardarropa esencial.',
      image: '/images/hoodies.png',
      link: '/colecciones?categoria=hoodies',
      size: 'large',
    },
    {
      id: '2',
      title: 'Remeras',
      subtitle: '',
      description: 'Esencialismo minimalista en cada trazo y textura. Prendas fundamentales que trascienden temporadas, confeccionadas con tejidos premium.',
      image: '/images/shirts.png',
      link: '/colecciones?categoria=t-shirts',
      size: 'medium',
    },
    {
      id: '3',
      title: 'Gorras',
      subtitle: '',
      description: 'El detalle perfecto para un statement atemporal. Accesorios esenciales que completan cualquier outfit con un toque de sofisticación urbana.',
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
};

// Componente de sección colapsable
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminContenidosPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [content, setContent] = useState<IndexContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cargar contenido
  const loadContent = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('valor')
        .eq('clave', 'contenido_index')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando contenido:', error);
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
    if (isAdmin) {
      loadContent();
    }
  }, [isAdmin, loadContent]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Guardar contenido
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('configuracion_sitio')
        .upsert(
          { clave: 'contenido_index', valor: content },
          { onConflict: 'clave' }
        );

      if (error) throw error;

      showNotification('success', '¡Contenido guardado correctamente! Los cambios ya están activos.');
    } catch (error: any) {
      console.error('Error guardando:', error);
      showNotification('error', 'Error al guardar el contenido');
    } finally {
      setIsSaving(false);
    }
  };

  // Generar ID único
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handlers para Hero Slides
  const addHeroSlide = () => {
    setContent({
      ...content,
      heroSlides: [
        ...content.heroSlides,
        {
          id: generateId(),
          image: '/images/placeholder.png',
          title: 'Nuevo Slide',
          subtitle: 'Subtítulo',
          ctaText: 'Ver más',
          ctaLink: '/colecciones',
        },
      ],
    });
  };

  const updateHeroSlide = (id: string, field: keyof HeroSlide, value: string) => {
    setContent({
      ...content,
      heroSlides: content.heroSlides.map((slide) =>
        slide.id === id ? { ...slide, [field]: value } : slide
      ),
    });
  };

  const deleteHeroSlide = (id: string) => {
    if (content.heroSlides.length <= 1) {
      showNotification('error', 'Debe haber al menos un slide');
      return;
    }
    setContent({
      ...content,
      heroSlides: content.heroSlides.filter((slide) => slide.id !== id),
    });
  };

  // Handlers para Product Cards
  const updateProductCard = (id: string, field: keyof ProductCard, value: string) => {
    setContent({
      ...content,
      productCardsSection1: content.productCardsSection1.map((card) =>
        card.id === id ? { ...card, [field]: value } : card
      ),
    });
  };

  // Handlers para Philosophy Section
  const updatePhilosophy = (field: keyof PhilosophySection, value: string) => {
    setContent({
      ...content,
      philosophySection: { ...content.philosophySection, [field]: value },
    });
  };

  // Handlers para Lifestyle Images
  const updateLifestyleImage = (id: string, field: keyof LifestyleImage, value: string) => {
    setContent({
      ...content,
      lifestyleImages: content.lifestyleImages.map((img) =>
        img.id === id ? { ...img, [field]: value } : img
      ),
    });
  };

  // Handlers para Full Width Banner
  const updateBanner = (field: keyof BannerSection, value: string) => {
    setContent({
      ...content,
      fullWidthBanner: { ...content.fullWidthBanner, [field]: value },
    });
  };

  // Handlers para Content Grid
  const updateContentItem = (id: string, field: keyof ContentItem, value: string) => {
    setContent({
      ...content,
      contentGrid: content.contentGrid.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // Estados de carga
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta página.</p>
          <Link href="/" className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-8 pb-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Notificación */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-24 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                  notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
              >
                {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-medium flex items-center gap-3">
                  <Layout className="w-8 h-8" />
                  Editor de Contenidos
                </h1>
                <p className="text-gray-500 mt-1">Edita el contenido de la página principal</p>
              </div>
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver Sitio
              </Link>
            </div>
          </div>

          {/* Secciones de contenido */}
          <div className="space-y-4">
            {/* Hero Slideshow */}
            <CollapsibleSection title="Hero Slideshow" icon={Layers} defaultOpen={true}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Configura los slides del banner principal. Cada slide tiene una imagen, título, subtítulo y botón de acción.
                </p>
                
                {content.heroSlides.map((slide, index) => (
                  <div key={slide.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Slide {index + 1}</span>
                      <button
                        onClick={() => deleteHeroSlide(slide.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={slide.image}
                            onChange={(e) => updateHeroSlide(slide.id, 'image', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="/images/banner.png"
                          />
                        </div>
                        {slide.image && (
                          <div className="mt-2 aspect-video rounded overflow-hidden bg-gray-100 relative">
                            <Image src={slide.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => updateHeroSlide(slide.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                          <input
                            type="text"
                            value={slide.subtitle}
                            onChange={(e) => updateHeroSlide(slide.id, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Texto Botón</label>
                            <input
                              type="text"
                              value={slide.ctaText}
                              onChange={(e) => updateHeroSlide(slide.id, 'ctaText', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link Botón</label>
                            <input
                              type="text"
                              value={slide.ctaLink}
                              onChange={(e) => updateHeroSlide(slide.id, 'ctaLink', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addHeroSlide}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Slide
                </button>
              </div>
            </CollapsibleSection>

            {/* Tarjetas de Productos */}
            <CollapsibleSection title="Tarjetas de Productos" icon={Grid3X3}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Edita las tarjetas de productos destacados que aparecen después del hero.
                </p>

                {content.productCardsSection1.map((card, index) => (
                  <div key={card.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-medium text-gray-700">{card.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">{card.size}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                        <input
                          type="text"
                          value={card.image}
                          onChange={(e) => updateProductCard(card.id, 'image', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {card.image && (
                          <div className="mt-2 aspect-video rounded overflow-hidden bg-gray-100 relative">
                            <Image src={card.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => updateProductCard(card.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                          <input
                            type="text"
                            value={card.subtitle}
                            onChange={(e) => updateProductCard(card.id, 'subtitle', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                          <input
                            type="text"
                            value={card.link}
                            onChange={(e) => updateProductCard(card.id, 'link', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <textarea
                        value={card.description}
                        onChange={(e) => updateProductCard(card.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Sección de Filosofía */}
            <CollapsibleSection title="Sección de Filosofía" icon={Type}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Edita el contenido de la sección "Una de cada cosa realmente bien".
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título (usa \n para salto de línea)</label>
                  <input
                    type="text"
                    value={content.philosophySection.title}
                    onChange={(e) => updatePhilosophy('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={content.philosophySection.description}
                    onChange={(e) => updatePhilosophy('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Texto del Botón</label>
                    <input
                      type="text"
                      value={content.philosophySection.ctaText}
                      onChange={(e) => updatePhilosophy('ctaText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link del Botón</label>
                    <input
                      type="text"
                      value={content.philosophySection.ctaLink}
                      onChange={(e) => updatePhilosophy('ctaLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Imágenes Lifestyle */}
            <CollapsibleSection title="Galería Lifestyle" icon={ImageIcon}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Edita las 4 imágenes de la galería lifestyle.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {content.lifestyleImages.map((img, index) => (
                    <div key={img.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imagen {index + 1}</label>
                      <input
                        type="text"
                        value={img.image}
                        onChange={(e) => updateLifestyleImage(img.id, 'image', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
                        placeholder="/images/item.png"
                      />
                      <input
                        type="text"
                        value={img.label}
                        onChange={(e) => updateLifestyleImage(img.id, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Etiqueta"
                      />
                      {img.image && (
                        <div className="mt-2 aspect-[3/4] rounded overflow-hidden bg-gray-100 relative">
                          <Image src={img.image} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* Banner Full Width */}
            <CollapsibleSection title="Banner Full Width" icon={Square}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Edita el banner de ancho completo "Diseñado para durar".
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Fondo</label>
                  <input
                    type="text"
                    value={content.fullWidthBanner.image}
                    onChange={(e) => updateBanner('image', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {content.fullWidthBanner.image && (
                    <div className="mt-2 aspect-[21/9] rounded overflow-hidden bg-gray-100 relative">
                      <Image src={content.fullWidthBanner.image} alt="" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="text-center text-white">
                          <p className="text-2xl font-medium">{content.fullWidthBanner.title}</p>
                          <p className="text-white/90">{content.fullWidthBanner.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={content.fullWidthBanner.title}
                      onChange={(e) => updateBanner('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={content.fullWidthBanner.subtitle}
                      onChange={(e) => updateBanner('subtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Grid de Contenido Final */}
            <CollapsibleSection title="Grid de Contenido" icon={Grid3X3}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">
                  Edita las 3 tarjetas del grid final (Misión, Filantropía, Sostenibilidad).
                </p>
                
                {content.contentGrid.map((item, index) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 mb-3 block">Tarjeta {index + 1}</span>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                        <input
                          type="text"
                          value={item.image}
                          onChange={(e) => updateContentItem(item.id, 'image', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {item.image && (
                          <div className="mt-2 aspect-square rounded overflow-hidden bg-gray-100 relative">
                            <Image src={item.image} alt="" fill className="object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateContentItem(item.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateContentItem(item.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                          <input
                            type="text"
                            value={item.link}
                            onChange={(e) => updateContentItem(item.id, 'link', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* Botón flotante de guardar */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-foreground text-white rounded-full shadow-lg hover:bg-foreground/90 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
