'use client';

import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer, { SectionButton } from '@/app/components/CustomSections';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';
import { Loader2 } from 'lucide-react';

export default function UbicacionesPage() {
  const { ubicaciones: content, isLoading } = usePagesContent();

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="px-4 py-16 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl lg:text-4xl font-medium mb-4" style={textStyleCSS(content.textStyles, 'hero-title')}>{content.hero.title}</h1>
        <p className="text-foreground/70" style={textStyleCSS(content.textStyles, 'hero-desc')}>{content.hero.description}</p>
        {content.hero.buttons && content.hero.buttons.length > 0 && (
          <div className={`flex flex-wrap gap-3 mt-6 ${BTN_ALIGN_CLASS[content.hero.buttonAlignment || 'center']}`}>
            {content.hero.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
          </div>
        )}
      </section>

      {/* Google Maps */}
      <div className="aspect-[16/9] lg:aspect-[21/9] mb-12 overflow-hidden">
        <iframe 
          src={content.mapEmbedUrl}
          width="100%" 
          height="100%" 
          style={{ border: 0 }}
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Location Info */}
      <section className="px-4 pb-16 max-w-4xl mx-auto text-center">
        <div className="p-8 border border-gray-200 rounded-lg">
          <h3 className="text-2xl font-medium mb-4" style={textStyleCSS(content.textStyles, 'location-title')}>{content.location.title}</h3>
          <p className="text-foreground/70 mb-2" style={textStyleCSS(content.textStyles, 'location-address')}>{content.location.address}</p>
          <p className="text-foreground/70 mb-4" style={textStyleCSS(content.textStyles, 'location-note')}>{content.location.note}</p>
          <a 
            href={`mailto:${content.location.buttonEmail}`}
            className="inline-block px-6 py-3 bg-foreground text-white rounded-full hover:bg-foreground/90 transition-colors font-medium"
          >
            {content.location.buttonText}
          </a>
          {content.location.buttons && content.location.buttons.length > 0 && (
            <div className={`flex flex-wrap gap-3 mt-4 ${BTN_ALIGN_CLASS[content.location.buttonAlignment || 'center']}`}>
              {content.location.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
            </div>
          )}
        </div>
      </section>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
