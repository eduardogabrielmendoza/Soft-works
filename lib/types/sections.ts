// ============================================================
// Custom Section Types — shared between hooks, editor, and renderers
// ============================================================

export interface CustomButton {
  id: string;
  text: string;
  link: string;
  style: 'filled' | 'outlined' | 'text';
}

export type CustomSectionType = 'text' | 'image' | 'banner' | 'cta' | 'embed' | 'image-text';

export interface CustomSection {
  id: string;
  type: CustomSectionType;
  // Text / common
  title?: string;
  description?: string;
  // Image / Banner / Image-text
  image?: string;
  imagePosition?: 'left' | 'right';
  // Embed (YouTube, Google Maps, any iframe URL)
  embedUrl?: string;
  // Buttons (used in CTA and standalone)
  buttons?: CustomButton[];
}

// Labels for the section type picker in the editor
export const SECTION_TYPE_OPTIONS: { value: CustomSectionType; label: string; emoji: string; description: string }[] = [
  { value: 'text', label: 'Texto', emoji: '📝', description: 'Título y descripción' },
  { value: 'image', label: 'Imagen', emoji: '🖼️', description: 'Imagen con título opcional' },
  { value: 'banner', label: 'Banner', emoji: '🏞️', description: 'Imagen con texto superpuesto' },
  { value: 'cta', label: 'Call to Action', emoji: '📢', description: 'Texto con botones' },
  { value: 'embed', label: 'Embed / URL', emoji: '🌐', description: 'YouTube, Maps, o cualquier URL' },
  { value: 'image-text', label: 'Imagen + Texto', emoji: '📰', description: 'Imagen al lado de texto' },
];

// Helper: create a new empty section of a given type
export function createEmptySection(type: CustomSectionType): CustomSection {
  const base: CustomSection = { id: Date.now().toString(), type };
  switch (type) {
    case 'text':
      return { ...base, title: 'Nueva Sección', description: '' };
    case 'image':
      return { ...base, image: '', title: '' };
    case 'banner':
      return { ...base, image: '', title: '', description: '' };
    case 'cta':
      return { ...base, title: '', description: '', buttons: [{ id: '1', text: 'Ver más', link: '/', style: 'filled' }] };
    case 'embed':
      return { ...base, embedUrl: '', title: '' };
    case 'image-text':
      return { ...base, image: '', title: '', description: '', imagePosition: 'left', buttons: [] };
    default:
      return base;
  }
}

// Helper: convert a regular YouTube URL to an embed URL
export function toEmbedUrl(url: string): string {
  if (!url) return '';
  // Already an embed
  if (url.includes('/embed/')) return url;
  // youtube.com/watch?v=ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // Google Maps — already embeddable if it has /embed
  // Otherwise return as-is (custom iframe src)
  return url;
}
