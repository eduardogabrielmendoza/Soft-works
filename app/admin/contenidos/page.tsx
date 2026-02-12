'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Loader2, ArrowLeft, Monitor, Tablet, Smartphone,
  Home, Users, Factory, Calendar, MapPin, Phone,
  Plus, Trash2, ChevronDown, ChevronUp, Check, AlertCircle,
  GripVertical, Link as LinkIcon, ExternalLink, Globe, Youtube, MousePointerClick,
  Layout, PanelTop, PanelBottom, Type, Palette, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIndexContent, type IndexContent, type HeroSlide, type ProductCard, type LifestyleImage, type ContentItem } from '@/lib/hooks/useIndexContent';
import { usePagesContent, type NosotrosContent, type ProduccionContent, type EventosContent, type EventoItem, type UbicacionesContent, type ContactoContent } from '@/lib/hooks/usePagesContent';
import { useLayoutContent, type LayoutContent, type NavLink, type FooterLinkColumn, defaultLayoutContent } from '@/lib/hooks/useLayoutContent';
import { getSupabaseClient } from '@/lib/supabase/client';
import { type CustomSection, type CustomButton, type TextStyle, type ButtonAlignment, type CustomSectionType, SECTION_TYPE_OPTIONS, BTN_ALIGN_CLASS, createEmptySection, toEmbedUrl } from '@/lib/types/sections';

// ============================================================
// TYPES
// ============================================================
type PageId = 'layout' | 'index' | 'nosotros' | 'produccion' | 'eventos' | 'ubicaciones' | 'contacto';
type DevicePreview = 'desktop' | 'tablet' | 'mobile';

