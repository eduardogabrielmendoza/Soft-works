import type { SectionTemplate, EditorSection, AnimationConfig } from './types';

const defaultAnim: AnimationConfig = {
  type: 'fadeInUp',
  trigger: 'onScroll',
  duration: 0.6,
  delay: 0,
  easing: 'easeInOut',
};

const noAnim: AnimationConfig = {
  type: 'none',
  trigger: 'onScroll',
  duration: 0,
  delay: 0,
  easing: 'easeInOut',
};

export const sectionTemplates: SectionTemplate[] = [
  // ===== HERO =====
  {
    type: 'hero-slideshow',
    label: 'Hero Slideshow',
    icon: 'Images',
    category: 'hero',
    description: 'Carrusel de imágenes a pantalla completa con texto y botones',
    defaultSection: {
      type: 'hero-slideshow',
      label: 'Hero Slideshow',
      visible: true,
      locked: false,
      background: { type: 'color', value: '#000000' },
      padding: { top: 0, bottom: 0 },
      maxWidth: 'full',
      elements: [],
      animation: noAnim,
      data: {
        slides: [
          { id: '1', image: '/images/Herobanner.png', title: 'Colecciones', subtitle: 'Buenos Aires - Argentina', ctaText: 'Explorar', ctaLink: '/colecciones' }
        ],
        autoplay: true,
        interval: 5,
        transition: 'slide',
        showDots: true,
        showArrows: true,
      }
    }
  },
  {
    type: 'hero-static',
    label: 'Hero Estático',
    icon: 'Image',
    category: 'hero',
    description: 'Imagen única con texto superpuesto',
    defaultSection: {
      type: 'hero-static',
      label: 'Hero Estático',
      visible: true,
      locked: false,
      background: { type: 'image', value: '/images/Herobanner.png', overlay: 'rgba(0,0,0,0.4)' },
      padding: { top: 0, bottom: 0 },
      maxWidth: 'full',
      elements: [
        { id: 'h1', type: 'heading', content: 'Título Principal', props: { fontSize: '4rem', fontWeight: '500', color: '#ffffff', textAlign: 'center' }, animation: defaultAnim },
        { id: 'p1', type: 'text', content: 'Subtítulo descriptivo', props: { fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }, animation: { ...defaultAnim, delay: 0.2 } },
        { id: 'b1', type: 'button', content: 'Explorar', props: { href: '/colecciones', variant: 'filled', bgColor: '#ffffff', textColor: '#000000', textAlign: 'center', borderRadius: '999px' }, animation: { ...defaultAnim, delay: 0.4 } },
      ],
      animation: noAnim,
    }
  },
  {
    type: 'hero-split',
    label: 'Hero Split',
    icon: 'Columns2',
    category: 'hero',
    description: 'Imagen y texto lado a lado',
    defaultSection: {
      type: 'hero-split',
      label: 'Hero Split',
      visible: true,
      locked: false,
      background: { type: 'color', value: '#ffffff' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '7xl',
      elements: [
        { id: 'img1', type: 'image', content: '/images/Herobanner.png', props: { aspectRatio: '4/5', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, type: 'fadeInLeft' } },
        { id: 'h1', type: 'heading', content: 'Tu Historia', props: { fontSize: '3rem', fontWeight: '500' }, animation: { ...defaultAnim, type: 'fadeInRight' } },
        { id: 'p1', type: 'text', content: 'Descripción de tu marca y filosofía.', props: { fontSize: '1.1rem', color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, type: 'fadeInRight', delay: 0.2 } },
        { id: 'b1', type: 'button', content: 'Descubrir', props: { href: '/nosotros', variant: 'outline', borderRadius: '999px' }, animation: { ...defaultAnim, type: 'fadeInRight', delay: 0.4 } },
      ],
      animation: noAnim,
    }
  },

  // ===== CONTENT =====
  {
    type: 'text-center',
    label: 'Texto Centrado',
    icon: 'AlignCenter',
    category: 'content',
    description: 'Título y descripción centrados',
    defaultSection: {
      type: 'text-center',
      label: 'Texto Centrado',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '4xl',
      elements: [
        { id: 'h1', type: 'heading', content: 'Título de Sección', props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: defaultAnim },
        { id: 'p1', type: 'text', content: 'Descripción detallada de esta sección. Edita este texto haciendo click.', props: { fontSize: '1.1rem', textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.15 } },
      ],
      animation: noAnim,
    }
  },
  {
    type: 'text-image',
    label: 'Texto + Imagen',
    icon: 'PanelLeftClose',
    category: 'content',
    description: 'Texto a la izquierda, imagen a la derecha',
    defaultSection: {
      type: 'text-image',
      label: 'Texto + Imagen',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '6xl',
      elements: [
        { id: 'h1', type: 'heading', content: 'Tu Título', props: { fontSize: '2.5rem', fontWeight: '500' }, animation: { ...defaultAnim, type: 'fadeInLeft' } },
        { id: 'p1', type: 'text', content: 'Descripción del contenido con detalles importantes sobre tu marca.', props: { fontSize: '1rem', color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, type: 'fadeInLeft', delay: 0.15 } },
        { id: 'img1', type: 'image', content: '/images/nosotros1.png', props: { aspectRatio: '4/5', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, type: 'fadeInRight' } },
      ],
      animation: noAnim,
    }
  },
  {
    type: 'image-text',
    label: 'Imagen + Texto',
    icon: 'PanelRightClose',
    category: 'content',
    description: 'Imagen a la izquierda, texto a la derecha',
    defaultSection: {
      type: 'image-text',
      label: 'Imagen + Texto',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '6xl',
      elements: [
        { id: 'img1', type: 'image', content: '/images/nosotros2.png', props: { aspectRatio: '4/5', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, type: 'fadeInLeft' } },
        { id: 'h1', type: 'heading', content: 'Tu Título', props: { fontSize: '2.5rem', fontWeight: '500' }, animation: { ...defaultAnim, type: 'fadeInRight' } },
        { id: 'p1', type: 'text', content: 'Descripción del contenido.', props: { fontSize: '1rem', color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, type: 'fadeInRight', delay: 0.15 } },
      ],
      animation: noAnim,
    }
  },

  // ===== MEDIA =====
  {
    type: 'cards-grid',
    label: 'Grid de Cards',
    icon: 'LayoutGrid',
    category: 'media',
    description: 'Grid de tarjetas con imagen, título y descripción',
    defaultSection: {
      type: 'cards-grid',
      label: 'Grid de Cards',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '7xl',
      elements: [
        { id: 'c1', type: 'image', content: '/images/hoodies.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem', alt: 'Card 1' }, animation: defaultAnim },
        { id: 'c1t', type: 'heading', content: 'Card 1', props: { fontSize: '1.25rem', fontWeight: '500' }, animation: defaultAnim },
        { id: 'c1d', type: 'text', content: 'Descripción de la card', props: { color: 'rgba(84,84,84,0.7)' }, animation: defaultAnim },
        { id: 'c2', type: 'image', content: '/images/shirts.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem', alt: 'Card 2' }, animation: { ...defaultAnim, delay: 0.1 } },
        { id: 'c2t', type: 'heading', content: 'Card 2', props: { fontSize: '1.25rem', fontWeight: '500' }, animation: { ...defaultAnim, delay: 0.1 } },
        { id: 'c2d', type: 'text', content: 'Descripción de la card', props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.1 } },
        { id: 'c3', type: 'image', content: '/images/caps.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem', alt: 'Card 3' }, animation: { ...defaultAnim, delay: 0.2 } },
        { id: 'c3t', type: 'heading', content: 'Card 3', props: { fontSize: '1.25rem', fontWeight: '500' }, animation: { ...defaultAnim, delay: 0.2 } },
        { id: 'c3d', type: 'text', content: 'Descripción de la card', props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.2 } },
      ],
      animation: noAnim,
      data: { columns: 3 }
    }
  },
  {
    type: 'gallery-grid',
    label: 'Galería Grid',
    icon: 'Grid3x3',
    category: 'media',
    description: 'Grid de imágenes estilo galería',
    defaultSection: {
      type: 'gallery-grid',
      label: 'Galería Grid',
      visible: true,
      locked: false,
      background: { type: 'color', value: '#ffffff' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '7xl',
      elements: [
        { id: 'g1', type: 'image', content: '/images/item1.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, delay: 0 } },
        { id: 'g2', type: 'image', content: '/images/item2.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, delay: 0.1 } },
        { id: 'g3', type: 'image', content: '/images/item3.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, delay: 0.2 } },
        { id: 'g4', type: 'image', content: '/images/item4.png', props: { aspectRatio: '3/4', objectFit: 'cover', borderRadius: '0.5rem' }, animation: { ...defaultAnim, delay: 0.3 } },
      ],
      animation: noAnim,
      data: { columns: 4 }
    }
  },

  // ===== CTA =====
  {
    type: 'banner-full',
    label: 'Banner Full Width',
    icon: 'RectangleHorizontal',
    category: 'cta',
    description: 'Imagen a ancho completo con texto superpuesto',
    defaultSection: {
      type: 'banner-full',
      label: 'Banner Full Width',
      visible: true,
      locked: false,
      background: { type: 'image', value: '/images/lifebanner.png', overlay: 'rgba(0,0,0,0.3)' },
      padding: { top: 0, bottom: 0 },
      maxWidth: 'full',
      elements: [
        { id: 'h1', type: 'heading', content: 'Diseñado para durar', props: { fontSize: '3rem', fontWeight: '500', color: '#ffffff', textAlign: 'center' }, animation: { ...defaultAnim, type: 'fadeIn' } },
        { id: 'p1', type: 'text', content: 'Calidad atemporal, estilo consciente', props: { color: 'rgba(255,255,255,0.9)', textAlign: 'center' }, animation: { ...defaultAnim, type: 'fadeIn', delay: 0.2 } },
      ],
      animation: noAnim,
    }
  },
  {
    type: 'banner-cta',
    label: 'Banner CTA',
    icon: 'Megaphone',
    category: 'cta',
    description: 'Sección Call-to-Action con botón',
    defaultSection: {
      type: 'banner-cta',
      label: 'Banner CTA',
      visible: true,
      locked: false,
      background: { type: 'color', value: '#f3f4f6' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '3xl',
      elements: [
        { id: 'h1', type: 'heading', content: 'Descubre más', props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: defaultAnim },
        { id: 'p1', type: 'text', content: 'Conoce nuestra historia y nuestros valores.', props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.15 } },
        { id: 'b1', type: 'button', content: 'Ver más', props: { href: '/nosotros', variant: 'outline', textAlign: 'center', borderRadius: '999px' }, animation: { ...defaultAnim, delay: 0.3 } },
      ],
      animation: noAnim,
    }
  },

  // ===== FEATURES =====
  {
    type: 'features-icons',
    label: 'Features con Iconos',
    icon: 'Star',
    category: 'features',
    description: 'Lista de características con iconos o imágenes',
    defaultSection: {
      type: 'features-icons',
      label: 'Features',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '6xl',
      elements: [
        { id: 'h1', type: 'heading', content: 'Nuestros Valores', props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: defaultAnim },
        { id: 'f1t', type: 'heading', content: 'Calidad', props: { fontSize: '1.25rem', fontWeight: '500' }, animation: { ...defaultAnim, delay: 0.1 } },
        { id: 'f1d', type: 'text', content: 'Materiales premium seleccionados', props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.1 } },
        { id: 'f2t', type: 'heading', content: 'Diseño', props: { fontSize: '1.25rem', fontWeight: '500' }, animation: { ...defaultAnim, delay: 0.2 } },
        { id: 'f2d', type: 'text', content: 'Estilo atemporal y minimalista', props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.2 } },
        { id: 'f3t', type: 'heading', content: 'Ética', props: { fontSize: '1.25rem', fontWeight: '500' }, animation: { ...defaultAnim, delay: 0.3 } },
        { id: 'f3d', type: 'text', content: 'Producción responsable y transparente', props: { color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.3 } },
      ],
      animation: noAnim,
      data: { columns: 3 }
    }
  },

  // ===== LAYOUT =====
  {
    type: 'spacer',
    label: 'Espaciador',
    icon: 'Space',
    category: 'layout',
    description: 'Espacio en blanco configurable',
    defaultSection: {
      type: 'spacer',
      label: 'Espaciador',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 32, bottom: 32 },
      elements: [],
      animation: noAnim,
    }
  },
  {
    type: 'divider',
    label: 'Separador',
    icon: 'Minus',
    category: 'layout',
    description: 'Línea separadora horizontal',
    defaultSection: {
      type: 'divider',
      label: 'Separador',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 16, bottom: 16 },
      maxWidth: '6xl',
      elements: [
        { id: 'd1', type: 'divider', content: '', props: { color: 'rgba(0,0,0,0.1)' }, animation: noAnim }
      ],
      animation: noAnim,
    }
  },
  {
    type: 'map-embed',
    label: 'Mapa Google',
    icon: 'MapPin',
    category: 'layout',
    description: 'Mapa embebido de Google Maps',
    defaultSection: {
      type: 'map-embed',
      label: 'Mapa',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 0, bottom: 0 },
      maxWidth: 'full',
      elements: [
        { id: 'e1', type: 'embed', content: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52562.20252003802!2d-58.45328229999999!3d-34.5875', props: { aspectRatio: '21/9' }, animation: noAnim }
      ],
      animation: noAnim,
    }
  },
  {
    type: 'contact-form',
    label: 'Formulario Contacto',
    icon: 'Mail',
    category: 'layout',
    description: 'Formulario de contacto completo',
    defaultSection: {
      type: 'contact-form',
      label: 'Contacto',
      visible: true,
      locked: false,
      background: { type: 'color', value: 'transparent' },
      padding: { top: 64, bottom: 64 },
      maxWidth: '4xl',
      elements: [
        { id: 'h1', type: 'heading', content: 'Contacto', props: { fontSize: '2.5rem', fontWeight: '500', textAlign: 'center' }, animation: defaultAnim },
        { id: 'p1', type: 'text', content: 'Estamos aquí para ayudarte', props: { textAlign: 'center', color: 'rgba(84,84,84,0.7)' }, animation: { ...defaultAnim, delay: 0.15 } },
        { id: 'f1', type: 'form', content: 'contact', props: {}, animation: { ...defaultAnim, delay: 0.3 } },
      ],
      animation: noAnim,
      data: {
        fields: ['nombre', 'email', 'asunto', 'mensaje'],
        submitText: 'Enviar Mensaje',
        submitEmail: 'contacto@softworks.com'
      }
    }
  },
];

export function getSectionsByCategory(category: string) {
  return sectionTemplates.filter(t => t.category === category);
}

export function getAllCategories() {
  return [
    { id: 'hero', label: 'Hero', icon: 'Monitor' },
    { id: 'content', label: 'Contenido', icon: 'FileText' },
    { id: 'media', label: 'Media', icon: 'Images' },
    { id: 'cta', label: 'CTA', icon: 'Megaphone' },
    { id: 'features', label: 'Features', icon: 'Star' },
    { id: 'layout', label: 'Layout', icon: 'Layout' },
  ];
}
