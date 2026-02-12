// ============================================================
// Softworks Studio - Visual Page Builder Types
// ============================================================

// Animation definitions
export type AnimationType = 
  | 'none' | 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
  | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'scaleIn' | 'scaleUp' | 'scaleDown'
  | 'blurIn' | 'rotateIn' | 'bounceIn' | 'flipX' | 'flipY';

export type AnimationTrigger = 'onLoad' | 'onScroll' | 'onHover';
export type EasingType = 'easeInOut' | 'easeIn' | 'easeOut' | 'spring' | 'bounce' | 'linear';

export interface AnimationConfig {
  type: AnimationType;
  trigger: AnimationTrigger;
  duration: number; // seconds
  delay: number; // seconds
  easing: EasingType;
  stagger?: number; // for lists
}

export const defaultAnimation: AnimationConfig = {
  type: 'fadeInUp',
  trigger: 'onScroll',
  duration: 0.6,
  delay: 0,
  easing: 'easeInOut',
};

// Section types
export type SectionType = 
  | 'hero-slideshow' | 'hero-static' | 'hero-split'
  | 'text-center' | 'text-left' | 'text-image' | 'image-text'
  | 'cards-grid' | 'cards-row'
  | 'gallery-grid' | 'gallery-masonry' | 'gallery-row'
  | 'banner-full' | 'banner-cta'
  | 'content-grid' | 'content-list'
  | 'features-icons' | 'features-timeline'
  | 'events-list' | 'events-grid'
  | 'map-embed' | 'contact-form'
  | 'spacer' | 'divider' | 'custom-html';

// Element within a section
export interface EditorElement {
  id: string;
  type: 'text' | 'heading' | 'image' | 'button' | 'icon' | 'spacer' | 'divider' | 'embed' | 'form';
  content: string; // text content or image URL
  props: {
    // Typography
    fontSize?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    lineHeight?: string;
    letterSpacing?: string;
    // Layout
    width?: string;
    height?: string;
    maxWidth?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    // Image specific
    objectFit?: 'cover' | 'contain' | 'fill';
    alt?: string;
    aspectRatio?: string;
    // Button specific
    href?: string;
    variant?: 'filled' | 'outline' | 'ghost';
    bgColor?: string;
    textColor?: string;
    // Visibility
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
  };
  animation: AnimationConfig;
}

// Section definition
export interface EditorSection {
  id: string;
  type: SectionType;
  label: string;
  visible: boolean;
  locked: boolean;
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string; // color hex, gradient css, or image URL
    overlay?: string; // overlay color with opacity
  };
  padding: {
    top: number;
    bottom: number;
  };
  maxWidth?: string; // 'full' | '7xl' | '6xl' | '4xl' etc.
  elements: EditorElement[];
  animation: AnimationConfig;
  // Section-specific data
  data?: Record<string, unknown>;
}

// Page configuration 
export interface PageConfig {
  id: string;
  label: string;
  slug: string;
  sections: EditorSection[];
  meta?: {
    title?: string;
    description?: string;
  };
}

// Device preview
export type DevicePreview = 'desktop' | 'tablet' | 'mobile';

// Editor state
export interface EditorState {
  activePage: string;
  pages: Record<string, PageConfig>;
  selectedSectionId: string | null;
  selectedElementId: string | null;
  devicePreview: DevicePreview;
  isPreviewMode: boolean;
  isDragging: boolean;
  showSectionLibrary: boolean;
  zoom: number;
  hasUnsavedChanges: boolean;
  animPreviewKey: number;
}

// History for undo/redo
export interface HistoryEntry {
  pages: Record<string, PageConfig>;
  timestamp: number;
  description: string;
}

// Section template for the library
export interface SectionTemplate {
  type: SectionType;
  label: string;
  icon: string; // lucide icon name
  category: 'hero' | 'content' | 'media' | 'cta' | 'features' | 'layout';
  description: string;
  defaultSection: Omit<EditorSection, 'id'>;
}

// Animation presets for the picker
export const ANIMATION_TYPES: { value: AnimationType; label: string; icon: string }[] = [
  { value: 'none', label: 'Sin animación', icon: '⊘' },
  { value: 'fadeIn', label: 'Fade In', icon: '◻' },
  { value: 'fadeInUp', label: 'Fade In Up', icon: '↑' },
  { value: 'fadeInDown', label: 'Fade In Down', icon: '↓' },
  { value: 'fadeInLeft', label: 'Fade In Left', icon: '←' },
  { value: 'fadeInRight', label: 'Fade In Right', icon: '→' },
  { value: 'slideUp', label: 'Slide Up', icon: '⬆' },
  { value: 'slideDown', label: 'Slide Down', icon: '⬇' },
  { value: 'slideLeft', label: 'Slide Left', icon: '⬅' },
  { value: 'slideRight', label: 'Slide Right', icon: '➡' },
  { value: 'scaleIn', label: 'Scale In', icon: '◎' },
  { value: 'scaleUp', label: 'Scale Up', icon: '⊕' },
  { value: 'scaleDown', label: 'Scale Down', icon: '⊖' },
  { value: 'blurIn', label: 'Blur In', icon: '◌' },
  { value: 'rotateIn', label: 'Rotate In', icon: '↻' },
  { value: 'bounceIn', label: 'Bounce In', icon: '⊛' },
  { value: 'flipX', label: 'Flip X', icon: '↔' },
  { value: 'flipY', label: 'Flip Y', icon: '↕' },
];

export const EASING_TYPES: { value: EasingType; label: string }[] = [
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'spring', label: 'Spring' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'linear', label: 'Linear' },
];