const PAGE_TABS: { id: PageId; label: string; icon: React.ReactNode; path: string }[] = [
  { id: 'layout', label: 'Layout', icon: <Layout className="w-4 h-4" />, path: '/' },
  { id: 'index', label: 'Inicio', icon: <Home className="w-4 h-4" />, path: '/' },
  { id: 'nosotros', label: 'Nosotros', icon: <Users className="w-4 h-4" />, path: '/nosotros' },
  { id: 'produccion', label: 'Producción', icon: <Factory className="w-4 h-4" />, path: '/produccion' },
  { id: 'eventos', label: 'Eventos', icon: <Calendar className="w-4 h-4" />, path: '/eventos' },
  { id: 'ubicaciones', label: 'Ubicaciones', icon: <MapPin className="w-4 h-4" />, path: '/ubicaciones' },
  { id: 'contacto', label: 'Contacto', icon: <Phone className="w-4 h-4" />, path: '/contacto' },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================
function SectionCard({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-gray-50 transition-colors">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

function Field({ label, children, styleKey, textStyles, onStyleChange }: { label: string; children: React.ReactNode; styleKey?: string; textStyles?: Record<string, TextStyle>; onStyleChange?: (key: string, style: TextStyle | undefined) => void }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="block text-xs font-medium text-foreground/60">{label}</label>
        {styleKey && onStyleChange && (
          <TextStylePicker style={textStyles?.[styleKey]} onChange={s => onStyleChange(styleKey, s)} />
        )}
      </div>
      {children}
    </div>
  );
}

// ---- TEXT STYLE PICKER (compact popup) ----
const FONT_SIZE_OPTIONS = [
  { value: '', label: 'Por defecto' },
  { value: 'xs', label: 'XS (0.75rem)' }, { value: 'sm', label: 'SM (0.875rem)' },
  { value: 'base', label: 'Base (1rem)' }, { value: 'lg', label: 'LG (1.125rem)' },
  { value: 'xl', label: 'XL (1.25rem)' }, { value: '2xl', label: '2XL (1.5rem)' },
  { value: '3xl', label: '3XL (1.875rem)' }, { value: '4xl', label: '4XL (2.25rem)' },
  { value: '5xl', label: '5XL (3rem)' }, { value: '6xl', label: '6XL (3.75rem)' },
];
const FONT_WEIGHT_OPTIONS = [
  { value: '', label: 'Por defecto' },
  { value: 'light', label: 'Light (300)' }, { value: 'normal', label: 'Normal (400)' },
  { value: 'medium', label: 'Medium (500)' }, { value: 'semibold', label: 'Semibold (600)' },
  { value: 'bold', label: 'Bold (700)' },
];

function TextStylePicker({ style, onChange }: { style?: TextStyle; onChange: (s: TextStyle | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const hasStyle = style && (style.color || style.fontSize || style.fontWeight);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`p-0.5 rounded transition-colors ${hasStyle ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-foreground/30 hover:text-foreground/60 hover:bg-gray-100'}`}
        title="Estilo de texto"
      >
        <Palette className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 p-3 bg-white border border-gray-200 rounded-lg shadow-xl space-y-2.5 min-w-[220px]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">Estilo de texto</span>
            <div className="flex gap-1">
              {hasStyle && <button onClick={() => { onChange(undefined); setOpen(false); }} className="p-0.5 text-red-400 hover:text-red-600 rounded" title="Resetear"><RotateCcw className="w-3 h-3" /></button>}
              <button onClick={() => setOpen(false)} className="p-0.5 text-foreground/40 hover:text-foreground/70 rounded text-xs">✕</button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-foreground/50 block mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={style?.color || '#000000'} onChange={e => onChange({ ...style, color: e.target.value })} className="w-7 h-7 rounded border border-gray-200 cursor-pointer" />
              <input type="text" value={style?.color || ''} onChange={e => onChange({ ...style, color: e.target.value || undefined })} placeholder="#000000" className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded" />
              {style?.color && <button onClick={() => onChange({ ...style, color: undefined })} className="text-[10px] text-red-400 hover:text-red-600">✕</button>}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-foreground/50 block mb-1">Tamaño</label>
            <select value={style?.fontSize || ''} onChange={e => onChange({ ...style, fontSize: (e.target.value || undefined) as TextStyle['fontSize'] })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded">
              {FONT_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-foreground/50 block mb-1">Peso</label>
            <select value={style?.fontWeight || ''} onChange={e => onChange({ ...style, fontWeight: (e.target.value || undefined) as TextStyle['fontWeight'] })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded">
              {FONT_WEIGHT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors" />;
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors resize-none" />;
}

function ImageInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-foreground/60">{label}</label>}
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="URL de imagen" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors" />
      {value && (
        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}

function UrlInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const isValid = value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'));
  return (
    <div className="space-y-1">
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'https://...'}
          className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
        />
        {isValid && value.startsWith('http') && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 rounded">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {value && !isValid && (
        <p className="text-xs text-amber-500">URL debe comenzar con https://, http:// o /</p>
      )}
    </div>
  );
}

function EmbedPreview({ url }: { url: string }) {
  const embedSrc = toEmbedUrl(url);
  if (!embedSrc) return null;
  const isYoutube = embedSrc.includes('youtube.com/embed');
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-foreground/40">
        {isYoutube ? <Youtube className="w-3.5 h-3.5 text-red-500" /> : <Globe className="w-3.5 h-3.5" />}
        {isYoutube ? 'YouTube embed' : 'Embed URL'}
      </div>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
        <iframe src={embedSrc} className="absolute inset-0 w-full h-full border-0" title="Preview" />
      </div>
    </div>
  );
}

// ---- BUTTON EDITOR ----
const BTN_SIZE_OPTIONS = [
  { value: '', label: 'Mediano (default)' },
  { value: 'sm', label: 'Pequeño' }, { value: 'md', label: 'Mediano' }, { value: 'lg', label: 'Grande' },
];
const BTN_RADIUS_OPTIONS = [
  { value: '', label: 'Redondo (default)' },
  { value: 'none', label: 'Sin radio' }, { value: 'sm', label: 'Sutil' }, { value: 'md', label: 'Medio' }, { value: 'lg', label: 'Grande' }, { value: 'full', label: 'Redondo' },
];
const BTN_FONT_SIZE_OPTIONS = [
  { value: '', label: 'Por defecto' },
  { value: 'xs', label: 'XS' }, { value: 'sm', label: 'SM' }, { value: 'base', label: 'Base' }, { value: 'lg', label: 'LG' }, { value: 'xl', label: 'XL' },
];

function ButtonEditor({ buttons, onChange, alignment, onAlignmentChange }: { buttons: CustomButton[]; onChange: (b: CustomButton[]) => void; alignment?: ButtonAlignment; onAlignmentChange?: (a: ButtonAlignment) => void }) {
  const update = (idx: number, updates: Partial<CustomButton>) => {
    onChange(buttons.map((b, i) => i === idx ? { ...b, ...updates } : b));
  };
  const add = () => {
    onChange([...buttons, { id: Date.now().toString(), text: 'Nuevo botón', link: '/', style: 'filled' }]);
  };
  const remove = (idx: number) => {
    onChange(buttons.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
        <MousePointerClick className="w-3.5 h-3.5" /> Botones
      </label>
      {/* Alignment picker */}
      {onAlignmentChange && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/50">Alineación:</span>
          {(['left', 'center', 'right'] as const).map(a => (
            <button
              key={a}
              onClick={() => onAlignmentChange(a)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded border transition-colors ${(alignment || 'center') === a ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-foreground/50 hover:bg-gray-50'}`}
            >
              {a === 'left' ? '← Izquierda' : a === 'center' ? 'Centro' : 'Derecha →'}
            </button>
          ))}
        </div>
      )}
      {buttons.map((btn, idx) => (
        <div key={btn.id} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/50">Botón {idx + 1}</span>
            <button onClick={() => remove(idx)} className="p-0.5 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Texto"><TextInput value={btn.text} onChange={v => update(idx, { text: v })} /></Field>
            <Field label="Estilo">
              <select
                value={btn.style}
                onChange={e => update(idx, { style: e.target.value as CustomButton['style'] })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="filled">Relleno (oscuro)</option>
                <option value="outlined">Borde</option>
                <option value="text">Solo texto</option>
              </select>
            </Field>
          </div>
          <Field label="URL del enlace"><UrlInput value={btn.link} onChange={v => update(idx, { link: v })} /></Field>

          {/* ---- Style controls ---- */}
          <details className="border-t pt-2 mt-2">
            <summary className="text-[10px] font-medium text-foreground/40 cursor-pointer hover:text-foreground/60 flex items-center gap-1"><Palette className="w-3 h-3" /> Personalizar apariencia</summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-foreground/50 block mb-1">Color del botón</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={btn.color || '#000000'} onChange={e => update(idx, { color: e.target.value })} className="w-7 h-7 rounded border border-gray-200 cursor-pointer" />
                  <input type="text" value={btn.color || ''} onChange={e => update(idx, { color: e.target.value || undefined })} placeholder="auto" className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded min-w-0" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-foreground/50 block mb-1">Color del texto</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" value={btn.textColor || '#ffffff'} onChange={e => update(idx, { textColor: e.target.value })} className="w-7 h-7 rounded border border-gray-200 cursor-pointer" />
                  <input type="text" value={btn.textColor || ''} onChange={e => update(idx, { textColor: e.target.value || undefined })} placeholder="auto" className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded min-w-0" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-foreground/50 block mb-1">Tamaño</label>
                <select value={btn.size || ''} onChange={e => update(idx, { size: (e.target.value || undefined) as CustomButton['size'] })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded">
                  {BTN_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-foreground/50 block mb-1">Tamaño de texto</label>
                <select value={btn.fontSize || ''} onChange={e => update(idx, { fontSize: (e.target.value || undefined) as CustomButton['fontSize'] })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded">
                  {BTN_FONT_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-foreground/50 block mb-1">Bordes</label>
                <select value={btn.borderRadius || ''} onChange={e => update(idx, { borderRadius: (e.target.value || undefined) as CustomButton['borderRadius'] })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded">
                  {BTN_RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </details>
        </div>
      ))}
      <button onClick={add} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5">
        <Plus className="w-3.5 h-3.5" /> Agregar Botón
      </button>
    </div>
  );
}

// ---- CUSTOM SECTION EDITOR (single section) ----
function CustomSectionItemEditor({ section, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  section: CustomSection;
  onUpdate: (s: CustomSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const typeInfo = SECTION_TYPE_OPTIONS.find(o => o.value === section.type);

  return (
    <div className="border border-blue-200 rounded-xl bg-blue-50/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-200">
        <GripVertical className="w-3.5 h-3.5 text-foreground/30" />
        <span className="text-xs">{typeInfo?.emoji}</span>
        <span className="text-xs font-semibold text-foreground/70 flex-1">{typeInfo?.label || section.type}</span>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="p-1 text-foreground/40 hover:text-foreground/70 disabled:opacity-30 rounded" title="Mover arriba"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={onMoveDown} disabled={isLast} className="p-1 text-foreground/40 hover:text-foreground/70 disabled:opacity-30 rounded" title="Mover abajo"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={onRemove} className="p-1 text-red-400 hover:text-red-600 rounded" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Content fields based on type */}
      <div className="p-4 space-y-3">
        {/* Type selector */}
        <Field label="Tipo de sección">
          <select
            value={section.type}
            onChange={e => {
              const newType = e.target.value as CustomSectionType;
              const fresh = createEmptySection(newType);
              onUpdate({ ...fresh, id: section.id, title: section.title, description: section.description });
            }}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
          >
            {SECTION_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label} — {opt.description}</option>
            ))}
          </select>
        </Field>

        {/* Title (all types) */}
        {section.type !== 'image' && (
          <Field label="Título"><TextInput value={section.title || ''} onChange={v => onUpdate({ ...section, title: v })} placeholder="Título de la sección" /></Field>
        )}

        {/* Description (text, banner, cta, image-text) */}
        {['text', 'banner', 'cta', 'image-text'].includes(section.type) && (
          <Field label="Descripción"><TextArea value={section.description || ''} onChange={v => onUpdate({ ...section, description: v })} /></Field>
        )}

        {/* Image (image, banner, image-text) */}
        {['image', 'banner', 'image-text'].includes(section.type) && (
          <ImageInput value={section.image || ''} onChange={v => onUpdate({ ...section, image: v })} label="Imagen" />
        )}

        {/* Image title (only for image type) */}
        {section.type === 'image' && (
          <>
            <Field label="Título (opcional)"><TextInput value={section.title || ''} onChange={v => onUpdate({ ...section, title: v })} /></Field>
            <Field label="Pie de imagen (opcional)"><TextInput value={section.description || ''} onChange={v => onUpdate({ ...section, description: v })} /></Field>
          </>
        )}

        {/* Image position (image-text) */}
        {section.type === 'image-text' && (
          <Field label="Posición de imagen">
            <div className="flex gap-2">
              {(['left', 'right'] as const).map(pos => (
                <button
                  key={pos}
                  onClick={() => onUpdate({ ...section, imagePosition: pos })}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${section.imagePosition === pos ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-foreground/60'}`}
                >
                  {pos === 'left' ? '🖼️ Imagen izquierda' : 'Imagen derecha 🖼️'}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Embed URL */}
        {section.type === 'embed' && (
          <>
            <Field label="URL (YouTube, Maps, o cualquier web)">
              <UrlInput value={section.embedUrl || ''} onChange={v => onUpdate({ ...section, embedUrl: v })} placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
            {section.embedUrl && <EmbedPreview url={section.embedUrl} />}
            <Field label="Descripción (opcional)"><TextInput value={section.description || ''} onChange={v => onUpdate({ ...section, description: v })} /></Field>
          </>
        )}

        {/* Buttons (cta, text, image-text, banner) */}
        {['cta', 'text', 'image-text', 'banner'].includes(section.type) && (
          <ButtonEditor
            buttons={section.buttons || []}
            onChange={buttons => onUpdate({ ...section, buttons })}
            alignment={section.buttonAlignment}
            onAlignmentChange={a => onUpdate({ ...section, buttonAlignment: a })}
          />
        )}
      </div>
    </div>
  );
}

// ---- CUSTOM SECTIONS LIST EDITOR ----
function CustomSectionsEditor({ sections, onChange }: { sections: CustomSection[]; onChange: (s: CustomSection[]) => void }) {
  const [showTypePicker, setShowTypePicker] = useState(false);

  const addSection = (type: CustomSectionType) => {
    onChange([...sections, createEmptySection(type)]);
    setShowTypePicker(false);
  };

  const updateSection = (idx: number, s: CustomSection) => {
    onChange(sections.map((sec, i) => i === idx ? s : sec));
  };

  const removeSection = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...sections];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveDown = (idx: number) => {
    if (idx >= sections.length - 1) return;
    const arr = [...sections];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  return (
    <SectionCard title="➕ Secciones Personalizadas" defaultOpen={sections.length > 0}>
      <div className="space-y-4 pt-3">
        {sections.length === 0 && (
          <p className="text-xs text-foreground/40 text-center py-2">No hay secciones personalizadas. Agrega una para extender esta página con textos, imágenes, videos, botones y más.</p>
        )}
        {sections.map((section, idx) => (
          <CustomSectionItemEditor
            key={section.id}
            section={section}
            onUpdate={s => updateSection(idx, s)}
            onRemove={() => removeSection(idx)}
            onMoveUp={() => moveUp(idx)}
            onMoveDown={() => moveDown(idx)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
          />
        ))}

        {/* Add section button / type picker */}
        {showTypePicker ? (
          <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/20">
            <p className="text-xs font-semibold text-foreground/60 mb-3">¿Qué tipo de sección querés agregar?</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => addSection(opt.value)}
                  className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <div>
                    <span className="text-xs font-semibold text-foreground/80 block">{opt.label}</span>
                    <span className="text-[10px] text-foreground/40">{opt.description}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTypePicker(false)} className="w-full mt-3 py-1.5 text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTypePicker(true)}
            className="w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" /> Agregar Sección
          </button>
        )}
      </div>
    </SectionCard>
  );
}

// ============================================================
// PAGE-SPECIFIC FORM EDITORS
// ============================================================

// ---- INDEX ----
function IndexEditor({ content, onChange }: { content: IndexContent; onChange: (c: IndexContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });
  const updateSlide = (idx: number, updates: Partial<HeroSlide>) => {
    const slides = content.heroSlides.map((s, i) => i === idx ? { ...s, ...updates } : s);
    onChange({ ...content, heroSlides: slides });
  };
  const addSlide = () => {
    onChange({ ...content, heroSlides: [...content.heroSlides, { id: Date.now().toString(), image: '', title: 'Nuevo Slide', subtitle: '', ctaText: 'Ver', ctaLink: '/colecciones' }] });
  };
  const removeSlide = (idx: number) => {
    onChange({ ...content, heroSlides: content.heroSlides.filter((_, i) => i !== idx) });
  };

  const updateCard = (idx: number, updates: Partial<ProductCard>) => {
    const cards = content.productCardsSection1.map((c, i) => i === idx ? { ...c, ...updates } : c);
    onChange({ ...content, productCardsSection1: cards });
  };

  const updateLifestyle = (idx: number, updates: Partial<LifestyleImage>) => {
    const imgs = content.lifestyleImages.map((img, i) => i === idx ? { ...img, ...updates } : img);
    onChange({ ...content, lifestyleImages: imgs });
  };

  const updateGridItem = (idx: number, updates: Partial<ContentItem>) => {
    const items = content.contentGrid.map((item, i) => i === idx ? { ...item, ...updates } : item);
    onChange({ ...content, contentGrid: items });
  };

  return (
    <div className="space-y-4">
      {/* Hero Slides */}
      <SectionCard title="🎠 Hero Slideshow">
        <div className="space-y-4 pt-3">
          {content.heroSlides.map((slide, idx) => (
            <div key={slide.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground/70">Slide {idx + 1}</span>
                {content.heroSlides.length > 1 && (
                  <button onClick={() => removeSlide(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <ImageInput value={slide.image} onChange={v => updateSlide(idx, { image: v })} />
              <Field label="Título" {...ts(`slide-${slide.id}-title`)}><TextInput value={slide.title} onChange={v => updateSlide(idx, { title: v })} /></Field>
              <Field label="Subtítulo" {...ts(`slide-${slide.id}-subtitle`)}><TextInput value={slide.subtitle} onChange={v => updateSlide(idx, { subtitle: v })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Texto del botón" {...ts(`slide-${slide.id}-cta`)}><TextInput value={slide.ctaText} onChange={v => updateSlide(idx, { ctaText: v })} /></Field>
                <Field label="Link del botón"><UrlInput value={slide.ctaLink} onChange={v => updateSlide(idx, { ctaLink: v })} /></Field>
              </div>
              <ButtonEditor
                buttons={slide.buttons || []}
                onChange={buttons => updateSlide(idx, { buttons })}
                alignment={slide.buttonAlignment}
                onAlignmentChange={a => updateSlide(idx, { buttonAlignment: a })}
              />
            </div>
          ))}
          <button onClick={addSlide} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Slide
          </button>
        </div>
      </SectionCard>

      {/* Product Cards */}
      <SectionCard title="🛍️ Productos Destacados">
        <div className="space-y-4 pt-3">
          {content.productCardsSection1.map((card, idx) => (
            <div key={card.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-foreground/70">{card.size === 'large' ? '📐 Card Grande' : '📏 Card Mediana'} — {card.title}</span>
              <ImageInput value={card.image} onChange={v => updateCard(idx, { image: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Título" {...ts(`card-${card.id}-title`)}><TextInput value={card.title} onChange={v => updateCard(idx, { title: v })} /></Field>
                <Field label="Subtítulo" {...ts(`card-${card.id}-subtitle`)}><TextInput value={card.subtitle} onChange={v => updateCard(idx, { subtitle: v })} /></Field>
              </div>
              <Field label="Descripción" {...ts(`card-${card.id}-desc`)}><TextArea value={card.description} onChange={v => updateCard(idx, { description: v })} /></Field>
              <Field label="Link"><UrlInput value={card.link} onChange={v => updateCard(idx, { link: v })} /></Field>
              <ButtonEditor
                buttons={card.buttons || []}
                onChange={buttons => updateCard(idx, { buttons })}
                alignment={card.buttonAlignment}
                onAlignmentChange={a => updateCard(idx, { buttonAlignment: a })}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Philosophy */}
      <SectionCard title="💡 Filosofía">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('philosophy-title')}><TextArea value={content.philosophySection.title} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, title: v } })} rows={2} /></Field>
          <Field label="Descripción" {...ts('philosophy-desc')}><TextArea value={content.philosophySection.description} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, description: v } })} rows={4} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto del botón principal" {...ts('philosophy-cta')}><TextInput value={content.philosophySection.ctaText} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, ctaText: v } })} /></Field>
            <Field label="Link del botón principal"><UrlInput value={content.philosophySection.ctaLink} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, ctaLink: v } })} /></Field>
          </div>
          <ButtonEditor
            buttons={content.philosophySection.buttons || []}
            onChange={buttons => onChange({ ...content, philosophySection: { ...content.philosophySection, buttons } })}
            alignment={content.philosophySection.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, philosophySection: { ...content.philosophySection, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      {/* Lifestyle Images */}
      <SectionCard title="📸 Imágenes Lifestyle" defaultOpen={false}>
        <div className="space-y-3 pt-3">
          {content.lifestyleImages.map((img, idx) => (
            <div key={img.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <ImageInput value={img.image} onChange={v => updateLifestyle(idx, { image: v })} />
              <Field label="Etiqueta" {...ts(`lifestyle-${img.id}-label`)}><TextInput value={img.label} onChange={v => updateLifestyle(idx, { label: v })} /></Field>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Full Width Banner */}
      <SectionCard title="🖼️ Banner Full Width" defaultOpen={false}>
        <div className="space-y-3 pt-3">
          <ImageInput value={content.fullWidthBanner.image} onChange={v => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, image: v } })} label="Imagen" />
          <Field label="Título" {...ts('banner-title')}><TextInput value={content.fullWidthBanner.title} onChange={v => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, title: v } })} /></Field>
          <Field label="Subtítulo" {...ts('banner-subtitle')}><TextInput value={content.fullWidthBanner.subtitle} onChange={v => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, subtitle: v } })} /></Field>
          <ButtonEditor
            buttons={content.fullWidthBanner.buttons || []}
            onChange={buttons => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, buttons } })}
            alignment={content.fullWidthBanner.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      {/* Content Grid */}
      <SectionCard title="📊 Grid de Contenido" defaultOpen={false}>
        <div className="space-y-4 pt-3">
          {content.contentGrid.map((item, idx) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-foreground/70">Item {idx + 1}</span>
              <ImageInput value={item.image} onChange={v => updateGridItem(idx, { image: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Título" {...ts(`grid-${item.id}-title`)}><TextInput value={item.title} onChange={v => updateGridItem(idx, { title: v })} /></Field>
                <Field label="Link"><UrlInput value={item.link} onChange={v => updateGridItem(idx, { link: v })} /></Field>
              </div>
              <Field label="Descripción" {...ts(`grid-${item.id}-desc`)}><TextInput value={item.description} onChange={v => updateGridItem(idx, { description: v })} /></Field>
              <ButtonEditor
                buttons={item.buttons || []}
                onChange={buttons => updateGridItem(idx, { buttons })}
                alignment={item.buttonAlignment}
                onAlignmentChange={a => updateGridItem(idx, { buttonAlignment: a })}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <CustomSectionsEditor sections={content.customSections || []} onChange={s => onChange({ ...content, customSections: s })} />
    </div>
  );
}

// ---- NOSOTROS ----
function NosotrosEditor({ content, onChange }: { content: NosotrosContent; onChange: (c: NosotrosContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });
  const updateValue = (idx: number, updates: Partial<{ title: string; description: string }>) => {
    const items = content.values.items.map((v, i) => i === idx ? { ...v, ...updates } : v);
    onChange({ ...content, values: { ...content.values, items } });
  };
  const addValue = () => {
    onChange({ ...content, values: { ...content.values, items: [...content.values.items, { title: 'Nuevo valor', description: 'Descripción del valor' }] } });
  };
  const removeValue = (idx: number) => {
    onChange({ ...content, values: { ...content.values, items: content.values.items.filter((_, i) => i !== idx) } });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="🏠 Hero">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('hero-title')}><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Descripción" {...ts('hero-desc')}><TextArea value={content.hero.description} onChange={v => onChange({ ...content, hero: { ...content.hero, description: v } })} rows={4} /></Field>
          <ButtonEditor
            buttons={content.hero.buttons || []}
            onChange={buttons => onChange({ ...content, hero: { ...content.hero, buttons } })}
            alignment={content.hero.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, hero: { ...content.hero, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <SectionCard title="📷 Imagen Header">
        <div className="pt-3">
          <ImageInput value={content.headerImage} onChange={v => onChange({ ...content, headerImage: v })} />
        </div>
      </SectionCard>

      <SectionCard title="👁️ Visión">
        <div className="space-y-3 pt-3">
          <ImageInput value={content.vision.image} onChange={v => onChange({ ...content, vision: { ...content.vision, image: v } })} label="Imagen" />
          <Field label="Título" {...ts('vision-title')}><TextInput value={content.vision.title} onChange={v => onChange({ ...content, vision: { ...content.vision, title: v } })} /></Field>
          <Field label="Párrafo 1" {...ts('vision-p1')}><TextArea value={content.vision.paragraph1} onChange={v => onChange({ ...content, vision: { ...content.vision, paragraph1: v } })} /></Field>
          <Field label="Párrafo 2" {...ts('vision-p2')}><TextArea value={content.vision.paragraph2} onChange={v => onChange({ ...content, vision: { ...content.vision, paragraph2: v } })} /></Field>
          <ButtonEditor
            buttons={content.vision.buttons || []}
            onChange={buttons => onChange({ ...content, vision: { ...content.vision, buttons } })}
            alignment={content.vision.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, vision: { ...content.vision, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <SectionCard title="⭐ Valores">
        <div className="space-y-3 pt-3">
          <ImageInput value={content.values.image} onChange={v => onChange({ ...content, values: { ...content.values, image: v } })} label="Imagen" />
          <Field label="Título" {...ts('values-title')}><TextInput value={content.values.title} onChange={v => onChange({ ...content, values: { ...content.values, title: v } })} /></Field>
          {content.values.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Field label={`Valor ${idx + 1} — Título`} {...ts(`value-${idx}-title`)}><TextInput value={item.title} onChange={v => updateValue(idx, { title: v })} /></Field>
                <Field label="Descripción" {...ts(`value-${idx}-desc`)}><TextInput value={item.description} onChange={v => updateValue(idx, { description: v })} /></Field>
              </div>
              {content.values.items.length > 1 && (
                <button onClick={() => removeValue(idx)} className="p-1 mt-5 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
          <button onClick={addValue} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Valor
          </button>
          <ButtonEditor
            buttons={content.values.buttons || []}
            onChange={buttons => onChange({ ...content, values: { ...content.values, buttons } })}
            alignment={content.values.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, values: { ...content.values, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <SectionCard title="📢 CTA" defaultOpen={false}>
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('cta-title')}><TextInput value={content.cta.title} onChange={v => onChange({ ...content, cta: { ...content.cta, title: v } })} /></Field>
          <Field label="Descripción" {...ts('cta-desc')}><TextArea value={content.cta.description} onChange={v => onChange({ ...content, cta: { ...content.cta, description: v } })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto del botón principal" {...ts('cta-btntext')}><TextInput value={content.cta.buttonText} onChange={v => onChange({ ...content, cta: { ...content.cta, buttonText: v } })} /></Field>
            <Field label="Link"><UrlInput value={content.cta.buttonLink} onChange={v => onChange({ ...content, cta: { ...content.cta, buttonLink: v } })} /></Field>
          </div>
          <ButtonEditor
            buttons={content.cta.buttons || []}
            onChange={buttons => onChange({ ...content, cta: { ...content.cta, buttons } })}
            alignment={content.cta.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, cta: { ...content.cta, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <CustomSectionsEditor sections={content.customSections || []} onChange={s => onChange({ ...content, customSections: s })} />
    </div>
  );
}

// ---- PRODUCCIÓN ----
function ProduccionEditor({ content, onChange }: { content: ProduccionContent; onChange: (c: ProduccionContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });
  const updatePillar = (idx: number, updates: Partial<{ title: string; description: string; image: string; buttons: CustomButton[]; buttonAlignment: ButtonAlignment }>) => {
    const pillars = content.pillars.map((p, i) => i === idx ? { ...p, ...updates } : p);
    onChange({ ...content, pillars });
  };
  const addPillar = () => {
    onChange({ ...content, pillars: [...content.pillars, { title: 'Nuevo pilar', description: 'Descripción', image: '' }] });
  };
  const removePillar = (idx: number) => {
    onChange({ ...content, pillars: content.pillars.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="🏠 Hero">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('hero-title')}><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Descripción" {...ts('hero-desc')}><TextArea value={content.hero.description} onChange={v => onChange({ ...content, hero: { ...content.hero, description: v } })} /></Field>
          <ButtonEditor
            buttons={content.hero.buttons || []}
            onChange={buttons => onChange({ ...content, hero: { ...content.hero, buttons } })}
            alignment={content.hero.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, hero: { ...content.hero, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <SectionCard title="🏛️ Pilares de Producción">
        <div className="space-y-4 pt-3">
          {content.pillars.map((pillar, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">Pilar {idx + 1}</span>
                {content.pillars.length > 1 && (
                  <button onClick={() => removePillar(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <ImageInput value={pillar.image} onChange={v => updatePillar(idx, { image: v })} />
              <Field label="Título" {...ts(`pillar-${idx}-title`)}><TextInput value={pillar.title} onChange={v => updatePillar(idx, { title: v })} /></Field>
              <Field label="Descripción" {...ts(`pillar-${idx}-desc`)}><TextArea value={pillar.description} onChange={v => updatePillar(idx, { description: v })} /></Field>
              <ButtonEditor
                buttons={pillar.buttons || []}
                onChange={buttons => updatePillar(idx, { buttons })}
                alignment={pillar.buttonAlignment}
                onAlignmentChange={a => updatePillar(idx, { buttonAlignment: a })}
              />
            </div>
          ))}
          <button onClick={addPillar} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Pilar
          </button>
        </div>
      </SectionCard>

      <CustomSectionsEditor sections={content.customSections || []} onChange={s => onChange({ ...content, customSections: s })} />
    </div>
  );
}

// ---- EVENTOS ----
function EventosEditor({ content, onChange }: { content: EventosContent; onChange: (c: EventosContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });
  const updateUpcoming = (idx: number, updates: Partial<EventoItem>) => {
    const events = content.upcomingEvents.map((e, i) => i === idx ? { ...e, ...updates } : e);
    onChange({ ...content, upcomingEvents: events });
  };
  const addUpcoming = () => {
    onChange({ ...content, upcomingEvents: [...content.upcomingEvents, { id: Date.now().toString(), image: '', date: '', location: '', title: 'Nuevo Evento', description: '' }] });
  };
  const removeUpcoming = (idx: number) => {
    onChange({ ...content, upcomingEvents: content.upcomingEvents.filter((_, i) => i !== idx) });
  };

  const updatePast = (idx: number, updates: Partial<EventoItem>) => {
    const events = content.pastEvents.map((e, i) => i === idx ? { ...e, ...updates } : e);
    onChange({ ...content, pastEvents: events });
  };
  const addPast = () => {
    onChange({ ...content, pastEvents: [...content.pastEvents, { id: Date.now().toString(), image: '', date: '', location: '', title: 'Evento Pasado', description: '' }] });
  };
  const removePast = (idx: number) => {
    onChange({ ...content, pastEvents: content.pastEvents.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="📋 Encabezado">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('header-title')}><TextInput value={content.title} onChange={v => onChange({ ...content, title: v })} /></Field>
          <Field label="Subtítulo" {...ts('header-subtitle')}><TextInput value={content.subtitle} onChange={v => onChange({ ...content, subtitle: v })} /></Field>
          <ButtonEditor
            buttons={content.buttons || []}
            onChange={buttons => onChange({ ...content, buttons })}
            alignment={content.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, buttonAlignment: a })}
          />
        </div>
      </SectionCard>

      <SectionCard title="📅 Próximos Eventos">
        <div className="space-y-4 pt-3">
          <Field label="Título de sección" {...ts('upcoming-title')}><TextInput value={content.upcomingTitle} onChange={v => onChange({ ...content, upcomingTitle: v })} /></Field>
          {content.upcomingEvents.map((evt, idx) => (
            <div key={evt.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">Evento {idx + 1}</span>
                <button onClick={() => removeUpcoming(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <ImageInput value={evt.image} onChange={v => updateUpcoming(idx, { image: v })} />
              <Field label="Título" {...ts(`upcoming-${evt.id}-title`)}><TextInput value={evt.title} onChange={v => updateUpcoming(idx, { title: v })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha"><TextInput value={evt.date} onChange={v => updateUpcoming(idx, { date: v })} placeholder="DD/MM/AAAA" /></Field>
                <Field label="Ubicación"><TextInput value={evt.location} onChange={v => updateUpcoming(idx, { location: v })} /></Field>
              </div>
              <Field label="Descripción" {...ts(`upcoming-${evt.id}-desc`)}><TextArea value={evt.description} onChange={v => updateUpcoming(idx, { description: v })} /></Field>
              {/* Modal info */}
              <details className="border-t pt-3 mt-3">
                <summary className="text-xs font-medium text-foreground/50 cursor-pointer hover:text-foreground/70">Info del Modal (opcional)</summary>
                <div className="space-y-2 mt-3">
                  <Field label="Horario"><TextInput value={evt.modalInfo?.time || ''} onChange={v => updateUpcoming(idx, { modalInfo: { time: v, fullDescription: evt.modalInfo?.fullDescription || '', includes: evt.modalInfo?.includes || '', buttonText: evt.modalInfo?.buttonText || '', buttonEmail: evt.modalInfo?.buttonEmail || '' } })} placeholder="18:00 - 22:00 hs" /></Field>
                  <Field label="Descripción completa"><TextArea value={evt.modalInfo?.fullDescription || ''} onChange={v => updateUpcoming(idx, { modalInfo: { ...evt.modalInfo!, fullDescription: v } })} /></Field>
                  <Field label="Incluye"><TextInput value={evt.modalInfo?.includes || ''} onChange={v => updateUpcoming(idx, { modalInfo: { ...evt.modalInfo!, includes: v } })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Texto botón"><TextInput value={evt.modalInfo?.buttonText || ''} onChange={v => updateUpcoming(idx, { modalInfo: { ...evt.modalInfo!, buttonText: v } })} /></Field>
                    <Field label="Email botón"><TextInput value={evt.modalInfo?.buttonEmail || ''} onChange={v => updateUpcoming(idx, { modalInfo: { ...evt.modalInfo!, buttonEmail: v } })} /></Field>
                  </div>
                </div>
              </details>
            </div>
          ))}
          <button onClick={addUpcoming} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Evento
          </button>
        </div>
      </SectionCard>

      <SectionCard title="📜 Eventos Pasados" defaultOpen={false}>
        <div className="space-y-4 pt-3">
          <Field label="Título de sección" {...ts('past-title')}><TextInput value={content.pastTitle} onChange={v => onChange({ ...content, pastTitle: v })} /></Field>
          {content.pastEvents.map((evt, idx) => (
            <div key={evt.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">Evento {idx + 1}</span>
                <button onClick={() => removePast(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <ImageInput value={evt.image} onChange={v => updatePast(idx, { image: v })} />
              <Field label="Título" {...ts(`past-${evt.id}-title`)}><TextInput value={evt.title} onChange={v => updatePast(idx, { title: v })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha"><TextInput value={evt.date} onChange={v => updatePast(idx, { date: v })} placeholder="DD/MM/AAAA" /></Field>
                <Field label="Ubicación"><TextInput value={evt.location} onChange={v => updatePast(idx, { location: v })} /></Field>
              </div>
            </div>
          ))}
          <button onClick={addPast} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Evento Pasado
          </button>
        </div>
      </SectionCard>

      <CustomSectionsEditor sections={content.customSections || []} onChange={s => onChange({ ...content, customSections: s })} />
    </div>
  );
}

// ---- UBICACIONES ----
function UbicacionesEditor({ content, onChange }: { content: UbicacionesContent; onChange: (c: UbicacionesContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });
  return (
    <div className="space-y-4">
      <SectionCard title="🏠 Encabezado">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('hero-title')}><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Descripción" {...ts('hero-desc')}><TextArea value={content.hero.description} onChange={v => onChange({ ...content, hero: { ...content.hero, description: v } })} /></Field>
          <ButtonEditor
            buttons={content.hero.buttons || []}
            onChange={buttons => onChange({ ...content, hero: { ...content.hero, buttons } })}
            alignment={content.hero.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, hero: { ...content.hero, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <SectionCard title="🗺️ Mapa">
        <div className="pt-3">
          <Field label="URL de Google Maps Embed"><TextInput value={content.mapEmbedUrl} onChange={v => onChange({ ...content, mapEmbedUrl: v })} placeholder="https://www.google.com/maps/embed?..." /></Field>
        </div>
      </SectionCard>

      <SectionCard title="📍 Información de Ubicación">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('location-title')}><TextInput value={content.location.title} onChange={v => onChange({ ...content, location: { ...content.location, title: v } })} /></Field>
          <Field label="Dirección" {...ts('location-address')}><TextInput value={content.location.address} onChange={v => onChange({ ...content, location: { ...content.location, address: v } })} /></Field>
          <Field label="Nota" {...ts('location-note')}><TextInput value={content.location.note} onChange={v => onChange({ ...content, location: { ...content.location, note: v } })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto del botón"><TextInput value={content.location.buttonText} onChange={v => onChange({ ...content, location: { ...content.location, buttonText: v } })} /></Field>
            <Field label="Email"><TextInput value={content.location.buttonEmail} onChange={v => onChange({ ...content, location: { ...content.location, buttonEmail: v } })} /></Field>
          </div>
          <ButtonEditor
            buttons={content.location.buttons || []}
            onChange={buttons => onChange({ ...content, location: { ...content.location, buttons } })}
            alignment={content.location.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, location: { ...content.location, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <CustomSectionsEditor sections={content.customSections || []} onChange={s => onChange({ ...content, customSections: s })} />
    </div>
  );
}

// ---- CONTACTO ----
function ContactoEditor({ content, onChange }: { content: ContactoContent; onChange: (c: ContactoContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });
  return (
    <div className="space-y-4">
      <SectionCard title="🏠 Encabezado">
        <div className="space-y-3 pt-3">
          <Field label="Título" {...ts('hero-title')}><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Subtítulo 1" {...ts('hero-subtitle1')}><TextInput value={content.hero.subtitle1} onChange={v => onChange({ ...content, hero: { ...content.hero, subtitle1: v } })} /></Field>
          <Field label="Subtítulo 2" {...ts('hero-subtitle2')}><TextInput value={content.hero.subtitle2} onChange={v => onChange({ ...content, hero: { ...content.hero, subtitle2: v } })} /></Field>
          <ButtonEditor
            buttons={content.hero.buttons || []}
            onChange={buttons => onChange({ ...content, hero: { ...content.hero, buttons } })}
            alignment={content.hero.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, hero: { ...content.hero, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      <SectionCard title="📝 Etiquetas del Formulario">
        <div className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Campo Nombre"><TextInput value={content.formLabels.nombre} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, nombre: v } })} /></Field>
            <Field label="Campo Email"><TextInput value={content.formLabels.email} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, email: v } })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Campo Asunto"><TextInput value={content.formLabels.asunto} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, asunto: v } })} /></Field>
            <Field label="Campo Mensaje"><TextInput value={content.formLabels.mensaje} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, mensaje: v } })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto botón enviar"><TextInput value={content.formLabels.submitButton} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, submitButton: v } })} /></Field>
            <Field label="Texto enviando"><TextInput value={content.formLabels.submitting} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, submitting: v } })} /></Field>
          </div>
          <Field label="Mensaje de éxito"><TextInput value={content.formLabels.successMessage} onChange={v => onChange({ ...content, formLabels: { ...content.formLabels, successMessage: v } })} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="ℹ️ Sección de Información">
        <div className="pt-3">
          <Field label="Título" {...ts('info-title')}><TextInput value={content.infoSection.title} onChange={v => onChange({ ...content, infoSection: { ...content.infoSection, title: v } })} /></Field>
          <p className="text-xs text-foreground/40 mt-2">La información de contacto (email, teléfono, dirección, redes sociales) se configura en <Link href="/admin/configuracion" className="text-blue-600 hover:underline">Configuración del Sitio</Link>.</p>
        </div>
      </SectionCard>

      <CustomSectionsEditor sections={content.customSections || []} onChange={s => onChange({ ...content, customSections: s })} />
    </div>
  );
}

// ---- LAYOUT (Header / Footer / BrandSection) ----
function LayoutEditor({ content, onChange }: { content: LayoutContent; onChange: (c: LayoutContent) => void }) {
  const ts = (key: string) => ({ styleKey: key, textStyles: content.textStyles, onStyleChange: (k: string, s: TextStyle | undefined) => { const next = { ...content.textStyles }; if (s) next[k] = s; else delete next[k]; onChange({ ...content, textStyles: next }); } });

  // ---- Header nav links ----
  const updateNavLink = (idx: number, updates: Partial<NavLink>) => {
    const links = content.header.navLinks.map((l, i) => i === idx ? { ...l, ...updates } : l);
    onChange({ ...content, header: { ...content.header, navLinks: links } });
  };
  const addNavLink = () => {
    onChange({ ...content, header: { ...content.header, navLinks: [...content.header.navLinks, { id: Date.now().toString(), label: 'Nuevo', href: '/' }] } });
  };
  const removeNavLink = (idx: number) => {
    onChange({ ...content, header: { ...content.header, navLinks: content.header.navLinks.filter((_, i) => i !== idx) } });
  };
  const moveNavLink = (idx: number, dir: -1 | 1) => {
    const arr = [...content.header.navLinks];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    onChange({ ...content, header: { ...content.header, navLinks: arr } });
  };

  // ---- Footer link columns ----
  const updateColumn = (colIdx: number, updates: Partial<FooterLinkColumn>) => {
    const cols = content.footer.linkColumns.map((c, i) => i === colIdx ? { ...c, ...updates } : c);
    onChange({ ...content, footer: { ...content.footer, linkColumns: cols } });
  };
  const addColumn = () => {
    onChange({ ...content, footer: { ...content.footer, linkColumns: [...content.footer.linkColumns, { id: Date.now().toString(), title: 'Nueva Columna', links: [] }] } });
  };
  const removeColumn = (idx: number) => {
    onChange({ ...content, footer: { ...content.footer, linkColumns: content.footer.linkColumns.filter((_, i) => i !== idx) } });
  };
  const addFooterLink = (colIdx: number) => {
    const col = content.footer.linkColumns[colIdx];
    updateColumn(colIdx, { links: [...col.links, { id: Date.now().toString(), label: 'Nuevo Link', href: '/' }] });
  };
  const removeFooterLink = (colIdx: number, linkIdx: number) => {
    const col = content.footer.linkColumns[colIdx];
    updateColumn(colIdx, { links: col.links.filter((_, i) => i !== linkIdx) });
  };
  const updateFooterLink = (colIdx: number, linkIdx: number, updates: Partial<{ label: string; href: string }>) => {
    const col = content.footer.linkColumns[colIdx];
    const links = col.links.map((l, i) => i === linkIdx ? { ...l, ...updates } : l);
    updateColumn(colIdx, { links });
  };

  return (
    <div className="space-y-4">
      {/* ===== HEADER ===== */}
      <SectionCard title="🔝 Header / Navegación">
        <div className="space-y-4 pt-3">
          <ImageInput value={content.header.logoUrl} onChange={v => onChange({ ...content, header: { ...content.header, logoUrl: v } })} label="URL del Logo" />

          <label className="block text-xs font-medium text-foreground/60 mt-4">Links de Navegación</label>
          {content.header.navLinks.map((link, idx) => (
            <div key={link.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveNavLink(idx, -1)} disabled={idx === 0} className="p-0.5 text-foreground/30 hover:text-foreground/60 disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={() => moveNavLink(idx, 1)} disabled={idx === content.header.navLinks.length - 1} className="p-0.5 text-foreground/30 hover:text-foreground/60 disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Field label="" {...ts(`nav-${link.id}`)}><TextInput value={link.label} onChange={v => updateNavLink(idx, { label: v })} placeholder="Etiqueta" /></Field>
                <UrlInput value={link.href} onChange={v => updateNavLink(idx, { href: v })} placeholder="/ruta" />
              </div>
              <button onClick={() => removeNavLink(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          <button onClick={addNavLink} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Agregar Link
          </button>

          <ButtonEditor
            buttons={content.header.buttons || []}
            onChange={buttons => onChange({ ...content, header: { ...content.header, buttons } })}
            alignment={content.header.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, header: { ...content.header, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>

      {/* ===== BRAND SECTION ===== */}
      <SectionCard title="✦ Sección Pre-Footer (SOFTWORKS)">
        <div className="space-y-3 pt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-foreground/60">Visible</label>
            <button
              onClick={() => onChange({ ...content, brandSection: { ...content.brandSection, enabled: !content.brandSection.enabled } })}
              className={`relative w-10 h-5 rounded-full transition-colors ${content.brandSection.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${content.brandSection.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <Field label="Texto" {...ts('brand-text')}><TextInput value={content.brandSection.text} onChange={v => onChange({ ...content, brandSection: { ...content.brandSection, text: v } })} placeholder="Softworks" /></Field>
        </div>
      </SectionCard>

      {/* ===== FOOTER ===== */}
      <SectionCard title="📄 Footer — Newsletter">
        <div className="space-y-3 pt-3">
          <Field label="Título del Newsletter" {...ts('footer-newsletter-title')}>
            <TextInput value={content.footer.newsletterTitle} onChange={v => onChange({ ...content, footer: { ...content.footer, newsletterTitle: v } })} placeholder="Unite a la comunidad {site_name}" />
          </Field>
          <p className="text-[10px] text-foreground/40">Usa <code className="bg-gray-100 px-1 rounded">{'{site_name}'}</code> para insertar el nombre del sitio.</p>
          <Field label="Descripción" {...ts('footer-newsletter-desc')}><TextArea value={content.footer.newsletterDescription} onChange={v => onChange({ ...content, footer: { ...content.footer, newsletterDescription: v } })} /></Field>
          <Field label="Nota de privacidad" {...ts('footer-privacy-note')}><TextInput value={content.footer.privacyNote} onChange={v => onChange({ ...content, footer: { ...content.footer, privacyNote: v } })} /></Field>
          <Field label="Email de contacto"><TextInput value={content.footer.contactEmail} onChange={v => onChange({ ...content, footer: { ...content.footer, contactEmail: v } })} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="📄 Footer — Columnas de Links">
        <div className="space-y-4 pt-3">
          {content.footer.linkColumns.map((col, colIdx) => (
            <div key={col.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
                <Field label="" {...ts(`footer-col-${col.id}-title`)}><TextInput value={col.title} onChange={v => updateColumn(colIdx, { title: v })} placeholder="Título de columna" /></Field>
                <button onClick={() => removeColumn(colIdx)} className="p-1 text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="p-3 space-y-2">
                {col.links.map((link, linkIdx) => (
                  <div key={link.id} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <TextInput value={link.label} onChange={v => updateFooterLink(colIdx, linkIdx, { label: v })} placeholder="Etiqueta" />
                      <UrlInput value={link.href} onChange={v => updateFooterLink(colIdx, linkIdx, { href: v })} placeholder="/ruta" />
                    </div>
                    <button onClick={() => removeFooterLink(colIdx, linkIdx)} className="p-0.5 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => addFooterLink(colIdx)} className="w-full py-1.5 border border-dashed border-gray-300 rounded text-[10px] text-foreground/40 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Link
                </button>
              </div>
            </div>
          ))}
          {content.footer.linkColumns.length < 6 && (
            <button onClick={addColumn} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Agregar Columna
            </button>
          )}
        </div>
      </SectionCard>

      <SectionCard title="📄 Footer — Botones">
        <div className="space-y-3 pt-3">
          <p className="text-[10px] text-foreground/40">Agrega botones CTA al footer (se muestran debajo de las columnas de links).</p>
          <ButtonEditor
            buttons={content.footer.buttons || []}
            onChange={buttons => onChange({ ...content, footer: { ...content.footer, buttons } })}
            alignment={content.footer.buttonAlignment}
            onAlignmentChange={a => onChange({ ...content, footer: { ...content.footer, buttonAlignment: a } })}
          />
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// MAIN EDITOR PAGE
// ============================================================
export default function AdminContenidosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { content: indexContent, refreshContent: refreshIndex } = useIndexContent();
  const { nosotros, produccion, eventos, ubicaciones, contacto, refreshContent: refreshPages } = usePagesContent();
  const { layout: layoutContent, refreshLayout } = useLayoutContent();

  const [activePage, setActivePage] = useState<PageId>('index');
  const [device, setDevice] = useState<DevicePreview>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Local state for each page (mutable copies)
  const [indexData, setIndexData] = useState<IndexContent>(indexContent);
  const [nosotrosData, setNosotrosData] = useState<NosotrosContent>(nosotros);
  const [produccionData, setProduccionData] = useState<ProduccionContent>(produccion);
  const [eventosData, setEventosData] = useState<EventosContent>(eventos);
  const [ubicacionesData, setUbicacionesData] = useState<UbicacionesContent>(ubicaciones);
  const [contactoData, setContactoData] = useState<ContactoContent>(contacto);
  const [layoutData, setLayoutData] = useState<LayoutContent>(layoutContent);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Sync from providers once loaded
  useEffect(() => {
    if (!authLoading) {
      setIndexData(indexContent);
      setNosotrosData(nosotros);
      setProduccionData(produccion);
      setEventosData(eventos);
      setUbicacionesData(ubicaciones);
      setContactoData(contacto);
      setLayoutData(layoutContent);
      setIsLoaded(true);
    }
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as changed
  const markChanged = useCallback(() => {
    setHasChanges(true);
    setSaveStatus('idle');
  }, []);

  const handleIndexChange = useCallback((c: IndexContent) => { setIndexData(c); markChanged(); }, [markChanged]);
  const handleNosotrosChange = useCallback((c: NosotrosContent) => { setNosotrosData(c); markChanged(); }, [markChanged]);
  const handleProduccionChange = useCallback((c: ProduccionContent) => { setProduccionData(c); markChanged(); }, [markChanged]);
  const handleEventosChange = useCallback((c: EventosContent) => { setEventosData(c); markChanged(); }, [markChanged]);
  const handleUbicacionesChange = useCallback((c: UbicacionesContent) => { setUbicacionesData(c); markChanged(); }, [markChanged]);
  const handleContactoChange = useCallback((c: ContactoContent) => { setContactoData(c); markChanged(); }, [markChanged]);
  const handleLayoutChange = useCallback((c: LayoutContent) => { setLayoutData(c); markChanged(); }, [markChanged]);

  // ---- REAL-TIME PREVIEW via postMessage ----
  const sendPreview = useCallback((key: string, value: unknown) => {
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'content-preview', key, value }, '*');
    } catch { /* iframe may not be ready */ }
  }, []);

  // Send preview updates when data changes (debounced slightly)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      const keyMap: Record<PageId, { key: string; value: unknown }> = {
        layout: { key: 'contenido_layout', value: layoutData },
        index: { key: 'contenido_index', value: indexData },
        nosotros: { key: 'contenido_nosotros', value: nosotrosData },
        produccion: { key: 'contenido_produccion', value: produccionData },
        eventos: { key: 'contenido_eventos', value: eventosData },
        ubicaciones: { key: 'contenido_ubicaciones', value: ubicacionesData },
        contacto: { key: 'contenido_contacto', value: contactoData },
      };
      const entry = keyMap[activePage];
      if (entry) sendPreview(entry.key, entry.value);
      // Always send layout updates (affects all pages)
      if (activePage !== 'layout') {
        sendPreview('contenido_layout', layoutData);
      }
    }, 150);
    return () => clearTimeout(previewTimerRef.current);
  }, [activePage, indexData, nosotrosData, produccionData, eventosData, ubicacionesData, contactoData, layoutData, sendPreview]);

  // ---- SAVE ----
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    const supabase = getSupabaseClient();

    try {
      const updates = [
        { clave: 'contenido_index', valor: JSON.stringify(indexData) },
        { clave: 'contenido_nosotros', valor: JSON.stringify(nosotrosData) },
        { clave: 'contenido_produccion', valor: JSON.stringify(produccionData) },
        { clave: 'contenido_eventos', valor: JSON.stringify(eventosData) },
        { clave: 'contenido_ubicaciones', valor: JSON.stringify(ubicacionesData) },
        { clave: 'contenido_contacto', valor: JSON.stringify(contactoData) },
        { clave: 'contenido_layout', valor: JSON.stringify(layoutData) },
      ];

      for (const u of updates) {
        const { error } = await supabase.from('configuracion_sitio').upsert(
          { clave: u.clave, valor: u.valor },
          { onConflict: 'clave' }
        );
        if (error) throw error;
      }

      await Promise.all([refreshIndex(), refreshPages(), refreshLayout()]);
      setHasChanges(false);
      setSaveStatus('saved');
      // Refresh iframe preview
      setIframeKey(prev => prev + 1);
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [indexData, nosotrosData, produccionData, eventosData, ubicacionesData, contactoData, layoutData, refreshIndex, refreshPages, refreshLayout]);

  // Ctrl+S
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handleSave]);

  // ---- LOADING / AUTH ----
  if (authLoading || !isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-foreground/40" />
          <p className="text-sm text-foreground/50">Cargando editor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="h-screen flex items-center justify-center"><p className="text-red-500 text-sm">Acceso denegado. Solo administradores.</p></div>;
  }

  const deviceWidths: Record<DevicePreview, string> = { desktop: '100%', tablet: '768px', mobile: '375px' };
  const activeTab = PAGE_TABS.find(t => t.id === activePage)!;

  const getPreviewUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${activeTab.path}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0 z-50">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Volver al Admin">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold tracking-wide">CONTENIDOS</span>
        </div>

        {/* Center - Page tabs */}
        <div className="flex items-center gap-1">
          {PAGE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activePage === tab.id ? 'bg-foreground text-white' : 'text-foreground/60 hover:bg-gray-100'}`}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Device toggle */}
          <div className="flex items-center gap-1 mr-2">
            {(['desktop', 'tablet', 'mobile'] as const).map(d => (
              <button key={d} onClick={() => setDevice(d)} className={`p-1.5 rounded-lg transition-colors ${device === d ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-foreground/50'}`} title={d}>
                {d === 'desktop' ? <Monitor className="w-4 h-4" /> : d === 'tablet' ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />

          {hasChanges && <span className="text-xs text-amber-600 font-medium">Sin guardar</span>}
          {saveStatus === 'saved' && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" />Guardado</span>}
          {saveStatus === 'error' && <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />Error al guardar</span>}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Form editor */}
        <div className="w-[440px] shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 space-y-1">
            <div className="flex items-center gap-2 mb-4 px-1">
              {activeTab.icon}
              <h2 className="text-sm font-semibold">{activeTab.label}</h2>
            </div>

            {activePage === 'layout' && <LayoutEditor content={layoutData} onChange={handleLayoutChange} />}
            {activePage === 'index' && <IndexEditor content={indexData} onChange={handleIndexChange} />}
            {activePage === 'nosotros' && <NosotrosEditor content={nosotrosData} onChange={handleNosotrosChange} />}
            {activePage === 'produccion' && <ProduccionEditor content={produccionData} onChange={handleProduccionChange} />}
            {activePage === 'eventos' && <EventosEditor content={eventosData} onChange={handleEventosChange} />}
            {activePage === 'ubicaciones' && <UbicacionesEditor content={ubicacionesData} onChange={handleUbicacionesChange} />}
            {activePage === 'contacto' && <ContactoEditor content={contactoData} onChange={handleContactoChange} />}
          </div>
        </div>

        {/* RIGHT PANEL - Live Preview iframe */}
        <div className="flex-1 overflow-hidden bg-gray-200 flex items-start justify-center p-6">
          <div
            className="bg-white shadow-2xl overflow-hidden transition-all duration-300 h-full"
            style={{
              width: deviceWidths[device],
              maxWidth: '100%',
              borderRadius: device !== 'desktop' ? '20px' : '0',
              border: device !== 'desktop' ? '8px solid #333' : 'none',
            }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={getPreviewUrl()}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
