'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Home,
  Users,
  Factory,
  Calendar,
  MapPin,
  Phone,
  Image as ImageIcon,
  FileText,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIndexContent, type IndexContent, type HeroSlide, type ProductCard, type LifestyleImage, type ContentItem } from '@/lib/hooks/useIndexContent';
import { 
  usePagesContent, 
  type NosotrosContent,
  type ProduccionContent,
  type EventosContent,
  type UbicacionesContent,
  type ContactoContent
} from '@/lib/hooks/usePagesContent';
import { getSupabaseClient } from '@/lib/supabase/client';

type PageType = 'index' | 'nosotros' | 'produccion' | 'eventos' | 'ubicaciones' | 'contacto';

interface PageOption {
  id: PageType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const pageOptions: PageOption[] = [
  { id: 'index', label: 'Página Principal', icon: <Home className="w-5 h-5" />, description: 'Hero, productos destacados, filosofía' },
  { id: 'nosotros', label: 'Nosotros', icon: <Users className="w-5 h-5" />, description: 'Historia, visión y valores' },
  { id: 'produccion', label: 'Producción', icon: <Factory className="w-5 h-5" />, description: 'Pilares de producción' },
  { id: 'eventos', label: 'Eventos', icon: <Calendar className="w-5 h-5" />, description: 'Eventos próximos y pasados' },
  { id: 'ubicaciones', label: 'Ubicaciones', icon: <MapPin className="w-5 h-5" />, description: 'Mapa y showroom' },
  { id: 'contacto', label: 'Contacto', icon: <Phone className="w-5 h-5" />, description: 'Formulario y etiquetas' },
];

// Collapsible Section Component
function CollapsibleSection({ 
  title, 
  icon,
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon?: React.ReactNode;
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Input Field Component
function InputField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  rows
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'url';
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      )}
    </div>
  );
}

