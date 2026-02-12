'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Loader2, ArrowLeft, Monitor, Tablet, Smartphone,
  Home, Users, Factory, Calendar, MapPin, Phone,
  Plus, Trash2, ChevronDown, ChevronUp, Check, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIndexContent, type IndexContent, type HeroSlide, type ProductCard, type LifestyleImage, type ContentItem } from '@/lib/hooks/useIndexContent';
import { usePagesContent, type NosotrosContent, type ProduccionContent, type EventosContent, type EventoItem, type UbicacionesContent, type ContactoContent } from '@/lib/hooks/usePagesContent';
import { getSupabaseClient } from '@/lib/supabase/client';

// ============================================================
// TYPES
// ============================================================
type PageId = 'index' | 'nosotros' | 'produccion' | 'eventos' | 'ubicaciones' | 'contacto';
type DevicePreview = 'desktop' | 'tablet' | 'mobile';

const PAGE_TABS: { id: PageId; label: string; icon: React.ReactNode; path: string }[] = [
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/60 mb-1.5">{label}</label>
      {children}
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

// ============================================================
// PAGE-SPECIFIC FORM EDITORS
// ============================================================

// ---- INDEX ----
function IndexEditor({ content, onChange }: { content: IndexContent; onChange: (c: IndexContent) => void }) {
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
              <Field label="Título"><TextInput value={slide.title} onChange={v => updateSlide(idx, { title: v })} /></Field>
              <Field label="Subtítulo"><TextInput value={slide.subtitle} onChange={v => updateSlide(idx, { subtitle: v })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Texto del botón"><TextInput value={slide.ctaText} onChange={v => updateSlide(idx, { ctaText: v })} /></Field>
                <Field label="Link del botón"><TextInput value={slide.ctaLink} onChange={v => updateSlide(idx, { ctaLink: v })} /></Field>
              </div>
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
                <Field label="Título"><TextInput value={card.title} onChange={v => updateCard(idx, { title: v })} /></Field>
                <Field label="Subtítulo"><TextInput value={card.subtitle} onChange={v => updateCard(idx, { subtitle: v })} /></Field>
              </div>
              <Field label="Descripción"><TextArea value={card.description} onChange={v => updateCard(idx, { description: v })} /></Field>
              <Field label="Link"><TextInput value={card.link} onChange={v => updateCard(idx, { link: v })} /></Field>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Philosophy */}
      <SectionCard title="💡 Filosofía">
        <div className="space-y-3 pt-3">
          <Field label="Título"><TextArea value={content.philosophySection.title} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, title: v } })} rows={2} /></Field>
          <Field label="Descripción"><TextArea value={content.philosophySection.description} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, description: v } })} rows={4} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto del botón"><TextInput value={content.philosophySection.ctaText} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, ctaText: v } })} /></Field>
            <Field label="Link del botón"><TextInput value={content.philosophySection.ctaLink} onChange={v => onChange({ ...content, philosophySection: { ...content.philosophySection, ctaLink: v } })} /></Field>
          </div>
        </div>
      </SectionCard>

      {/* Lifestyle Images */}
      <SectionCard title="📸 Imágenes Lifestyle" defaultOpen={false}>
        <div className="space-y-3 pt-3">
          {content.lifestyleImages.map((img, idx) => (
            <div key={img.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <ImageInput value={img.image} onChange={v => updateLifestyle(idx, { image: v })} />
              <Field label="Etiqueta"><TextInput value={img.label} onChange={v => updateLifestyle(idx, { label: v })} /></Field>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Full Width Banner */}
      <SectionCard title="🖼️ Banner Full Width" defaultOpen={false}>
        <div className="space-y-3 pt-3">
          <ImageInput value={content.fullWidthBanner.image} onChange={v => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, image: v } })} label="Imagen" />
          <Field label="Título"><TextInput value={content.fullWidthBanner.title} onChange={v => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, title: v } })} /></Field>
          <Field label="Subtítulo"><TextInput value={content.fullWidthBanner.subtitle} onChange={v => onChange({ ...content, fullWidthBanner: { ...content.fullWidthBanner, subtitle: v } })} /></Field>
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
                <Field label="Título"><TextInput value={item.title} onChange={v => updateGridItem(idx, { title: v })} /></Field>
                <Field label="Link"><TextInput value={item.link} onChange={v => updateGridItem(idx, { link: v })} /></Field>
              </div>
              <Field label="Descripción"><TextInput value={item.description} onChange={v => updateGridItem(idx, { description: v })} /></Field>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ---- NOSOTROS ----
