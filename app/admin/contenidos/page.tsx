'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Loader2, Undo2, Redo2, Eye, EyeOff, Monitor,
  Tablet, Smartphone, ZoomIn, ZoomOut, Plus, Trash2,
  Copy, ChevronUp, ChevronDown, GripVertical, Settings2,
  Type, Image as ImageIcon, MousePointer, X,
  Layout, ArrowLeft, Sparkles, Lock, Unlock,
  AlignLeft, AlignCenter, AlignRight, Move, PanelRightOpen,
  PanelRightClose as PanelCloseIcon, Home, Users, Factory,
  Calendar, MapPin, Phone, Layers, Play, Square
} from 'lucide-react';
import Link from 'next/link';
import { HexColorPicker } from 'react-colorful';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIndexContent } from '@/lib/hooks/useIndexContent';
import { usePagesContent } from '@/lib/hooks/usePagesContent';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useEditorStore } from '@/lib/editor/useEditorStore';
import type { EditorSection, EditorElement, AnimationConfig, DevicePreview, EasingType } from '@/lib/editor/types';
import { ANIMATION_TYPES, EASING_TYPES } from '@/lib/editor/types';
import { generateId } from '@/lib/editor/animations';
import { sectionTemplates, getAllCategories } from '@/lib/editor/templates';
import { convertAllPages } from '@/lib/editor/converters';

// ============================================================
// PAGE ICONS
// ============================================================
const PAGE_ICONS: Record<string, React.ReactNode> = {
  index: <Home className="w-4 h-4" />,
  nosotros: <Users className="w-4 h-4" />,
  produccion: <Factory className="w-4 h-4" />,
  eventos: <Calendar className="w-4 h-4" />,
  ubicaciones: <MapPin className="w-4 h-4" />,
  contacto: <Phone className="w-4 h-4" />,
};

