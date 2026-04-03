'use client';

import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer, { SectionButton } from '@/app/components/CustomSections';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';
import { Loader2, Mail } from 'lucide-react';

export default function ContactoPage() {
  const { contacto: content, isLoading: contentLoading } = usePagesContent();

  if (contentLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 py-12 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-medium mb-4" style={textStyleCSS(content.textStyles, 'hero-title')}>{content.hero.title}</h1>
        <p className="text-foreground/70" style={textStyleCSS(content.textStyles, 'hero-subtitle1')}>{content.hero.subtitle1}</p>
        <p className="text-foreground/70" style={textStyleCSS(content.textStyles, 'hero-subtitle2')}>{content.hero.subtitle2}</p>
        {content.hero.buttons && content.hero.buttons.length > 0 && (
          <div className={`flex flex-wrap gap-3 mt-6 ${BTN_ALIGN_CLASS[content.hero.buttonAlignment || 'center']}`}>
            {content.hero.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-medium mb-6">Formas de contacto</h2>
        <a
          href="mailto:softworksargentina@gmail.com"
          className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
        >
          <Mail className="w-5 h-5" />
          Envianos un mail
        </a>
      </div>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