function NosotrosEditor({ content, onChange }: { content: NosotrosContent; onChange: (c: NosotrosContent) => void }) {
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
          <Field label="Título"><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Descripción"><TextArea value={content.hero.description} onChange={v => onChange({ ...content, hero: { ...content.hero, description: v } })} rows={4} /></Field>
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
          <Field label="Título"><TextInput value={content.vision.title} onChange={v => onChange({ ...content, vision: { ...content.vision, title: v } })} /></Field>
          <Field label="Párrafo 1"><TextArea value={content.vision.paragraph1} onChange={v => onChange({ ...content, vision: { ...content.vision, paragraph1: v } })} /></Field>
          <Field label="Párrafo 2"><TextArea value={content.vision.paragraph2} onChange={v => onChange({ ...content, vision: { ...content.vision, paragraph2: v } })} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="⭐ Valores">
        <div className="space-y-3 pt-3">
          <ImageInput value={content.values.image} onChange={v => onChange({ ...content, values: { ...content.values, image: v } })} label="Imagen" />
          <Field label="Título"><TextInput value={content.values.title} onChange={v => onChange({ ...content, values: { ...content.values, title: v } })} /></Field>
          {content.values.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Field label={`Valor ${idx + 1} — Título`}><TextInput value={item.title} onChange={v => updateValue(idx, { title: v })} /></Field>
                <Field label="Descripción"><TextInput value={item.description} onChange={v => updateValue(idx, { description: v })} /></Field>
              </div>
              {content.values.items.length > 1 && (
                <button onClick={() => removeValue(idx)} className="p-1 mt-5 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
          <button onClick={addValue} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Valor
          </button>
        </div>
      </SectionCard>

      <SectionCard title="📢 CTA" defaultOpen={false}>
        <div className="space-y-3 pt-3">
          <Field label="Título"><TextInput value={content.cta.title} onChange={v => onChange({ ...content, cta: { ...content.cta, title: v } })} /></Field>
          <Field label="Descripción"><TextArea value={content.cta.description} onChange={v => onChange({ ...content, cta: { ...content.cta, description: v } })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto del botón"><TextInput value={content.cta.buttonText} onChange={v => onChange({ ...content, cta: { ...content.cta, buttonText: v } })} /></Field>
            <Field label="Link"><TextInput value={content.cta.buttonLink} onChange={v => onChange({ ...content, cta: { ...content.cta, buttonLink: v } })} /></Field>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ---- PRODUCCIÓN ----
function ProduccionEditor({ content, onChange }: { content: ProduccionContent; onChange: (c: ProduccionContent) => void }) {
  const updatePillar = (idx: number, updates: Partial<{ title: string; description: string; image: string }>) => {
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
          <Field label="Título"><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Descripción"><TextArea value={content.hero.description} onChange={v => onChange({ ...content, hero: { ...content.hero, description: v } })} /></Field>
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
              <Field label="Título"><TextInput value={pillar.title} onChange={v => updatePillar(idx, { title: v })} /></Field>
              <Field label="Descripción"><TextArea value={pillar.description} onChange={v => updatePillar(idx, { description: v })} /></Field>
            </div>
          ))}
          <button onClick={addPillar} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-foreground/50 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Pilar
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ---- EVENTOS ----
function EventosEditor({ content, onChange }: { content: EventosContent; onChange: (c: EventosContent) => void }) {
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
          <Field label="Título"><TextInput value={content.title} onChange={v => onChange({ ...content, title: v })} /></Field>
          <Field label="Subtítulo"><TextInput value={content.subtitle} onChange={v => onChange({ ...content, subtitle: v })} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="📅 Próximos Eventos">
        <div className="space-y-4 pt-3">
          <Field label="Título de sección"><TextInput value={content.upcomingTitle} onChange={v => onChange({ ...content, upcomingTitle: v })} /></Field>
          {content.upcomingEvents.map((evt, idx) => (
            <div key={evt.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">Evento {idx + 1}</span>
                <button onClick={() => removeUpcoming(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <ImageInput value={evt.image} onChange={v => updateUpcoming(idx, { image: v })} />
              <Field label="Título"><TextInput value={evt.title} onChange={v => updateUpcoming(idx, { title: v })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha"><TextInput value={evt.date} onChange={v => updateUpcoming(idx, { date: v })} placeholder="DD/MM/AAAA" /></Field>
                <Field label="Ubicación"><TextInput value={evt.location} onChange={v => updateUpcoming(idx, { location: v })} /></Field>
              </div>
              <Field label="Descripción"><TextArea value={evt.description} onChange={v => updateUpcoming(idx, { description: v })} /></Field>
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
          <Field label="Título de sección"><TextInput value={content.pastTitle} onChange={v => onChange({ ...content, pastTitle: v })} /></Field>
          {content.pastEvents.map((evt, idx) => (
            <div key={evt.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">Evento {idx + 1}</span>
                <button onClick={() => removePast(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <ImageInput value={evt.image} onChange={v => updatePast(idx, { image: v })} />
              <Field label="Título"><TextInput value={evt.title} onChange={v => updatePast(idx, { title: v })} /></Field>
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
    </div>
  );
}

// ---- UBICACIONES ----
function UbicacionesEditor({ content, onChange }: { content: UbicacionesContent; onChange: (c: UbicacionesContent) => void }) {
  return (
    <div className="space-y-4">
      <SectionCard title="🏠 Encabezado">
        <div className="space-y-3 pt-3">
          <Field label="Título"><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Descripción"><TextArea value={content.hero.description} onChange={v => onChange({ ...content, hero: { ...content.hero, description: v } })} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="🗺️ Mapa">
        <div className="pt-3">
          <Field label="URL de Google Maps Embed"><TextInput value={content.mapEmbedUrl} onChange={v => onChange({ ...content, mapEmbedUrl: v })} placeholder="https://www.google.com/maps/embed?..." /></Field>
        </div>
      </SectionCard>

      <SectionCard title="📍 Información de Ubicación">
        <div className="space-y-3 pt-3">
          <Field label="Título"><TextInput value={content.location.title} onChange={v => onChange({ ...content, location: { ...content.location, title: v } })} /></Field>
          <Field label="Dirección"><TextInput value={content.location.address} onChange={v => onChange({ ...content, location: { ...content.location, address: v } })} /></Field>
          <Field label="Nota"><TextInput value={content.location.note} onChange={v => onChange({ ...content, location: { ...content.location, note: v } })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Texto del botón"><TextInput value={content.location.buttonText} onChange={v => onChange({ ...content, location: { ...content.location, buttonText: v } })} /></Field>
            <Field label="Email"><TextInput value={content.location.buttonEmail} onChange={v => onChange({ ...content, location: { ...content.location, buttonEmail: v } })} /></Field>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ---- CONTACTO ----
function ContactoEditor({ content, onChange }: { content: ContactoContent; onChange: (c: ContactoContent) => void }) {
  return (
    <div className="space-y-4">
      <SectionCard title="🏠 Encabezado">
        <div className="space-y-3 pt-3">
          <Field label="Título"><TextInput value={content.hero.title} onChange={v => onChange({ ...content, hero: { ...content.hero, title: v } })} /></Field>
          <Field label="Subtítulo 1"><TextInput value={content.hero.subtitle1} onChange={v => onChange({ ...content, hero: { ...content.hero, subtitle1: v } })} /></Field>
          <Field label="Subtítulo 2"><TextInput value={content.hero.subtitle2} onChange={v => onChange({ ...content, hero: { ...content.hero, subtitle2: v } })} /></Field>
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
          <Field label="Título"><TextInput value={content.infoSection.title} onChange={v => onChange({ ...content, infoSection: { ...content.infoSection, title: v } })} /></Field>
          <p className="text-xs text-foreground/40 mt-2">La información de contacto (email, teléfono, dirección, redes sociales) se configura en <Link href="/admin/configuracion" className="text-blue-600 hover:underline">Configuración del Sitio</Link>.</p>
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
      ];

      for (const u of updates) {
        const { error } = await supabase.from('configuracion_sitio').upsert(
          { clave: u.clave, valor: u.valor },
          { onConflict: 'clave' }
        );
        if (error) throw error;
      }

      await Promise.all([refreshIndex(), refreshPages()]);
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
  }, [indexData, nosotrosData, produccionData, eventosData, ubicacionesData, contactoData, refreshIndex, refreshPages]);

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