// Select Field Component
function SelectField({ 
  label, 
  value, 
  onChange,
  options
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Image Preview Component
function ImagePreview({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="mt-2 relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function AdminContenidosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { content: indexContent, refreshContent: refreshIndex } = useIndexContent();
  const { nosotros, produccion, eventos, ubicaciones, contacto, refreshContent: refreshPages } = usePagesContent();
  
  const [selectedPage, setSelectedPage] = useState<PageType>('index');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Local state for each page
  const [localIndex, setLocalIndex] = useState<IndexContent>(indexContent);
  const [localNosotros, setLocalNosotros] = useState<NosotrosContent>(nosotros);
  const [localProduccion, setLocalProduccion] = useState<ProduccionContent>(produccion);
  const [localEventos, setLocalEventos] = useState<EventosContent>(eventos);
  const [localUbicaciones, setLocalUbicaciones] = useState<UbicacionesContent>(ubicaciones);
  const [localContacto, setLocalContacto] = useState<ContactoContent>(contacto);

  // Sync with context
  useEffect(() => { setLocalIndex(indexContent); }, [indexContent]);
  useEffect(() => { setLocalNosotros(nosotros); }, [nosotros]);
  useEffect(() => { setLocalProduccion(produccion); }, [produccion]);
  useEffect(() => { setLocalEventos(eventos); }, [eventos]);
  useEffect(() => { setLocalUbicaciones(ubicaciones); }, [ubicaciones]);
  useEffect(() => { setLocalContacto(contacto); }, [contacto]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    const supabase = getSupabaseClient();

    try {
      let clave = '';
      let valor = '';

      switch (selectedPage) {
        case 'index':
          clave = 'contenido_index';
          valor = JSON.stringify(localIndex);
          break;
        case 'nosotros':
          clave = 'contenido_nosotros';
          valor = JSON.stringify(localNosotros);
          break;
        case 'produccion':
          clave = 'contenido_produccion';
          valor = JSON.stringify(localProduccion);
          break;
        case 'eventos':
          clave = 'contenido_eventos';
          valor = JSON.stringify(localEventos);
          break;
        case 'ubicaciones':
          clave = 'contenido_ubicaciones';
          valor = JSON.stringify(localUbicaciones);
          break;
        case 'contacto':
          clave = 'contenido_contacto';
          valor = JSON.stringify(localContacto);
          break;
      }

      const { error } = await supabase
        .from('configuracion_sitio')
        .upsert({ clave, valor }, { onConflict: 'clave' });

      if (error) throw error;

      if (selectedPage === 'index') {
        await refreshIndex();
      } else {
        await refreshPages();
      }

      setSaveMessage('¡Contenido guardado exitosamente!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveMessage('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <p className="text-red-500">Acceso denegado. Solo administradores.</p>
      </div>
    );
  }

  // ============ INDEX EDITOR ============
  const renderIndexEditor = () => (
    <div className="space-y-4">
      {/* Hero Slides */}
      <CollapsibleSection title="Hero Slides (Carrusel Principal)" icon={<ImageIcon className="w-5 h-5" />} defaultOpen>
        {localIndex.heroSlides.map((slide, idx) => (
          <div key={slide.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Slide {idx + 1}</span>
              {localIndex.heroSlides.length > 1 && (
                <button
                  onClick={() => {
                    const newSlides = localIndex.heroSlides.filter((_, i) => i !== idx);
                    setLocalIndex({ ...localIndex, heroSlides: newSlides });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <InputField
              label="URL de Imagen"
              value={slide.image}
              onChange={(v) => {
                const newSlides = [...localIndex.heroSlides];
                newSlides[idx] = { ...newSlides[idx], image: v };
                setLocalIndex({ ...localIndex, heroSlides: newSlides });
              }}
            />
            <ImagePreview src={slide.image} alt={`Slide ${idx + 1}`} />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Título"
                value={slide.title}
                onChange={(v) => {
                  const newSlides = [...localIndex.heroSlides];
                  newSlides[idx] = { ...newSlides[idx], title: v };
                  setLocalIndex({ ...localIndex, heroSlides: newSlides });
                }}
              />
              <InputField
                label="Subtítulo"
                value={slide.subtitle}
                onChange={(v) => {
                  const newSlides = [...localIndex.heroSlides];
                  newSlides[idx] = { ...newSlides[idx], subtitle: v };
                  setLocalIndex({ ...localIndex, heroSlides: newSlides });
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Texto del Botón"
                value={slide.ctaText}
                onChange={(v) => {
                  const newSlides = [...localIndex.heroSlides];
                  newSlides[idx] = { ...newSlides[idx], ctaText: v };
                  setLocalIndex({ ...localIndex, heroSlides: newSlides });
                }}
              />
              <InputField
                label="Link del Botón"
                value={slide.ctaLink}
                onChange={(v) => {
                  const newSlides = [...localIndex.heroSlides];
                  newSlides[idx] = { ...newSlides[idx], ctaLink: v };
                  setLocalIndex({ ...localIndex, heroSlides: newSlides });
                }}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => {
            const newSlide: HeroSlide = {
              id: generateId(),
              image: '/images/placeholder.png',
              title: 'Nuevo Slide',
              subtitle: 'Subtítulo',
              ctaText: 'Ver más',
              ctaLink: '/colecciones'
            };
            setLocalIndex({
              ...localIndex,
              heroSlides: [...localIndex.heroSlides, newSlide]
            });
          }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Agregar Slide
        </button>
      </CollapsibleSection>

      {/* Product Cards */}
      <CollapsibleSection title="Cards de Productos" icon={<FileText className="w-5 h-5" />}>
        {localIndex.productCardsSection1.map((card, idx) => (
          <div key={card.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Card {idx + 1}</span>
              {localIndex.productCardsSection1.length > 1 && (
                <button
                  onClick={() => {
                    const newCards = localIndex.productCardsSection1.filter((_, i) => i !== idx);
                    setLocalIndex({ ...localIndex, productCardsSection1: newCards });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <InputField
              label="URL de Imagen"
              value={card.image}
              onChange={(v) => {
                const newCards = [...localIndex.productCardsSection1];
                newCards[idx] = { ...newCards[idx], image: v };
                setLocalIndex({ ...localIndex, productCardsSection1: newCards });
              }}
            />
            <ImagePreview src={card.image} alt={card.title} />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Título"
                value={card.title}
                onChange={(v) => {
                  const newCards = [...localIndex.productCardsSection1];
                  newCards[idx] = { ...newCards[idx], title: v };
                  setLocalIndex({ ...localIndex, productCardsSection1: newCards });
                }}
              />
              <InputField
                label="Subtítulo"
                value={card.subtitle}
                onChange={(v) => {
                  const newCards = [...localIndex.productCardsSection1];
                  newCards[idx] = { ...newCards[idx], subtitle: v };
                  setLocalIndex({ ...localIndex, productCardsSection1: newCards });
                }}
              />
            </div>
            <InputField
              label="Descripción"
              type="textarea"
              rows={3}
              value={card.description}
              onChange={(v) => {
                const newCards = [...localIndex.productCardsSection1];
                newCards[idx] = { ...newCards[idx], description: v };
                setLocalIndex({ ...localIndex, productCardsSection1: newCards });
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Link"
                value={card.link}
                onChange={(v) => {
                  const newCards = [...localIndex.productCardsSection1];
                  newCards[idx] = { ...newCards[idx], link: v };
                  setLocalIndex({ ...localIndex, productCardsSection1: newCards });
                }}
              />
              <SelectField
                label="Tamaño"
                value={card.size}
                onChange={(v) => {
                  const newCards = [...localIndex.productCardsSection1];
                  newCards[idx] = { ...newCards[idx], size: v as 'large' | 'medium' | 'small' };
                  setLocalIndex({ ...localIndex, productCardsSection1: newCards });
                }}
                options={[
                  { value: 'large', label: 'Grande' },
                  { value: 'medium', label: 'Mediano' },
                  { value: 'small', label: 'Pequeño' }
                ]}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => {
            const newCard: ProductCard = {
              id: generateId(),
              title: 'Nueva Categoría',
              subtitle: '',
              description: 'Descripción de la categoría',
              image: '/images/placeholder.png',
              link: '/colecciones',
              size: 'medium'
            };
            setLocalIndex({
              ...localIndex,
              productCardsSection1: [...localIndex.productCardsSection1, newCard]
            });
          }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Agregar Card
        </button>
      </CollapsibleSection>

      {/* Philosophy Section */}
      <CollapsibleSection title="Sección Filosofía" icon={<FileText className="w-5 h-5" />}>
        <InputField
          label="Título (usa \n para salto de línea)"
          value={localIndex.philosophySection.title}
          onChange={(v) => setLocalIndex({
            ...localIndex,
            philosophySection: { ...localIndex.philosophySection, title: v }
          })}
        />
        <InputField
          label="Descripción"
          type="textarea"
          rows={4}
          value={localIndex.philosophySection.description}
          onChange={(v) => setLocalIndex({
            ...localIndex,
            philosophySection: { ...localIndex.philosophySection, description: v }
          })}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Texto del Botón"
            value={localIndex.philosophySection.ctaText}
            onChange={(v) => setLocalIndex({
              ...localIndex,
              philosophySection: { ...localIndex.philosophySection, ctaText: v }
            })}
          />
          <InputField
            label="Link del Botón"
            value={localIndex.philosophySection.ctaLink}
            onChange={(v) => setLocalIndex({
              ...localIndex,
              philosophySection: { ...localIndex.philosophySection, ctaLink: v }
            })}
          />
        </div>
      </CollapsibleSection>

      {/* Lifestyle Images */}
      <CollapsibleSection title="Imágenes Lifestyle" icon={<ImageIcon className="w-5 h-5" />}>
        {localIndex.lifestyleImages.map((img, idx) => (
          <div key={img.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Imagen {idx + 1}</span>
              {localIndex.lifestyleImages.length > 1 && (
                <button
                  onClick={() => {
                    const newImages = localIndex.lifestyleImages.filter((_, i) => i !== idx);
                    setLocalIndex({ ...localIndex, lifestyleImages: newImages });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <InputField
              label="URL de Imagen"
              value={img.image}
              onChange={(v) => {
                const newImages = [...localIndex.lifestyleImages];
                newImages[idx] = { ...newImages[idx], image: v };
                setLocalIndex({ ...localIndex, lifestyleImages: newImages });
              }}
            />
            <ImagePreview src={img.image} alt={img.label} />
            <InputField
              label="Etiqueta"
              value={img.label}
              onChange={(v) => {
                const newImages = [...localIndex.lifestyleImages];
                newImages[idx] = { ...newImages[idx], label: v };
                setLocalIndex({ ...localIndex, lifestyleImages: newImages });
              }}
            />
          </div>
        ))}
        <button
          onClick={() => {
            const newImage: LifestyleImage = {
              id: generateId(),
              image: '/images/placeholder.png',
              label: 'Nueva Imagen'
            };
            setLocalIndex({
              ...localIndex,
              lifestyleImages: [...localIndex.lifestyleImages, newImage]
            });
          }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Agregar Imagen
        </button>
      </CollapsibleSection>

      {/* Full Width Banner */}
      <CollapsibleSection title="Banner Full Width" icon={<ImageIcon className="w-5 h-5" />}>
        <InputField
          label="URL de Imagen"
          value={localIndex.fullWidthBanner.image}
          onChange={(v) => setLocalIndex({
            ...localIndex,
            fullWidthBanner: { ...localIndex.fullWidthBanner, image: v }
          })}
        />
        <ImagePreview src={localIndex.fullWidthBanner.image} alt="Banner" />
        <InputField
          label="Título"
          value={localIndex.fullWidthBanner.title}
          onChange={(v) => setLocalIndex({
            ...localIndex,
            fullWidthBanner: { ...localIndex.fullWidthBanner, title: v }
          })}
        />
        <InputField
          label="Subtítulo"
          value={localIndex.fullWidthBanner.subtitle}
          onChange={(v) => setLocalIndex({
            ...localIndex,
            fullWidthBanner: { ...localIndex.fullWidthBanner, subtitle: v }
          })}
        />
      </CollapsibleSection>

      {/* Content Grid */}
      <CollapsibleSection title="Grid de Contenido (3 Columnas)" icon={<FileText className="w-5 h-5" />}>
        {localIndex.contentGrid.map((item, idx) => (
          <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Columna {idx + 1}</span>
              {localIndex.contentGrid.length > 1 && (
                <button
                  onClick={() => {
                    const newGrid = localIndex.contentGrid.filter((_, i) => i !== idx);
                    setLocalIndex({ ...localIndex, contentGrid: newGrid });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <InputField
              label="URL de Imagen"
              value={item.image}
              onChange={(v) => {
                const newGrid = [...localIndex.contentGrid];
                newGrid[idx] = { ...newGrid[idx], image: v };
                setLocalIndex({ ...localIndex, contentGrid: newGrid });
              }}
            />
            <ImagePreview src={item.image} alt={item.title} />
            <InputField
              label="Título"
              value={item.title}
              onChange={(v) => {
                const newGrid = [...localIndex.contentGrid];
                newGrid[idx] = { ...newGrid[idx], title: v };
                setLocalIndex({ ...localIndex, contentGrid: newGrid });
              }}
            />
            <InputField
              label="Descripción"
              value={item.description}
              onChange={(v) => {
                const newGrid = [...localIndex.contentGrid];
                newGrid[idx] = { ...newGrid[idx], description: v };
                setLocalIndex({ ...localIndex, contentGrid: newGrid });
              }}
            />
            <InputField
              label="Link"
              value={item.link}
              onChange={(v) => {
                const newGrid = [...localIndex.contentGrid];
                newGrid[idx] = { ...newGrid[idx], link: v };
                setLocalIndex({ ...localIndex, contentGrid: newGrid });
              }}
            />
          </div>
        ))}
        <button
          onClick={() => {
            const newItem: ContentItem = {
              id: generateId(),
              title: 'Nuevo Item',
              description: 'Descripción',
              image: '/images/placeholder.png',
              link: '/'
            };
            setLocalIndex({
              ...localIndex,
              contentGrid: [...localIndex.contentGrid, newItem]
            });
          }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Agregar Columna
        </button>
      </CollapsibleSection>
    </div>
  );

  // ============ NOSOTROS EDITOR ============
  const renderNosotrosEditor = () => (
    <div className="space-y-4">
      <CollapsibleSection title="Hero Section" icon={<FileText className="w-5 h-5" />} defaultOpen>
        <InputField label="Título" value={localNosotros.hero.title} onChange={(v) => setLocalNosotros({ ...localNosotros, hero: { ...localNosotros.hero, title: v } })} />
        <InputField label="Descripción" type="textarea" rows={3} value={localNosotros.hero.description} onChange={(v) => setLocalNosotros({ ...localNosotros, hero: { ...localNosotros.hero, description: v } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Imagen Header" icon={<ImageIcon className="w-5 h-5" />}>
        <InputField label="URL de Imagen" value={localNosotros.headerImage} onChange={(v) => setLocalNosotros({ ...localNosotros, headerImage: v })} />
        <ImagePreview src={localNosotros.headerImage} alt="Header" />
      </CollapsibleSection>

      <CollapsibleSection title="Sección Visión" icon={<FileText className="w-5 h-5" />}>
        <InputField label="URL de Imagen" value={localNosotros.vision.image} onChange={(v) => setLocalNosotros({ ...localNosotros, vision: { ...localNosotros.vision, image: v } })} />
        <ImagePreview src={localNosotros.vision.image} alt="Vision" />
        <InputField label="Título" value={localNosotros.vision.title} onChange={(v) => setLocalNosotros({ ...localNosotros, vision: { ...localNosotros.vision, title: v } })} />
        <InputField label="Párrafo 1" type="textarea" rows={3} value={localNosotros.vision.paragraph1} onChange={(v) => setLocalNosotros({ ...localNosotros, vision: { ...localNosotros.vision, paragraph1: v } })} />
        <InputField label="Párrafo 2" type="textarea" rows={3} value={localNosotros.vision.paragraph2} onChange={(v) => setLocalNosotros({ ...localNosotros, vision: { ...localNosotros.vision, paragraph2: v } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Sección Valores" icon={<FileText className="w-5 h-5" />}>
        <InputField label="URL de Imagen" value={localNosotros.values.image} onChange={(v) => setLocalNosotros({ ...localNosotros, values: { ...localNosotros.values, image: v } })} />
        <ImagePreview src={localNosotros.values.image} alt="Values" />
        <InputField label="Título" value={localNosotros.values.title} onChange={(v) => setLocalNosotros({ ...localNosotros, values: { ...localNosotros.values, title: v } })} />
        <div className="space-y-3">
          <span className="font-medium">Valores:</span>
          {localNosotros.values.items.map((item, idx) => (
            <div key={idx} className="p-3 border border-gray-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Valor {idx + 1}</span>
                {localNosotros.values.items.length > 1 && (
                  <button onClick={() => {
                    const newItems = localNosotros.values.items.filter((_, i) => i !== idx);
                    setLocalNosotros({ ...localNosotros, values: { ...localNosotros.values, items: newItems } });
                  }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <InputField label="Título" value={item.title} onChange={(v) => {
                const newItems = [...localNosotros.values.items];
                newItems[idx] = { ...newItems[idx], title: v };
                setLocalNosotros({ ...localNosotros, values: { ...localNosotros.values, items: newItems } });
              }} />
              <InputField label="Descripción" value={item.description} onChange={(v) => {
                const newItems = [...localNosotros.values.items];
                newItems[idx] = { ...newItems[idx], description: v };
                setLocalNosotros({ ...localNosotros, values: { ...localNosotros.values, items: newItems } });
              }} />
            </div>
          ))}
          <button onClick={() => {
            setLocalNosotros({ ...localNosotros, values: { ...localNosotros.values, items: [...localNosotros.values.items, { title: 'Nuevo Valor', description: 'Descripción' }] } });
          }} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center">
            <Plus className="w-4 h-4" /> Agregar Valor
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Sección CTA" icon={<FileText className="w-5 h-5" />}>
        <InputField label="Título" value={localNosotros.cta.title} onChange={(v) => setLocalNosotros({ ...localNosotros, cta: { ...localNosotros.cta, title: v } })} />
        <InputField label="Descripción" type="textarea" value={localNosotros.cta.description} onChange={(v) => setLocalNosotros({ ...localNosotros, cta: { ...localNosotros.cta, description: v } })} />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Texto del Botón" value={localNosotros.cta.buttonText} onChange={(v) => setLocalNosotros({ ...localNosotros, cta: { ...localNosotros.cta, buttonText: v } })} />
          <InputField label="Link del Botón" value={localNosotros.cta.buttonLink} onChange={(v) => setLocalNosotros({ ...localNosotros, cta: { ...localNosotros.cta, buttonLink: v } })} />
        </div>
      </CollapsibleSection>
    </div>
  );

  // ============ PRODUCCION EDITOR ============
  const renderProduccionEditor = () => (
    <div className="space-y-4">
      <CollapsibleSection title="Hero Section" icon={<FileText className="w-5 h-5" />} defaultOpen>
        <InputField label="Título" value={localProduccion.hero.title} onChange={(v) => setLocalProduccion({ ...localProduccion, hero: { ...localProduccion.hero, title: v } })} />
        <InputField label="Descripción" type="textarea" rows={3} value={localProduccion.hero.description} onChange={(v) => setLocalProduccion({ ...localProduccion, hero: { ...localProduccion.hero, description: v } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Pilares de Producción" icon={<Factory className="w-5 h-5" />}>
        {localProduccion.pillars.map((pillar, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Pilar {idx + 1}</span>
              {localProduccion.pillars.length > 1 && (
                <button onClick={() => {
                  const newPillars = localProduccion.pillars.filter((_, i) => i !== idx);
                  setLocalProduccion({ ...localProduccion, pillars: newPillars });
                }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
            <InputField label="URL de Imagen" value={pillar.image} onChange={(v) => {
              const newPillars = [...localProduccion.pillars];
              newPillars[idx] = { ...newPillars[idx], image: v };
              setLocalProduccion({ ...localProduccion, pillars: newPillars });
            }} />
            <ImagePreview src={pillar.image} alt={pillar.title} />
            <InputField label="Título" value={pillar.title} onChange={(v) => {
              const newPillars = [...localProduccion.pillars];
              newPillars[idx] = { ...newPillars[idx], title: v };
              setLocalProduccion({ ...localProduccion, pillars: newPillars });
            }} />
            <InputField label="Descripción" value={pillar.description} onChange={(v) => {
              const newPillars = [...localProduccion.pillars];
              newPillars[idx] = { ...newPillars[idx], description: v };
              setLocalProduccion({ ...localProduccion, pillars: newPillars });
            }} />
          </div>
        ))}
        <button onClick={() => {
          setLocalProduccion({ ...localProduccion, pillars: [...localProduccion.pillars, { title: 'Nuevo Pilar', description: 'Descripción', image: '/images/placeholder.png' }] });
        }} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center">
          <Plus className="w-4 h-4" /> Agregar Pilar
        </button>
      </CollapsibleSection>
    </div>
  );

  // ============ EVENTOS EDITOR ============
  const renderEventosEditor = () => (
    <div className="space-y-4">
      <CollapsibleSection title="Encabezado de Página" icon={<FileText className="w-5 h-5" />} defaultOpen>
        <InputField label="Título" value={localEventos.title} onChange={(v) => setLocalEventos({ ...localEventos, title: v })} />
        <InputField label="Subtítulo" value={localEventos.subtitle} onChange={(v) => setLocalEventos({ ...localEventos, subtitle: v })} />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Título Próximos Eventos" value={localEventos.upcomingTitle} onChange={(v) => setLocalEventos({ ...localEventos, upcomingTitle: v })} />
          <InputField label="Título Eventos Pasados" value={localEventos.pastTitle} onChange={(v) => setLocalEventos({ ...localEventos, pastTitle: v })} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Próximos Eventos" icon={<Calendar className="w-5 h-5" />}>
        {localEventos.upcomingEvents.map((evento, idx) => (
          <div key={evento.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Evento {idx + 1}</span>
              <button onClick={() => {
                const newEvents = localEventos.upcomingEvents.filter((_, i) => i !== idx);
                setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
              }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
            <InputField label="URL de Imagen" value={evento.image} onChange={(v) => {
              const newEvents = [...localEventos.upcomingEvents];
              newEvents[idx] = { ...newEvents[idx], image: v };
              setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
            }} />
            <ImagePreview src={evento.image} alt={evento.title} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Fecha" value={evento.date} onChange={(v) => {
                const newEvents = [...localEventos.upcomingEvents];
                newEvents[idx] = { ...newEvents[idx], date: v };
                setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
              }} />
              <InputField label="Ubicación" value={evento.location} onChange={(v) => {
                const newEvents = [...localEventos.upcomingEvents];
                newEvents[idx] = { ...newEvents[idx], location: v };
                setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
              }} />
            </div>
            <InputField label="Título" value={evento.title} onChange={(v) => {
              const newEvents = [...localEventos.upcomingEvents];
              newEvents[idx] = { ...newEvents[idx], title: v };
              setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
            }} />
            <InputField label="Descripción Corta" value={evento.description} onChange={(v) => {
              const newEvents = [...localEventos.upcomingEvents];
              newEvents[idx] = { ...newEvents[idx], description: v };
              setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
            }} />
            {evento.modalInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
                <span className="font-medium text-sm">Información del Modal:</span>
                <InputField label="Horario" value={evento.modalInfo.time} onChange={(v) => {
                  const newEvents = [...localEventos.upcomingEvents];
                  newEvents[idx] = { ...newEvents[idx], modalInfo: { ...newEvents[idx].modalInfo!, time: v } };
                  setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
                }} />
                <InputField label="Descripción Completa" type="textarea" rows={3} value={evento.modalInfo.fullDescription} onChange={(v) => {
                  const newEvents = [...localEventos.upcomingEvents];
                  newEvents[idx] = { ...newEvents[idx], modalInfo: { ...newEvents[idx].modalInfo!, fullDescription: v } };
                  setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
                }} />
                <InputField label="Incluye" value={evento.modalInfo.includes} onChange={(v) => {
                  const newEvents = [...localEventos.upcomingEvents];
                  newEvents[idx] = { ...newEvents[idx], modalInfo: { ...newEvents[idx].modalInfo!, includes: v } };
                  setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
                }} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Texto del Botón" value={evento.modalInfo.buttonText} onChange={(v) => {
                    const newEvents = [...localEventos.upcomingEvents];
                    newEvents[idx] = { ...newEvents[idx], modalInfo: { ...newEvents[idx].modalInfo!, buttonText: v } };
                    setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
                  }} />
                  <InputField label="Email del Botón" value={evento.modalInfo.buttonEmail} onChange={(v) => {
                    const newEvents = [...localEventos.upcomingEvents];
                    newEvents[idx] = { ...newEvents[idx], modalInfo: { ...newEvents[idx].modalInfo!, buttonEmail: v } };
                    setLocalEventos({ ...localEventos, upcomingEvents: newEvents });
                  }} />
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={() => {
          const newEvent = { id: generateId(), image: '/images/placeholder.png', date: 'DD/MM/YYYY', location: 'Buenos Aires', title: 'Nuevo Evento', description: 'Descripción', modalInfo: { time: '18:00 - 22:00 hs', fullDescription: 'Descripción completa.', includes: 'Incluye...', buttonText: 'Reservar', buttonEmail: 'eventos@softworks.com' } };
          setLocalEventos({ ...localEventos, upcomingEvents: [...localEventos.upcomingEvents, newEvent] });
        }} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center">
          <Plus className="w-4 h-4" /> Agregar Evento Próximo
        </button>
      </CollapsibleSection>

      <CollapsibleSection title="Eventos Pasados" icon={<Calendar className="w-5 h-5" />}>
        {localEventos.pastEvents.map((evento, idx) => (
          <div key={evento.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Evento Pasado {idx + 1}</span>
              <button onClick={() => {
                const newEvents = localEventos.pastEvents.filter((_, i) => i !== idx);
                setLocalEventos({ ...localEventos, pastEvents: newEvents });
              }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
            </div>
            <InputField label="URL de Imagen" value={evento.image} onChange={(v) => {
              const newEvents = [...localEventos.pastEvents];
              newEvents[idx] = { ...newEvents[idx], image: v };
              setLocalEventos({ ...localEventos, pastEvents: newEvents });
            }} />
            <ImagePreview src={evento.image} alt={evento.title} />
            <InputField label="Título" value={evento.title} onChange={(v) => {
              const newEvents = [...localEventos.pastEvents];
              newEvents[idx] = { ...newEvents[idx], title: v };
              setLocalEventos({ ...localEventos, pastEvents: newEvents });
            }} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Fecha" value={evento.date} onChange={(v) => {
                const newEvents = [...localEventos.pastEvents];
                newEvents[idx] = { ...newEvents[idx], date: v };
                setLocalEventos({ ...localEventos, pastEvents: newEvents });
              }} />
              <InputField label="Ubicación" value={evento.location} onChange={(v) => {
                const newEvents = [...localEventos.pastEvents];
                newEvents[idx] = { ...newEvents[idx], location: v };
                setLocalEventos({ ...localEventos, pastEvents: newEvents });
              }} />
            </div>
          </div>
        ))}
        <button onClick={() => {
          const newEvent = { id: generateId(), image: '/images/placeholder.png', date: 'DD/MM/YYYY', location: 'Buenos Aires', title: 'Evento Pasado', description: '' };
          setLocalEventos({ ...localEventos, pastEvents: [...localEventos.pastEvents, newEvent] });
        }} className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center">
          <Plus className="w-4 h-4" /> Agregar Evento Pasado
        </button>
      </CollapsibleSection>
    </div>
  );

  // ============ UBICACIONES EDITOR ============
  const renderUbicacionesEditor = () => (
    <div className="space-y-4">
      <CollapsibleSection title="Encabezado" icon={<FileText className="w-5 h-5" />} defaultOpen>
        <InputField label="Título" value={localUbicaciones.hero.title} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, hero: { ...localUbicaciones.hero, title: v } })} />
        <InputField label="Descripción" value={localUbicaciones.hero.description} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, hero: { ...localUbicaciones.hero, description: v } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Mapa de Google" icon={<MapPin className="w-5 h-5" />}>
        <InputField label="URL de Embed del Mapa" type="url" value={localUbicaciones.mapEmbedUrl} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, mapEmbedUrl: v })} />
        <p className="text-sm text-gray-500">Para obtener la URL: Google Maps → Compartir → Incorporar un mapa → Copiar el src del iframe</p>
      </CollapsibleSection>

      <CollapsibleSection title="Información de Ubicación" icon={<MapPin className="w-5 h-5" />}>
        <InputField label="Título" value={localUbicaciones.location.title} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, location: { ...localUbicaciones.location, title: v } })} />
        <InputField label="Dirección" value={localUbicaciones.location.address} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, location: { ...localUbicaciones.location, address: v } })} />
        <InputField label="Nota" value={localUbicaciones.location.note} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, location: { ...localUbicaciones.location, note: v } })} />
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Texto del Botón" value={localUbicaciones.location.buttonText} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, location: { ...localUbicaciones.location, buttonText: v } })} />
          <InputField label="Email del Botón" value={localUbicaciones.location.buttonEmail} onChange={(v) => setLocalUbicaciones({ ...localUbicaciones, location: { ...localUbicaciones.location, buttonEmail: v } })} />
        </div>
      </CollapsibleSection>
    </div>
  );

  // ============ CONTACTO EDITOR ============
  const renderContactoEditor = () => (
    <div className="space-y-4">
      <CollapsibleSection title="Encabezado" icon={<FileText className="w-5 h-5" />} defaultOpen>
        <InputField label="Título" value={localContacto.hero.title} onChange={(v) => setLocalContacto({ ...localContacto, hero: { ...localContacto.hero, title: v } })} />
        <InputField label="Subtítulo 1" value={localContacto.hero.subtitle1} onChange={(v) => setLocalContacto({ ...localContacto, hero: { ...localContacto.hero, subtitle1: v } })} />
        <InputField label="Subtítulo 2" value={localContacto.hero.subtitle2} onChange={(v) => setLocalContacto({ ...localContacto, hero: { ...localContacto.hero, subtitle2: v } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Etiquetas del Formulario" icon={<FileText className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Label: Nombre" value={localContacto.formLabels.nombre} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, nombre: v } })} />
          <InputField label="Label: Email" value={localContacto.formLabels.email} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, email: v } })} />
          <InputField label="Label: Asunto" value={localContacto.formLabels.asunto} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, asunto: v } })} />
          <InputField label="Label: Mensaje" value={localContacto.formLabels.mensaje} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, mensaje: v } })} />
        </div>
        <InputField label="Texto Botón Enviar" value={localContacto.formLabels.submitButton} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, submitButton: v } })} />
        <InputField label="Texto Enviando..." value={localContacto.formLabels.submitting} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, submitting: v } })} />
        <InputField label="Mensaje de Éxito" value={localContacto.formLabels.successMessage} onChange={(v) => setLocalContacto({ ...localContacto, formLabels: { ...localContacto.formLabels, successMessage: v } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Sección de Información" icon={<Phone className="w-5 h-5" />}>
        <InputField label="Título" value={localContacto.infoSection.title} onChange={(v) => setLocalContacto({ ...localContacto, infoSection: { ...localContacto.infoSection, title: v } })} />
        <p className="text-sm text-gray-500">Los datos de contacto (email, teléfono, dirección, redes sociales) se configuran en la sección de Configuración General del sitio.</p>
      </CollapsibleSection>
    </div>
  );

  const renderEditor = () => {
    switch (selectedPage) {
      case 'index': return renderIndexEditor();
      case 'nosotros': return renderNosotrosEditor();
      case 'produccion': return renderProduccionEditor();
      case 'eventos': return renderEventosEditor();
      case 'ubicaciones': return renderUbicacionesEditor();
      case 'contacto': return renderContactoEditor();
      default: return null;
    }
  };

  const selectedPageInfo = pageOptions.find(p => p.id === selectedPage);

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-2xl font-medium">Editor de Contenido</h1>
              <p className="text-foreground/70">Edita el contenido de todas las páginas del sitio</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-foreground text-white rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50">
            {isSaving ? (<><Loader2 className="w-5 h-5 animate-spin" />Guardando...</>) : (<><Save className="w-5 h-5" />Guardar Cambios</>)}
          </button>
        </div>

        {saveMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <CheckCircle className="w-5 h-5" />{saveMessage}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
            <h2 className="font-medium mb-4">Seleccionar Página</h2>
            <div className="space-y-2">
              {pageOptions.map((page) => (
                <button key={page.id} onClick={() => setSelectedPage(page.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${selectedPage === page.id ? 'bg-foreground text-white' : 'hover:bg-gray-100'}`}>
                  {page.icon}
                  <div>
                    <div className="font-medium">{page.label}</div>
                    <div className={`text-xs ${selectedPage === page.id ? 'text-white/70' : 'text-gray-500'}`}>{page.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <motion.div key={selectedPage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              {selectedPageInfo?.icon}
              <div>
                <h2 className="text-xl font-medium">{selectedPageInfo?.label}</h2>
                <p className="text-sm text-gray-500">{selectedPageInfo?.description}</p>
              </div>
            </div>
            {renderEditor()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
