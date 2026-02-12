import type { PageConfig, EditorSection, AnimationConfig } from './types';
import type { IndexContent } from '@/lib/hooks/useIndexContent';
import type { NosotrosContent, ProduccionContent, EventosContent, UbicacionesContent, ContactoContent } from '@/lib/hooks/usePagesContent';
import { generateId } from './animations';

const fadeUpAnim: AnimationConfig = { type: 'fadeInUp', trigger: 'onScroll', duration: 0.6, delay: 0, easing: 'easeInOut' };
const fadeLeftAnim: AnimationConfig = { type: 'fadeInLeft', trigger: 'onScroll', duration: 0.6, delay: 0, easing: 'easeInOut' };
const fadeRightAnim: AnimationConfig = { type: 'fadeInRight', trigger: 'onScroll', duration: 0.6, delay: 0, easing: 'easeInOut' };
const fadeInAnim: AnimationConfig = { type: 'fadeIn', trigger: 'onScroll', duration: 0.8, delay: 0, easing: 'easeInOut' };
const noAnim: AnimationConfig = { type: 'none', trigger: 'onScroll', duration: 0, delay: 0, easing: 'easeInOut' };

// ============ CONVERT INDEX ============
export function convertIndexToSections(content: IndexContent): EditorSection[] {
  const sections: EditorSection[] = [];

  // Hero Slideshow
  sections.push({
    id: generateId(),
    type: 'hero-slideshow',
    label: 'Hero Principal',
    visible: true,
    locked: false,
    background: { type: 'color', value: '#000000' },
    padding: { top: 0, bottom: 0 },
    maxWidth: 'full',
    elements: [],
    animation: noAnim,
    data: {
      slides: content.heroSlides.map(s => ({ ...s })),
      autoplay: true,
      interval: 5,
      transition: 'slide',
      showDots: true,
      showArrows: true,
    }
  });

  // Product Cards Grid
  const productElements = content.productCardsSection1.flatMap((card, idx) => [
    { id: generateId(), type: 'image' as const, content: card.image, props: { aspectRatio: card.size === 'large' ? '3/4' : '16/9', objectFit: 'cover' as const, borderRadius: '0.5rem', alt: card.title }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
    { id: generateId(), type: 'heading' as const, content: card.title, props: { fontSize: '1.5rem', fontWeight: '500' }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
    { id: generateId(), type: 'text' as const, content: card.subtitle || '', props: { fontSize: '0.9rem', color: 'rgba(84,84,84,0.9)' }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
    { id: generateId(), type: 'text' as const, content: card.description, props: { color: 'rgba(84,84,84,0.5)', textAlign: 'center' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
    { id: generateId(), type: 'button' as const, content: 'Ver', props: { href: card.link, variant: 'ghost' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
  ]);

  sections.push({
    id: generateId(),
    type: 'cards-grid',
    label: 'Productos Destacados',
    visible: true,
    locked: false,
    background: { type: 'color', value: 'transparent' },
    padding: { top: 64, bottom: 96 },
    maxWidth: '7xl',
    elements: productElements,
    animation: noAnim,
    data: { columns: content.productCardsSection1.length, layout: 'product-featured' }
  });

  // Philosophy Section
  sections.push({
    id: generateId(),
    type: 'text-center',
    label: 'Filosofía',
    visible: true,
    locked: false,
    background: { type: 'color', value: '#ffffff' },
    padding: { top: 64, bottom: 64 },
    maxWidth: '7xl',
    elements: [
      { id: generateId(), type: 'heading', content: content.philosophySection.title, props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
      { id: generateId(), type: 'text', content: content.philosophySection.description, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)', maxWidth: '42rem' }, animation: { ...fadeUpAnim, delay: 0.15 } },
      { id: generateId(), type: 'button', content: content.philosophySection.ctaText, props: { href: content.philosophySection.ctaLink, variant: 'filled', bgColor: 'var(--foreground)', textColor: '#ffffff', borderRadius: '999px', textAlign: 'center' }, animation: { ...fadeUpAnim, delay: 0.3 } },
    ],
    animation: noAnim,
  });

  // Lifestyle Images
  sections.push({
    id: generateId(),
    type: 'gallery-grid',
    label: 'Imágenes Lifestyle',
    visible: true,
    locked: false,
    background: { type: 'color', value: '#ffffff' },
    padding: { top: 0, bottom: 64 },
    maxWidth: '7xl',
    elements: content.lifestyleImages.map((img, idx) => ({
      id: generateId(),
      type: 'image' as const,
      content: img.image,
      props: { aspectRatio: '3/4', objectFit: 'cover' as const, borderRadius: '0.5rem', alt: img.label },
      animation: { ...fadeUpAnim, delay: idx * 0.1 },
    })),
    animation: noAnim,
    data: { columns: 4 }
  });

  // Full Width Banner
  sections.push({
    id: generateId(),
    type: 'banner-full',
    label: 'Banner Full Width',
    visible: true,
    locked: false,
    background: { type: 'image', value: content.fullWidthBanner.image, overlay: 'rgba(0,0,0,0.3)' },
    padding: { top: 0, bottom: 0 },
    maxWidth: 'full',
    elements: [
      { id: generateId(), type: 'heading', content: content.fullWidthBanner.title, props: { fontSize: '3rem', fontWeight: '500', color: '#ffffff', textAlign: 'center' }, animation: fadeInAnim },
      { id: generateId(), type: 'text', content: content.fullWidthBanner.subtitle, props: { color: 'rgba(255,255,255,0.9)', textAlign: 'center' }, animation: { ...fadeInAnim, delay: 0.2 } },
    ],
    animation: noAnim,
  });

  // Content Grid
  sections.push({
    id: generateId(),
    type: 'content-grid',
    label: 'Grid de Contenido',
    visible: true,
    locked: false,
    background: { type: 'color', value: 'transparent' },
    padding: { top: 64, bottom: 96 },
    maxWidth: '7xl',
    elements: content.contentGrid.flatMap((item, idx) => [
      { id: generateId(), type: 'image' as const, content: item.image, props: { aspectRatio: '1/1', objectFit: 'cover' as const, borderRadius: '0.5rem', alt: item.title }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
      { id: generateId(), type: 'heading' as const, content: item.title, props: { fontSize: '1.25rem', fontWeight: '500', textAlign: 'center' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
      { id: generateId(), type: 'text' as const, content: item.description, props: { color: 'rgba(84,84,84,0.7)', textAlign: 'center' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
      { id: generateId(), type: 'button' as const, content: 'Ver', props: { href: item.link, variant: 'ghost' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
    ]),
    animation: noAnim,
    data: { columns: 3 }
  });

  return sections;
}

// ============ CONVERT NOSOTROS ============
export function convertNosotrosToSections(content: NosotrosContent): EditorSection[] {
  return [
    {
      id: generateId(), type: 'text-center', label: 'Hero', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 64, bottom: 64 }, maxWidth: '4xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.hero.title, props: { fontSize: '3.5rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.hero.description, props: { fontSize: '1.15rem', textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.15 } },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'banner-full', label: 'Imagen Header', visible: true, locked: false,
      background: { type: 'image', value: content.headerImage }, padding: { top: 0, bottom: 0 }, maxWidth: 'full',
      elements: [], animation: fadeInAnim,
    },
    {
      id: generateId(), type: 'image-text', label: 'Visión', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 64, bottom: 96 }, maxWidth: '6xl',
      elements: [
        { id: generateId(), type: 'image', content: content.vision.image, props: { aspectRatio: '4/5', objectFit: 'cover', borderRadius: '0.5rem' }, animation: fadeLeftAnim },
        { id: generateId(), type: 'heading', content: content.vision.title, props: { fontSize: '2.5rem', fontWeight: '500' }, animation: fadeRightAnim },
        { id: generateId(), type: 'text', content: content.vision.paragraph1, props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeRightAnim, delay: 0.15 } },
        { id: generateId(), type: 'text', content: content.vision.paragraph2, props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeRightAnim, delay: 0.3 } },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'text-image', label: 'Valores', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 64 }, maxWidth: '6xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.values.title, props: { fontSize: '2.5rem', fontWeight: '500' }, animation: fadeLeftAnim },
        ...content.values.items.map((item, i) => ({
          id: generateId(), type: 'text' as const, content: `**${item.title}**\n${item.description}`,
          props: { fontSize: '1rem' }, animation: { ...fadeLeftAnim, delay: i * 0.1 },
        })),
        { id: generateId(), type: 'image', content: content.values.image, props: { aspectRatio: '4/5', objectFit: 'cover', borderRadius: '0.5rem' }, animation: fadeRightAnim },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'banner-cta', label: 'CTA', visible: true, locked: false,
      background: { type: 'color', value: '#f9fafb' }, padding: { top: 64, bottom: 96 }, maxWidth: '3xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.cta.title, props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.cta.description, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.15 } },
        { id: generateId(), type: 'button', content: content.cta.buttonText, props: { href: content.cta.buttonLink, variant: 'outline', textAlign: 'center', borderRadius: '999px' }, animation: { ...fadeUpAnim, delay: 0.3 } },
      ], animation: noAnim,
    },
  ];
}

// ============ CONVERT PRODUCCION ============
export function convertProduccionToSections(content: ProduccionContent): EditorSection[] {
  return [
    {
      id: generateId(), type: 'text-center', label: 'Hero', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 64, bottom: 64 }, maxWidth: '4xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.hero.title, props: { fontSize: '3rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.hero.description, props: { fontSize: '1.1rem', textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.15 } },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'cards-grid', label: 'Pilares', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 64 }, maxWidth: '7xl',
      elements: content.pillars.flatMap((pillar, idx) => [
        { id: generateId(), type: 'image' as const, content: pillar.image, props: { aspectRatio: '1/1', objectFit: 'cover' as const, borderRadius: '0.5rem', alt: pillar.title }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
        { id: generateId(), type: 'heading' as const, content: pillar.title, props: { fontSize: '1.25rem', fontWeight: '500', textAlign: 'center' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
        { id: generateId(), type: 'text' as const, content: pillar.description, props: { color: 'rgba(84,84,84,0.7)', textAlign: 'center' as const }, animation: { ...fadeUpAnim, delay: idx * 0.1 } },
      ]),
      animation: noAnim,
      data: { columns: 3 }
    },
  ];
}

// ============ CONVERT EVENTOS ============
export function convertEventosToSections(content: EventosContent): EditorSection[] {
  const sections: EditorSection[] = [
    {
      id: generateId(), type: 'text-left', label: 'Encabezado', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 48, bottom: 48 }, maxWidth: '6xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.title, props: { fontSize: '2.5rem', fontWeight: '500' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.subtitle, props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.15 } },
      ], animation: noAnim,
    },
  ];

  if (content.upcomingEvents.length > 0) {
    sections.push({
      id: generateId(), type: 'events-list', label: 'Próximos Eventos', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 64 }, maxWidth: '6xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.upcomingTitle, props: { fontSize: '1.5rem', fontWeight: '500' }, animation: fadeUpAnim },
      ], animation: noAnim,
      data: { events: content.upcomingEvents, eventType: 'upcoming' }
    });
  }

  if (content.pastEvents.length > 0) {
    sections.push({
      id: generateId(), type: 'events-grid', label: 'Eventos Pasados', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 64 }, maxWidth: '6xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.pastTitle, props: { fontSize: '1.5rem', fontWeight: '500' }, animation: fadeUpAnim },
      ], animation: noAnim,
      data: { events: content.pastEvents, eventType: 'past' }
    });
  }

  return sections;
}

// ============ CONVERT UBICACIONES ============
export function convertUbicacionesToSections(content: UbicacionesContent): EditorSection[] {
  return [
    {
      id: generateId(), type: 'text-center', label: 'Encabezado', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 64, bottom: 64 }, maxWidth: '4xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.hero.title, props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.hero.description, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.15 } },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'map-embed', label: 'Mapa', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 48 }, maxWidth: 'full',
      elements: [
        { id: generateId(), type: 'embed', content: content.mapEmbedUrl, props: { aspectRatio: '21/9' }, animation: noAnim },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'banner-cta', label: 'Información', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 64 }, maxWidth: '4xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.location.title, props: { fontSize: '1.5rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.location.address, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.1 } },
        { id: generateId(), type: 'text', content: content.location.note, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.2 } },
        { id: generateId(), type: 'button', content: content.location.buttonText, props: { href: `mailto:${content.location.buttonEmail}`, variant: 'filled', bgColor: 'var(--foreground)', textColor: '#ffffff', borderRadius: '999px', textAlign: 'center' }, animation: { ...fadeUpAnim, delay: 0.3 } },
      ], animation: noAnim,
    },
  ];
}