// ============================================================
// ELEMENT WRAPPER (hover & click overlays)
// ============================================================
function ElementWrapper({
  element,
  isSelected,
  isPreview,
  onClick,
  children,
}: {
  element: EditorElement;
  isSelected: boolean;
  isPreview: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (isPreview) return <>{children}</>;
  return (
    <div
      className={`relative group/el cursor-pointer transition-all ${isSelected ? 'ring-2 ring-purple-500 ring-offset-1 rounded' : ''}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {!isSelected && (
        <div className="absolute inset-0 border border-transparent group-hover/el:border-purple-400/50 rounded pointer-events-none transition-colors z-10" />
      )}
      {children}
    </div>
  );
}

// ============================================================
// ELEMENT PREVIEW (renders a single element)
// ============================================================
function ElementPreview({
  element,
  isSelected,
  isPreview,
  onClick,
  sectionId,
  store,
}: {
  element: EditorElement;
  isSelected: boolean;
  isPreview: boolean;
  onClick: () => void;
  sectionId: string;
  store: ReturnType<typeof useEditorStore>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setEditValue(element.content); }, [element.content]);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    store.recordSnapshot('Edit text');
    store.updateElementContent(sectionId, element.id, editValue);
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPreview) return;
    e.stopPropagation();
    if (['text', 'heading', 'button'].includes(element.type)) setIsEditing(true);
  };

  const style: React.CSSProperties = {
    fontSize: element.props.fontSize,
    fontWeight: element.props.fontWeight,
    textAlign: element.props.textAlign,
    color: element.props.color,
    lineHeight: element.props.lineHeight,
    letterSpacing: element.props.letterSpacing,
    maxWidth: element.props.maxWidth,
    margin: element.props.margin,
    padding: element.props.padding,
  };
  if (element.props.maxWidth && element.props.textAlign === 'center') {
    style.marginLeft = 'auto';
    style.marginRight = 'auto';
  }

  const renderEl = () => {
    switch (element.type) {
      case 'heading':
        return isEditing ? (
          <input ref={inputRef as React.RefObject<HTMLInputElement>} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} className="w-full bg-transparent outline-none ring-2 ring-purple-500 rounded px-2 py-1" style={style} />
        ) : (
          <h2 style={style} className="whitespace-pre-line">{element.content}</h2>
        );
      case 'text':
        return isEditing ? (
          <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} className="w-full bg-transparent outline-none ring-2 ring-purple-500 rounded px-2 py-1 resize-none" style={style} rows={3} />
        ) : (
          <p style={style} className="whitespace-pre-line leading-relaxed">{element.content}</p>
        );
      case 'image':
        return (
          <div className="relative overflow-hidden group/img" style={{ aspectRatio: element.props.aspectRatio || 'auto', borderRadius: element.props.borderRadius || '0' }}>
            <img src={element.content} alt={element.props.alt || ''} className={`w-full h-full ${element.props.objectFit === 'contain' ? 'object-contain' : 'object-cover'} group-hover/img:scale-105 transition-transform duration-500`} />
          </div>
        );
      case 'button': {
        const bStyle: React.CSSProperties = { borderRadius: element.props.borderRadius || '0.375rem' };
        if (element.props.variant === 'filled') { bStyle.backgroundColor = element.props.bgColor || 'var(--foreground)'; bStyle.color = element.props.textColor || '#ffffff'; }
        else if (element.props.variant === 'outline') { bStyle.border = '2px solid currentColor'; }
        return isEditing ? (
          <input ref={inputRef as React.RefObject<HTMLInputElement>} value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} className="bg-transparent outline-none ring-2 ring-purple-500 rounded px-4 py-2" style={{ ...style, ...bStyle }} />
        ) : (
          <span className={`inline-block px-8 py-3 font-medium mt-4 ${element.props.textAlign === 'center' ? 'mx-auto block w-fit' : ''} hover:opacity-80 transition-opacity`} style={bStyle}>{element.content}</span>
        );
      }
      case 'embed':
        return (
          <div style={{ aspectRatio: element.props.aspectRatio || '16/9' }} className="overflow-hidden">
            <iframe src={element.content} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
          </div>
        );
      case 'spacer':
        return <div style={{ height: element.props.height || '32px' }} />;
      case 'divider':
        return <hr className="border-foreground/10 my-4" />;
      default:
        return <div className="p-4 bg-gray-100 rounded text-sm text-gray-500">Elemento: {element.type}</div>;
    }
  };

  return (
    <ElementWrapper element={element} isSelected={isSelected} isPreview={isPreview} onClick={onClick}>
      <div onDoubleClick={handleDoubleClick} className="mb-2">{renderEl()}</div>
    </ElementWrapper>
  );
}

// ============================================================
// SECTION PREVIEW (visual preview of a section)
// ============================================================
function SectionPreview({
  section, isSelected, isPreview, onSelect, onSelectElement, selectedElementId, store,
}: {
  section: EditorSection; isSelected: boolean; isPreview: boolean;
  onSelect: () => void; onSelectElement: (id: string) => void;
  selectedElementId: string | null; store: ReturnType<typeof useEditorStore>;
}) {
  if (!section.visible && !isPreview) {
    return (
      <div className="opacity-30 border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 rounded-lg mx-4 my-2">
        <EyeOff className="w-4 h-4 inline mr-2" />{section.label} (oculto)
      </div>
    );
  }
  if (!section.visible) return null;

  const bgStyle: React.CSSProperties = {};
  if (section.background.type === 'color' && section.background.value !== 'transparent') bgStyle.backgroundColor = section.background.value;
  else if (section.background.type === 'gradient') bgStyle.background = section.background.value;

  const mwCls = section.maxWidth === 'full' ? '' : section.maxWidth === '7xl' ? 'max-w-7xl mx-auto' : section.maxWidth === '6xl' ? 'max-w-6xl mx-auto' : section.maxWidth === '4xl' ? 'max-w-4xl mx-auto' : section.maxWidth === '3xl' ? 'max-w-3xl mx-auto' : 'max-w-6xl mx-auto';
  const padStyle = { paddingTop: `${section.padding.top}px`, paddingBottom: `${section.padding.bottom}px` };

  const elProps = (el: EditorElement) => ({
    key: el.id, element: el, isSelected: selectedElementId === el.id, isPreview,
    onClick: () => onSelectElement(el.id), sectionId: section.id, store,
  });

  // ---- Section Type Renderers ----
  const renderContent = () => {
    // Hero slideshow
    if (section.type === 'hero-slideshow' && section.data?.slides) {
      const slides = section.data.slides as Array<{ id: string; image: string; title: string; subtitle: string; ctaText: string; ctaLink: string }>;
      const cur = slides[0];
      if (!cur) return null;
      return (
        <div className="px-4 lg:px-8 pb-4">
          <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl">
            <div className="relative aspect-[9/16] sm:aspect-[4/5] md:aspect-[16/10] lg:aspect-[21/9]">
              <img src={cur.image} alt={cur.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center px-6 max-w-4xl mx-auto">
                  <h1 className="text-5xl sm:text-6xl lg:text-8xl font-medium text-white mb-8 tracking-tight">{cur.title}</h1>
                  <div className="inline-block px-12 py-4 bg-white text-black rounded-full font-medium text-lg shadow-xl">{cur.ctaText}</div>
                  <p className="text-base lg:text-lg text-white/60 mt-8 tracking-widest uppercase">{cur.subtitle}</p>
                </div>
              </div>
              {slides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                  {slides.map((_, i) => <span key={i} className={`block w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />)}
                </div>
              )}
            </div>
          </div>
          {!isPreview && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {slides.map((s, idx) => (
                <div key={s.id} className="relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 border-white/50 cursor-pointer group">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Slide {idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Banner full with background image
    if (section.type === 'banner-full' && section.background.type === 'image') {
      return (
        <div className="relative">
          <div className="relative aspect-[9/12] lg:aspect-[21/9]">
            <img src={section.background.value} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            {section.background.overlay && <div className="absolute inset-0" style={{ backgroundColor: section.background.overlay }} />}
            {section.elements.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">{section.elements.map(el => <ElementPreview {...elProps(el)} />)}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Map embed
    if (section.type === 'map-embed') {
      const embedEl = section.elements.find(e => e.type === 'embed');
      if (embedEl) return (
        <div className="aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
          <iframe src={embedEl.content} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      );
    }

    // Contact form
    if (section.type === 'contact-form') {
      const labels = (section.data?.labels || {}) as Record<string, string>;
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          {section.elements.filter(e => e.type !== 'form').map(el => <ElementPreview {...elProps(el)} />)}
          <div className="grid lg:grid-cols-2 gap-12 mt-8">
            <div className="space-y-6">
              {['nombre', 'email', 'asunto'].map(f => (
                <div key={f}><label className="block text-sm font-medium mb-2">{labels[f] || f}</label><input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white" readOnly /></div>
              ))}
              <div><label className="block text-sm font-medium mb-2">{labels.mensaje || 'Mensaje'}</label><textarea className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white resize-none" rows={6} readOnly /></div>
              <button className="w-full py-3 bg-foreground text-white rounded-md font-medium">{(section.data?.submitText as string) || 'Enviar'}</button>
            </div>
            <div><h2 className="text-xl font-medium mb-6">Otras Formas de Contacto</h2><p className="text-foreground/70">Información de contacto de la configuración del sitio.</p></div>
          </div>
        </div>
      );
    }

    // Events list
    if (section.type === 'events-list' && section.data?.events) {
      const evts = section.data.events as Array<{ id: string; image: string; title: string; date: string; location: string; description: string }>;
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          {section.elements.map(el => <ElementPreview {...elProps(el)} />)}
          <div className="space-y-6 mt-6">
            {evts.map(evt => (
              <div key={evt.id} className="grid lg:grid-cols-[300px_1fr] gap-6 p-6 border border-gray-200 rounded-lg">
                <div className="aspect-square rounded-lg relative overflow-hidden"><img src={evt.image} alt={evt.title} className="w-full h-full object-cover" /></div>
                <div>
                  <div className="text-sm text-foreground/70 mb-1">{evt.date} · {evt.location}</div>
                  <h3 className="text-xl font-medium mb-2">{evt.title}</h3>
                  <p className="text-foreground/70 mb-4">{evt.description}</p>
                  <button className="px-6 py-2 border border-foreground rounded-md hover:bg-foreground hover:text-white transition-colors">Más Información</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Events grid
    if (section.type === 'events-grid' && section.data?.events) {
      const evts = section.data.events as Array<{ id: string; image: string; title: string; date: string; location: string }>;
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          {section.elements.map(el => <ElementPreview {...elProps(el)} />)}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {evts.map(evt => (
              <div key={evt.id}>
                <div className="aspect-[4/3] rounded-lg mb-3 relative overflow-hidden"><img src={evt.image} alt={evt.title} className="w-full h-full object-cover" /></div>
                <h3 className="font-medium mb-1">{evt.title}</h3>
                <p className="text-sm text-foreground/70">{evt.date} · {evt.location}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Product-featured cards grid (index page specific)
    if (section.type === 'cards-grid' && section.data?.layout === 'product-featured') {
      const perCard = 5;
      const cards: EditorElement[][] = [];
      for (let i = 0; i < section.elements.length; i += perCard) cards.push(section.elements.slice(i, i + perCard));
      if (cards.length === 0) return null;
      const first = cards[0], rest = cards.slice(1);
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            {first && (
              <div className="group cursor-pointer">
                <div className="aspect-[3/4] rounded-lg mb-4 relative overflow-hidden">
                  <img src={first[0]?.content || ''} alt={first[1]?.content || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 z-10">
                    <h3 className="text-2xl font-medium text-white mb-2">{first[1]?.content || ''}</h3>
                    {first[2]?.content && <p className="text-sm text-white/90">{first[2]?.content}</p>}
                  </div>
                </div>
                <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">{first[3]?.content || ''}</p>
              </div>
            )}
            <div className="grid grid-rows-2 gap-4 lg:gap-6">
              {rest.map((card, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="aspect-[16/9] lg:aspect-[21/9] rounded-lg mb-3 relative overflow-hidden">
                    <img src={card[0]?.content || ''} alt={card[1]?.content || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 z-10"><h3 className="text-xl font-medium text-white">{card[1]?.content || ''}</h3></div>
                  </div>
                  <p className="text-base lg:text-lg text-foreground/50 text-center px-4 leading-relaxed">{card[3]?.content || ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Generic cards / content grid
    if (section.type === 'cards-grid' || section.type === 'content-grid') {
      const cols = (section.data?.columns as number) || 3;
      const perCard = section.type === 'content-grid' ? 4 : 3;
      const cards: EditorElement[][] = [];
      for (let i = 0; i < section.elements.length; i += perCard) cards.push(section.elements.slice(i, i + perCard));
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          <div className="grid gap-8 lg:gap-12" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {cards.map((card, idx) => (
              <div key={idx} className="text-center">{card.map(el => <ElementPreview {...elProps(el)} />)}</div>
            ))}
          </div>
        </div>
      );
    }

    // Gallery grid
    if (section.type === 'gallery-grid') {
      const cols = (section.data?.columns as number) || 4;
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {section.elements.map(el => <ElementPreview {...elProps(el)} />)}
          </div>
        </div>
      );
    }

    // Text-Image / Image-Text / Hero-Split
    if (section.type === 'text-image' || section.type === 'image-text' || section.type === 'hero-split') {
      const imgEls = section.elements.filter(e => e.type === 'image');
      const txtEls = section.elements.filter(e => e.type !== 'image');
      const imgFirst = section.type === 'image-text' || section.type === 'hero-split';
      return (
        <div className={`px-4 ${mwCls}`} style={padStyle}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={imgFirst ? 'order-1' : 'order-2 lg:order-1'}>{(imgFirst ? imgEls : txtEls).map(el => <ElementPreview {...elProps(el)} />)}</div>
            <div className={imgFirst ? 'order-2' : 'order-1 lg:order-2'}>{(imgFirst ? txtEls : imgEls).map(el => <ElementPreview {...elProps(el)} />)}</div>
          </div>
        </div>
      );
    }

    // Spacer / Divider
    if (section.type === 'spacer') return <div style={padStyle} />;
    if (section.type === 'divider') return <div className={`px-4 ${mwCls}`} style={padStyle}><hr className="border-foreground/10" /></div>;

    // Default generic
    return (
      <div className={`px-4 ${mwCls}`} style={padStyle}>
        {section.elements.map(el => <ElementPreview {...elProps(el)} />)}
      </div>
    );
  };

  return (
    <div
      className={`relative group transition-all ${isSelected && !isPreview ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${!isPreview ? 'cursor-pointer' : ''}`}
      style={bgStyle}
      onClick={(e) => { if (!isPreview) { e.stopPropagation(); onSelect(); } }}
    >
      {/* Hover overlay */}
      {!isPreview && !isSelected && (
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 z-30 pointer-events-none transition-colors rounded" />
      )}

      {/* Section toolbar floating above */}
      {isSelected && !isPreview && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-blue-600 text-white rounded-lg px-2 py-1 shadow-lg text-xs">
          <span className="font-medium mr-2 max-w-[120px] truncate">{section.label}</span>
          <button onClick={(e) => { e.stopPropagation(); store.moveSection(section.id, 'up'); }} className="p-1 hover:bg-blue-700 rounded" title="Mover arriba"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); store.moveSection(section.id, 'down'); }} className="p-1 hover:bg-blue-700 rounded" title="Mover abajo"><ChevronDown className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-blue-400 mx-1" />
          <button onClick={(e) => { e.stopPropagation(); store.duplicateSection(section.id); }} className="p-1 hover:bg-blue-700 rounded" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); store.updateSection(section.id, { visible: !section.visible }); }} className="p-1 hover:bg-blue-700 rounded" title="Visible">
            {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); store.updateSection(section.id, { locked: !section.locked }); }} className="p-1 hover:bg-blue-700 rounded" title="Bloquear">
            {section.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <div className="w-px h-4 bg-blue-400 mx-1" />
          <button onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar esta sección?')) store.removeSection(section.id); }} className="p-1 hover:bg-red-600 rounded" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {renderContent()}

      {/* Add section between */}
      {!isPreview && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); store.toggleSectionLibrary(); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs shadow-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-3 h-3" />Sección
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROPERTIES PANEL (right sidebar)
// ============================================================
function PropertiesPanel({ store }: { store: ReturnType<typeof useEditorStore> }) {
  const { state, activePage } = store;
  const selectedSection = activePage?.sections.find(s => s.id === state.selectedSectionId);
  const selectedElement = selectedSection?.elements.find(e => e.id === state.selectedElementId);
  const [activeTab, setActiveTab] = useState<'section' | 'element' | 'animation'>('section');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  if (!selectedSection && !selectedElement) {
    return (
      <div className="p-6 text-center text-foreground/50">
        <MousePointer className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Selecciona una sección o elemento para editar sus propiedades</p>
      </div>
    );
  }

  // ---- Section Properties ----
  const renderSectionProps = () => {
    if (!selectedSection) return null;
    return (
      <div className="space-y-4 p-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground/60">Nombre</label>
          <input type="text" value={selectedSection.label} onChange={(e) => store.updateSection(selectedSection.id, { label: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        {/* Background */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground/60">Fondo</label>
          <div className="flex items-center gap-2">
            <select value={selectedSection.background.type} onChange={(e) => store.updateSection(selectedSection.id, { background: { ...selectedSection.background, type: e.target.value as 'color' | 'gradient' | 'image' } })} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
              <option value="color">Color</option>
              <option value="gradient">Gradiente</option>
              <option value="image">Imagen</option>
            </select>
            {selectedSection.background.type === 'color' && (
              <div className="relative">
                <button onClick={() => setShowColorPicker(showColorPicker === 'bg' ? null : 'bg')} className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer" style={{ backgroundColor: selectedSection.background.value || '#ffffff' }} />
                {showColorPicker === 'bg' && (
                  <div className="absolute top-10 right-0 z-50 bg-white rounded-lg shadow-xl p-3 border">
                    <HexColorPicker color={selectedSection.background.value} onChange={(c) => store.updateSection(selectedSection.id, { background: { ...selectedSection.background, value: c } })} />
                    <input type="text" value={selectedSection.background.value} onChange={(e) => store.updateSection(selectedSection.id, { background: { ...selectedSection.background, value: e.target.value } })} className="w-full mt-2 px-2 py-1 text-xs border border-gray-200 rounded" />
                  </div>
                )}
              </div>
            )}
            {(selectedSection.background.type === 'image' || selectedSection.background.type === 'gradient') && (
              <input type="text" value={selectedSection.background.value} onChange={(e) => store.updateSection(selectedSection.id, { background: { ...selectedSection.background, value: e.target.value } })} placeholder={selectedSection.background.type === 'image' ? 'URL de imagen' : 'linear-gradient(...)'} className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5" />
            )}
          </div>
          {selectedSection.background.type === 'image' && (
            <div className="mt-2">
              <label className="block text-xs text-foreground/50 mb-1">Overlay</label>
              <input type="text" value={selectedSection.background.overlay || ''} onChange={(e) => store.updateSection(selectedSection.id, { background: { ...selectedSection.background, overlay: e.target.value } })} placeholder="rgba(0,0,0,0.3)" className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5" />
            </div>
          )}
        </div>

        {/* Padding */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground/60">Padding</label>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-xs text-foreground/40">Top</span><input type="number" value={selectedSection.padding.top} onChange={(e) => store.updateSection(selectedSection.id, { padding: { ...selectedSection.padding, top: parseInt(e.target.value) || 0 } })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5" /></div>
            <div><span className="text-xs text-foreground/40">Bottom</span><input type="number" value={selectedSection.padding.bottom} onChange={(e) => store.updateSection(selectedSection.id, { padding: { ...selectedSection.padding, bottom: parseInt(e.target.value) || 0 } })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5" /></div>
          </div>
        </div>

        {/* Max Width */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground/60">Ancho Máximo</label>
          <select value={selectedSection.maxWidth || 'full'} onChange={(e) => store.updateSection(selectedSection.id, { maxWidth: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="full">Full Width</option><option value="7xl">7xl (1280px)</option><option value="6xl">6xl (1152px)</option><option value="4xl">4xl (896px)</option><option value="3xl">3xl (768px)</option>
          </select>
        </div>

        {/* Hero Slideshow management */}
        {selectedSection.type === 'hero-slideshow' && !!selectedSection.data?.slides && (
          <SlideshowEditor section={selectedSection} store={store} />
        )}

        {/* Add Element */}
        <div className="border-t pt-4 mt-4">
          <label className="block text-xs font-medium mb-2 text-foreground/60">Agregar Elemento</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { type: 'heading' as const, label: 'Título', icon: <Type className="w-3.5 h-3.5" /> },
              { type: 'text' as const, label: 'Texto', icon: <AlignLeft className="w-3.5 h-3.5" /> },
              { type: 'image' as const, label: 'Imagen', icon: <ImageIcon className="w-3.5 h-3.5" /> },
              { type: 'button' as const, label: 'Botón', icon: <Square className="w-3.5 h-3.5" /> },
              { type: 'spacer' as const, label: 'Espacio', icon: <Move className="w-3.5 h-3.5" /> },
              { type: 'divider' as const, label: 'Línea', icon: <GripVertical className="w-3.5 h-3.5" /> },
            ]).map(item => (
              <button key={item.type} onClick={() => {
                const newEl: Omit<EditorElement, 'id'> = {
                  type: item.type,
                  content: item.type === 'heading' ? 'Nuevo título' : item.type === 'text' ? 'Nuevo texto' : item.type === 'button' ? 'Botón' : item.type === 'image' ? '/images/placeholder.png' : '',
                  props: item.type === 'heading' ? { fontSize: '1.5rem', fontWeight: '500' } : item.type === 'button' ? { variant: 'outline', borderRadius: '999px' } : item.type === 'image' ? { aspectRatio: '16/9', objectFit: 'cover', borderRadius: '0.5rem' } : {},
                  animation: { type: 'fadeInUp', trigger: 'onScroll', duration: 0.6, delay: 0, easing: 'easeInOut' },
                };
                store.addElement(selectedSection.id, newEl);
              }} className="flex flex-col items-center gap-1 p-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ---- Element Properties ----
  const renderElementProps = () => {
    if (!selectedElement || !selectedSection) return null;
    return (
      <div className="space-y-4 p-4">
        {/* Content */}
        <div>
          <label className="block text-xs font-medium mb-1 text-foreground/60">Contenido</label>
          {selectedElement.type === 'text' ? (
            <textarea value={selectedElement.content} onChange={(e) => store.updateElementContent(selectedSection.id, selectedElement.id, e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none" rows={4} />
          ) : (
            <input type="text" value={selectedElement.content} onChange={(e) => store.updateElementContent(selectedSection.id, selectedElement.id, e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder={selectedElement.type === 'image' ? 'URL de imagen' : 'Contenido'} />
          )}
        </div>

        {/* Image preview */}
        {selectedElement.type === 'image' && selectedElement.content && (
          <div className="rounded-lg overflow-hidden border border-gray-200"><img src={selectedElement.content} alt="Preview" className="w-full h-32 object-cover" /></div>
        )}

        {/* Typography */}
        {(selectedElement.type === 'heading' || selectedElement.type === 'text') && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Tamaño</label>
              <select value={selectedElement.props.fontSize || '1rem'} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { fontSize: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="0.875rem">Small</option><option value="1rem">Normal</option><option value="1.15rem">Medium</option><option value="1.25rem">Large</option><option value="1.5rem">XL</option><option value="2rem">2XL</option><option value="2.5rem">3XL</option><option value="3rem">4XL</option><option value="3.5rem">5XL</option><option value="4rem">6XL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Peso</label>
              <select value={selectedElement.props.fontWeight || '400'} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { fontWeight: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="300">Light</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Alineación</label>
              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map(a => (
                  <button key={a} onClick={() => store.updateElementProps(selectedSection.id, selectedElement.id, { textAlign: a })} className={`flex-1 py-1.5 rounded-lg text-sm border ${selectedElement.props.textAlign === a ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {a === 'left' ? <AlignLeft className="w-4 h-4 mx-auto" /> : a === 'center' ? <AlignCenter className="w-4 h-4 mx-auto" /> : <AlignRight className="w-4 h-4 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Color</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')} className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: selectedElement.props.color || '#545454' }} />
                <input type="text" value={selectedElement.props.color || ''} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { color: e.target.value })} className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5" placeholder="Color" />
              </div>
              {showColorPicker === 'text' && (
                <div className="mt-2 bg-white rounded-lg shadow-xl p-3 border">
                  <HexColorPicker color={selectedElement.props.color || '#545454'} onChange={(c) => store.updateElementProps(selectedSection.id, selectedElement.id, { color: c })} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Image props */}
        {selectedElement.type === 'image' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Aspect Ratio</label>
              <select value={selectedElement.props.aspectRatio || '16/9'} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { aspectRatio: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="1/1">1:1</option><option value="4/3">4:3</option><option value="3/4">3:4</option><option value="16/9">16:9</option><option value="9/16">9:16</option><option value="21/9">21:9</option><option value="4/5">4:5</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Ajuste</label>
              <select value={selectedElement.props.objectFit || 'cover'} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { objectFit: e.target.value as 'cover' | 'contain' | 'fill' })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Border Radius</label>
              <select value={selectedElement.props.borderRadius || '0'} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { borderRadius: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="0">Ninguno</option><option value="0.375rem">Pequeño</option><option value="0.5rem">Medio</option><option value="1rem">Grande</option><option value="999px">Circular</option>
              </select>
            </div>
          </>
        )}

        {/* Button props */}
        {selectedElement.type === 'button' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Link</label>
              <input type="text" value={selectedElement.props.href || ''} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { href: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="/ruta o https://..." />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Variante</label>
              <div className="flex gap-1">
                {(['filled', 'outline', 'ghost'] as const).map(v => (
                  <button key={v} onClick={() => store.updateElementProps(selectedSection.id, selectedElement.id, { variant: v })} className={`flex-1 py-1.5 text-xs rounded-lg border ${selectedElement.props.variant === v ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {v === 'filled' ? 'Relleno' : v === 'outline' ? 'Borde' : 'Ghost'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Border Radius</label>
              <select value={selectedElement.props.borderRadius || '0.375rem'} onChange={(e) => store.updateElementProps(selectedSection.id, selectedElement.id, { borderRadius: e.target.value })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="0">Sin bordes</option><option value="0.375rem">Pequeño</option><option value="0.5rem">Medio</option><option value="999px">Pill</option>
              </select>
            </div>
          </>
        )}

        {/* Delete element */}
        <button onClick={() => { if (confirm('¿Eliminar este elemento?')) store.removeElement(selectedSection.id, selectedElement.id); }} className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <Trash2 className="w-3.5 h-3.5" /> Eliminar Elemento
        </button>
      </div>
    );
  };

  // ---- Animation Properties ----
  const renderAnimationProps = () => {
    const target = selectedElement || selectedSection;
    if (!target) return null;
    const animation = 'animation' in target ? target.animation : null;
    if (!animation) return null;
    const isEl = !!selectedElement;
    const secId = selectedSection?.id || '';

    const updateAnim = (u: Partial<AnimationConfig>) => {
      if (isEl && selectedElement) store.updateElementAnimation(secId, selectedElement.id, u);
      else if (selectedSection) store.updateSection(selectedSection.id, { animation: { ...animation, ...u } });
    };

    return (
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-xs font-medium mb-2 text-foreground/60">Tipo de Animación</label>
          <div className="grid grid-cols-3 gap-1.5 max-h-[250px] overflow-y-auto pr-1">
            {ANIMATION_TYPES.map(a => (
              <button key={a.value} onClick={() => updateAnim({ type: a.value })} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg text-[10px] border transition-colors ${animation.type === a.value ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-100 hover:bg-gray-50'}`}>
                <span className="text-base">{a.icon}</span><span className="truncate w-full text-center">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
        {animation.type !== 'none' && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Duración: {animation.duration}s</label>
              <input type="range" min="0.1" max="3" step="0.1" value={animation.duration} onChange={(e) => updateAnim({ duration: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Delay: {animation.delay}s</label>
              <input type="range" min="0" max="2" step="0.05" value={animation.delay} onChange={(e) => updateAnim({ delay: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Easing</label>
              <select value={animation.easing} onChange={(e) => updateAnim({ easing: e.target.value as EasingType })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                {EASING_TYPES.map(ea => <option key={ea.value} value={ea.value}>{ea.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-foreground/60">Trigger</label>
              <select value={animation.trigger} onChange={(e) => updateAnim({ trigger: e.target.value as 'onLoad' | 'onScroll' | 'onHover' })} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                <option value="onLoad">Al cargar</option><option value="onScroll">Al hacer scroll</option><option value="onHover">Al pasar el mouse</option>
              </select>
            </div>
            <button onClick={() => { const orig = animation.type; updateAnim({ type: 'none' }); setTimeout(() => updateAnim({ type: orig }), 50); }} className="w-full py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Play className="w-3.5 h-3.5" /> Preview Animación
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex border-b sticky top-0 bg-white z-10">
        {selectedSection && (
          <button onClick={() => setActiveTab('section')} className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'section' ? 'border-blue-500 text-blue-700' : 'border-transparent text-foreground/50 hover:text-foreground/80'}`}>
            <Layers className="w-3.5 h-3.5 mx-auto mb-0.5" />Sección
          </button>
        )}
        {selectedElement && (
          <button onClick={() => setActiveTab('element')} className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'element' ? 'border-blue-500 text-blue-700' : 'border-transparent text-foreground/50 hover:text-foreground/80'}`}>
            <Settings2 className="w-3.5 h-3.5 mx-auto mb-0.5" />Elemento
          </button>
        )}
        <button onClick={() => setActiveTab('animation')} className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'animation' ? 'border-blue-500 text-blue-700' : 'border-transparent text-foreground/50 hover:text-foreground/80'}`}>
          <Sparkles className="w-3.5 h-3.5 mx-auto mb-0.5" />Animación
        </button>
      </div>
      {activeTab === 'section' && renderSectionProps()}
      {activeTab === 'element' && renderElementProps()}
      {activeTab === 'animation' && renderAnimationProps()}
    </div>
  );
}

// ============================================================
// SLIDESHOW EDITOR (embedded in properties panel)
// ============================================================
function SlideshowEditor({ section, store }: { section: EditorSection; store: ReturnType<typeof useEditorStore> }) {
  type Slide = { id: string; image: string; title: string; subtitle: string; ctaText: string; ctaLink: string };
  const slides = section.data!.slides as Slide[];

  const updateSlide = (idx: number, updates: Partial<Slide>) => {
    const newSlides = slides.map((s, i) => i === idx ? { ...s, ...updates } : s);
    store.updateSectionData(section.id, { slides: newSlides });
  };

  return (
    <div className="border-t pt-4 mt-4">
      <label className="block text-xs font-medium mb-2 text-foreground/60">Slides del Carrusel</label>
      {slides.map((slide, idx) => (
        <div key={slide.id} className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Slide {idx + 1}</span>
            <button onClick={() => { const ns = slides.filter((_, i) => i !== idx); store.updateSectionData(section.id, { slides: ns }); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <input type="text" value={slide.image} onChange={(e) => updateSlide(idx, { image: e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" placeholder="URL de imagen" />
          <input type="text" value={slide.title} onChange={(e) => updateSlide(idx, { title: e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" placeholder="Título" />
          <div className="grid grid-cols-2 gap-1">
            <input type="text" value={slide.subtitle} onChange={(e) => updateSlide(idx, { subtitle: e.target.value })} className="text-xs border border-gray-200 rounded px-2 py-1" placeholder="Subtítulo" />
            <input type="text" value={slide.ctaText} onChange={(e) => updateSlide(idx, { ctaText: e.target.value })} className="text-xs border border-gray-200 rounded px-2 py-1" placeholder="CTA" />
          </div>
          <input type="text" value={slide.ctaLink} onChange={(e) => updateSlide(idx, { ctaLink: e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1" placeholder="Link" />
        </div>
      ))}
      <button onClick={() => store.updateSectionData(section.id, { slides: [...slides, { id: generateId(), image: '/images/placeholder.png', title: 'Nuevo Slide', subtitle: 'Subtítulo', ctaText: 'Ver', ctaLink: '/colecciones' }] })} className="w-full text-xs border border-dashed border-gray-300 rounded-lg py-2 hover:bg-gray-50 flex items-center justify-center gap-1">
        <Plus className="w-3 h-3" /> Agregar Slide
      </button>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/50">Autoplay</span>
          <button onClick={() => store.updateSectionData(section.id, { autoplay: !section.data!.autoplay })} className={`px-2 py-0.5 text-xs rounded ${section.data!.autoplay ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {section.data!.autoplay ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/50">Intervalo (seg)</span>
          <input type="number" value={(section.data!.interval as number) || 5} onChange={(e) => store.updateSectionData(section.id, { interval: parseInt(e.target.value) || 5 })} className="w-16 text-xs border border-gray-200 rounded px-2 py-1 text-right" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/50">Transición</span>
          <select value={(section.data!.transition as string) || 'slide'} onChange={(e) => store.updateSectionData(section.id, { transition: e.target.value })} className="text-xs border border-gray-200 rounded px-2 py-1">
            <option value="slide">Slide</option><option value="fade">Fade</option><option value="zoom">Zoom</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION LIBRARY DRAWER (left side)
// ============================================================
function SectionLibrary({ store, onClose }: { store: ReturnType<typeof useEditorStore>; onClose: () => void }) {
  const [activeCat, setActiveCat] = useState('hero');
  const categories = getAllCategories();

  return (
    <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="absolute left-0 top-0 bottom-0 w-[300px] bg-white border-r border-gray-200 z-40 flex flex-col shadow-xl">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium text-sm">Biblioteca de Secciones</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex overflow-x-auto border-b px-2 py-2 gap-1">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${activeCat === cat.id ? 'bg-blue-100 text-blue-700' : 'text-foreground/50 hover:bg-gray-100'}`}>{cat.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sectionTemplates.filter(t => t.category === activeCat).map(template => (
          <button key={template.type} onClick={() => { store.addSection(template.defaultSection); onClose(); }} className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors group">
            <div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium group-hover:text-blue-700 transition-colors">{template.label}</span></div>
            <p className="text-xs text-foreground/50">{template.description}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN EDITOR PAGE
// ============================================================
export default function AdminContenidosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { content: indexContent, refreshContent: refreshIndex } = useIndexContent();
  const { nosotros, produccion, eventos, ubicaciones, contacto, refreshContent: refreshPages } = usePagesContent();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);

  const initialPages = convertAllPages(indexContent, nosotros, produccion, eventos, ubicaciones, contacto);
  const store = useEditorStore(initialPages);

  useEffect(() => {
    if (!authLoading) {
      const pages = convertAllPages(indexContent, nosotros, produccion, eventos, ubicaciones, contacto);
      store.setPages(pages);
      setIsLoaded(true);
    }
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); }
        if (e.key === 'y') { e.preventDefault(); store.redo(); }
        if (e.key === 's') { e.preventDefault(); handleSave(); }
        if (e.key === 'd') { e.preventDefault(); if (store.state.selectedSectionId) store.duplicateSection(store.state.selectedSectionId); }
      }
      if (e.key === 'Escape') { store.selectSection(null); store.selectElement(null); }
      if (e.key === 'Delete' && store.state.selectedSectionId && !store.state.selectedElementId) {
        if (confirm('¿Eliminar sección?')) store.removeSection(store.state.selectedSectionId);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [store]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- SAVE ----
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage('');
    const supabase = getSupabaseClient();

    try {
      const pages = store.state.pages;
      const updates: { clave: string; valor: string }[] = [];

      // Save editor sections (raw visual builder data)
      for (const [pageId, pageConfig] of Object.entries(pages)) {
        const clave = `contenido_editor_${pageId}`;
        updates.push({ clave, valor: JSON.stringify(pageConfig) });
      }

      // Convert back to original content format for public pages
      // ---- Index ----
      const idxP = pages['index'];
      if (idxP) {
        const heroSec = idxP.sections.find(s => s.type === 'hero-slideshow');
        const productSec = idxP.sections.find(s => s.type === 'cards-grid' && s.data?.layout === 'product-featured');
        const philSec = idxP.sections.find(s => s.label === 'Filosofía');
        const lifeSec = idxP.sections.find(s => s.type === 'gallery-grid');
        const bannerSec = idxP.sections.find(s => s.type === 'banner-full');
        const gridSec = idxP.sections.find(s => s.type === 'content-grid');

        let productCards = indexContent.productCardsSection1;
        if (productSec) {
          const perCard = 5; const cards: typeof productCards = [];
          for (let i = 0; i < productSec.elements.length; i += perCard) {
            const g = productSec.elements.slice(i, i + perCard);
            cards.push({ id: g[0]?.id || generateId(), image: g[0]?.content || '', title: g[1]?.content || '', subtitle: g[2]?.content || '', description: g[3]?.content || '', link: g[4]?.props.href || '/colecciones', size: i === 0 ? 'large' : 'medium' });
          }
          if (cards.length > 0) productCards = cards;
        }

        updates.push({
          clave: 'contenido_index',
          valor: JSON.stringify({
            heroSlides: heroSec?.data?.slides || indexContent.heroSlides,
            productCardsSection1: productCards,
            philosophySection: philSec ? {
              title: philSec.elements.find(e => e.type === 'heading')?.content || indexContent.philosophySection.title,
              description: philSec.elements.find(e => e.type === 'text')?.content || indexContent.philosophySection.description,
              ctaText: philSec.elements.find(e => e.type === 'button')?.content || indexContent.philosophySection.ctaText,
              ctaLink: philSec.elements.find(e => e.type === 'button')?.props.href || indexContent.philosophySection.ctaLink,
            } : indexContent.philosophySection,
            lifestyleImages: lifeSec ? lifeSec.elements.filter(e => e.type === 'image').map(e => ({ id: e.id, image: e.content, label: e.props.alt || '' })) : indexContent.lifestyleImages,
            fullWidthBanner: bannerSec ? {
              image: bannerSec.background.value || indexContent.fullWidthBanner.image,
              title: bannerSec.elements.find(e => e.type === 'heading')?.content || indexContent.fullWidthBanner.title,
              subtitle: bannerSec.elements.find(e => e.type === 'text')?.content || indexContent.fullWidthBanner.subtitle,
            } : indexContent.fullWidthBanner,
            contentGrid: gridSec ? (() => {
              const items: typeof indexContent.contentGrid = [];
              for (let i = 0; i < gridSec.elements.length; i += 4) {
                const g = gridSec.elements.slice(i, i + 4);
                items.push({ id: g[0]?.id || generateId(), image: g[0]?.content || '', title: g[1]?.content || '', description: g[2]?.content || '', link: g[3]?.props.href || '/' });
              }
              return items;
            })() : indexContent.contentGrid,
          }),
        });
      }

      // ---- Nosotros ----
      const nosP = pages['nosotros'];
      if (nosP) {
        const hero = nosP.sections.find(s => s.label === 'Hero');
        const img = nosP.sections.find(s => s.label === 'Imagen Header');
        const vis = nosP.sections.find(s => s.label === 'Visión');
        const val = nosP.sections.find(s => s.label === 'Valores');
        const cta = nosP.sections.find(s => s.label === 'CTA');

        updates.push({ clave: 'contenido_nosotros', valor: JSON.stringify({
          hero: { title: hero?.elements[0]?.content || nosotros.hero.title, description: hero?.elements[1]?.content || nosotros.hero.description },
          headerImage: img?.background.value || nosotros.headerImage,
          vision: {
            image: vis?.elements.find(e => e.type === 'image')?.content || nosotros.vision.image,
            title: vis?.elements.find(e => e.type === 'heading')?.content || nosotros.vision.title,
            paragraph1: vis?.elements.filter(e => e.type === 'text')[0]?.content || nosotros.vision.paragraph1,
            paragraph2: vis?.elements.filter(e => e.type === 'text')[1]?.content || nosotros.vision.paragraph2,
          },
          values: {
            image: val?.elements.find(e => e.type === 'image')?.content || nosotros.values.image,
            title: val?.elements.find(e => e.type === 'heading')?.content || nosotros.values.title,
            items: val?.elements.filter(e => e.type === 'text').map(e => {
              const parts = e.content.split('\n');
              return { title: (parts[0] || '').replace(/\*\*/g, ''), description: parts[1] || '' };
            }) || nosotros.values.items,
          },
          cta: {
            title: cta?.elements.find(e => e.type === 'heading')?.content || nosotros.cta.title,
            description: cta?.elements.find(e => e.type === 'text')?.content || nosotros.cta.description,
            buttonText: cta?.elements.find(e => e.type === 'button')?.content || nosotros.cta.buttonText,
            buttonLink: cta?.elements.find(e => e.type === 'button')?.props.href || nosotros.cta.buttonLink,
          }
        }) });
      }

      // ---- Producción ----
      const proP = pages['produccion'];
      if (proP) {
        const hero = proP.sections.find(s => s.label === 'Hero');
        const pilSec = proP.sections.find(s => s.type === 'cards-grid');
        const pillars: { title: string; description: string; image: string }[] = [];
        if (pilSec) {
          for (let i = 0; i < pilSec.elements.length; i += 3) {
            const g = pilSec.elements.slice(i, i + 3);
            pillars.push({ image: g[0]?.content || '', title: g[1]?.content || '', description: g[2]?.content || '' });
          }
        }
        updates.push({ clave: 'contenido_produccion', valor: JSON.stringify({
          hero: { title: hero?.elements[0]?.content || produccion.hero.title, description: hero?.elements[1]?.content || produccion.hero.description },
          pillars: pillars.length > 0 ? pillars : produccion.pillars,
        }) });
      }

      // ---- Eventos ----
      const evtP = pages['eventos'];
      if (evtP) {
        const hdr = evtP.sections.find(s => s.label === 'Encabezado');
        const up = evtP.sections.find(s => s.type === 'events-list');
        const past = evtP.sections.find(s => s.type === 'events-grid');
        updates.push({ clave: 'contenido_eventos', valor: JSON.stringify({
          title: hdr?.elements[0]?.content || eventos.title,
          subtitle: hdr?.elements[1]?.content || eventos.subtitle,
          upcomingTitle: up?.elements[0]?.content || eventos.upcomingTitle,
          upcomingEvents: up?.data?.events || eventos.upcomingEvents,
          pastTitle: past?.elements[0]?.content || eventos.pastTitle,
          pastEvents: past?.data?.events || eventos.pastEvents,
        }) });
      }

      // ---- Ubicaciones ----
      const ubP = pages['ubicaciones'];
      if (ubP) {
        const hdr = ubP.sections.find(s => s.label === 'Encabezado');
        const map = ubP.sections.find(s => s.type === 'map-embed');
        const info = ubP.sections.find(s => s.label === 'Información');
        updates.push({ clave: 'contenido_ubicaciones', valor: JSON.stringify({
          hero: { title: hdr?.elements[0]?.content || ubicaciones.hero.title, description: hdr?.elements[1]?.content || ubicaciones.hero.description },
          mapEmbedUrl: map?.elements[0]?.content || ubicaciones.mapEmbedUrl,
          location: {
            title: info?.elements.find(e => e.type === 'heading')?.content || ubicaciones.location.title,
            address: info?.elements.filter(e => e.type === 'text')[0]?.content || ubicaciones.location.address,
            note: info?.elements.filter(e => e.type === 'text')[1]?.content || ubicaciones.location.note,
            buttonText: info?.elements.find(e => e.type === 'button')?.content || ubicaciones.location.buttonText,
            buttonEmail: (info?.elements.find(e => e.type === 'button')?.props.href || '').replace('mailto:', '') || ubicaciones.location.buttonEmail,
          }
        }) });
      }

      // ---- Contacto ----
      const conP = pages['contacto'];
      if (conP) {
        const hdr = conP.sections.find(s => s.label === 'Encabezado');
        const form = conP.sections.find(s => s.type === 'contact-form');
        updates.push({ clave: 'contenido_contacto', valor: JSON.stringify({
          hero: {
            title: hdr?.elements[0]?.content || contacto.hero.title,
            subtitle1: hdr?.elements[1]?.content || contacto.hero.subtitle1,
            subtitle2: hdr?.elements[2]?.content || contacto.hero.subtitle2,
          },
          formLabels: form?.data?.labels || contacto.formLabels,
          infoSection: contacto.infoSection,
        }) });
      }

      // Batch upsert
      for (const u of updates) {
        const { error } = await supabase.from('configuracion_sitio').upsert({ clave: u.clave, valor: u.valor }, { onConflict: 'clave' });
        if (error) throw error;
      }

      await Promise.all([refreshIndex(), refreshPages()]);
      store.markSaved();
      setSaveMessage('¡Cambios guardados!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [store, indexContent, nosotros, produccion, eventos, ubicaciones, contacto, refreshIndex, refreshPages]);

  // ---- RENDER ----
  if (authLoading || !isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/60">Cargando Softworks Studio...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="h-screen flex items-center justify-center"><p className="text-red-500">Acceso denegado. Solo administradores.</p></div>;
  }

  const { state } = store;
  const deviceWidths: Record<DevicePreview, number> = { desktop: 1440, tablet: 768, mobile: 375 };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden" style={{ paddingTop: 0, marginTop: 0 }}>
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0 z-50">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Volver"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold tracking-wide">STUDIO</span>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-1">
            {Object.entries(state.pages).map(([id, page]) => (
              <button key={id} onClick={() => store.setActivePage(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.activePage === id ? 'bg-foreground text-white' : 'text-foreground/60 hover:bg-gray-100'}`}>
                {PAGE_ICONS[id]}<span className="hidden lg:inline">{page.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center gap-2">
          <button onClick={store.undo} disabled={!store.canUndo} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors" title="Deshacer (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
          <button onClick={store.redo} disabled={!store.canRedo} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors" title="Rehacer (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          {(['desktop', 'tablet', 'mobile'] as const).map(d => (
            <button key={d} onClick={() => store.setDevicePreview(d)} className={`p-1.5 rounded-lg transition-colors ${state.devicePreview === d ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} title={d}>
              {d === 'desktop' ? <Monitor className="w-4 h-4" /> : d === 'tablet' ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          ))}
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={() => store.setZoom(state.zoom - 10)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs text-foreground/50 w-10 text-center">{state.zoom}%</span>
          <button onClick={() => store.setZoom(state.zoom + 10)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button onClick={store.togglePreviewMode} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${state.isPreviewMode ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}>
            {state.isPreviewMode ? <><EyeOff className="w-3.5 h-3.5" />Editar</> : <><Eye className="w-3.5 h-3.5" />Preview</>}
          </button>
          <button onClick={() => setShowRightPanel(!showRightPanel)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            {showRightPanel ? <PanelCloseIcon className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
          <div className="h-5 w-px bg-gray-200" />
          {state.hasUnsavedChanges && <span className="text-xs text-amber-600 font-medium">Sin guardar</span>}
          {saveMessage && <span className={`text-xs font-medium ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{saveMessage}</span>}
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Section Library */}
        <AnimatePresence>
          {state.showSectionLibrary && <SectionLibrary store={store} onClose={store.toggleSectionLibrary} />}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto" onClick={() => { store.selectSection(null); store.selectElement(null); }}>
          <div className="min-h-full flex justify-center py-6">
            <div
              className="bg-white shadow-2xl overflow-hidden transition-all duration-300"
              style={{
                width: `${deviceWidths[state.devicePreview]}px`,
                maxWidth: '100%',
                transform: `scale(${state.zoom / 100})`,
                transformOrigin: 'top center',
                borderRadius: state.devicePreview !== 'desktop' ? '20px' : '0',
                border: state.devicePreview !== 'desktop' ? '8px solid #333' : 'none',
              }}
            >
              {store.activePage?.sections.map(section => (
                <SectionPreview
                  key={section.id}
                  section={section}
                  isSelected={state.selectedSectionId === section.id}
                  isPreview={state.isPreviewMode}
                  onSelect={() => store.selectSection(section.id)}
                  onSelectElement={(elementId) => { store.selectSection(section.id); store.selectElement(elementId); }}
                  selectedElementId={state.selectedElementId}
                  store={store}
                />
              ))}

              {/* Empty state */}
              {(!store.activePage?.sections || store.activePage.sections.length === 0) && (
                <div className="flex flex-col items-center justify-center py-24 text-foreground/40">
                  <Layout className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm mb-4">Esta página está vacía</p>
                  <button onClick={store.toggleSectionLibrary} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" /> Agregar Sección
                  </button>
                </div>
              )}

              {/* Bottom add button */}
              {store.activePage?.sections && store.activePage.sections.length > 0 && !state.isPreviewMode && (
                <div className="p-8 flex justify-center">
                  <button onClick={store.toggleSectionLibrary} className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    <Plus className="w-4 h-4" /> Agregar Sección
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <AnimatePresence>
          {showRightPanel && !state.isPreviewMode && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white border-l border-gray-200 overflow-hidden shrink-0">
              <PropertiesPanel store={store} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== BOTTOM LAYERS BAR ===== */}
      {!state.isPreviewMode && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white border-t border-gray-200 shrink-0 overflow-x-auto">
          <Layers className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
          {store.activePage?.sections.map((section, idx) => (
            <button key={section.id} onClick={() => store.selectSection(section.id)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] whitespace-nowrap transition-colors ${state.selectedSectionId === section.id ? 'bg-blue-100 text-blue-700' : 'text-foreground/50 hover:bg-gray-100'} ${!section.visible ? 'opacity-40' : ''}`}>
              <span>{idx + 1}.</span><span className="max-w-[80px] truncate">{section.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