// ============ CONVERT CONTACTO ============
export function convertContactoToSections(content: ContactoContent): EditorSection[] {
  return [
    {
      id: generateId(), type: 'text-center', label: 'Encabezado', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 48, bottom: 48 }, maxWidth: '4xl',
      elements: [
        { id: generateId(), type: 'heading', content: content.hero.title, props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: fadeUpAnim },
        { id: generateId(), type: 'text', content: content.hero.subtitle1, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.15 } },
        { id: generateId(), type: 'text', content: content.hero.subtitle2, props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...fadeUpAnim, delay: 0.3 } },
      ], animation: noAnim,
    },
    {
      id: generateId(), type: 'contact-form', label: 'Formulario', visible: true, locked: false,
      background: { type: 'color', value: 'transparent' }, padding: { top: 0, bottom: 64 }, maxWidth: '4xl',
      elements: [
        { id: generateId(), type: 'form', content: 'contact', props: {}, animation: { ...fadeUpAnim, delay: 0.15 } },
      ], animation: noAnim,
      data: {
        fields: ['nombre', 'email', 'asunto', 'mensaje'],
        labels: content.formLabels,
        submitText: content.formLabels.submitButton,
      }
    },
  ];
}

// Master converter
export function convertAllPages(
  indexContent: IndexContent,
  nosotrosContent: NosotrosContent,
  produccionContent: ProduccionContent,
  eventosContent: EventosContent,
  ubicacionesContent: UbicacionesContent,
  contactoContent: ContactoContent,
): Record<string, PageConfig> {
  return {
    index: { id: 'index', label: 'Página Principal', slug: '/', sections: convertIndexToSections(indexContent) },
    nosotros: { id: 'nosotros', label: 'Nosotros', slug: '/nosotros', sections: convertNosotrosToSections(nosotrosContent) },
    produccion: { id: 'produccion', label: 'Producción', slug: '/produccion', sections: convertProduccionToSections(produccionContent) },
    eventos: { id: 'eventos', label: 'Eventos', slug: '/eventos', sections: convertEventosToSections(eventosContent) },
    ubicaciones: { id: 'ubicaciones', label: 'Ubicaciones', slug: '/ubicaciones', sections: convertUbicacionesToSections(ubicacionesContent) },
    contacto: { id: 'contacto', label: 'Contacto', slug: '/contacto', sections: convertContactoToSections(contactoContent) },
  };
}
