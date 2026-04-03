'use client';

import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer, { SectionButton } from '@/app/components/CustomSections';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';
import { Loader2, Mail } from 'lucide-react';

export default function ContactoPage() {
  const { config, isLoading: configLoading } = useSiteConfig();
  const { contacto: content, isLoading: contentLoading } = usePagesContent();

  if (configLoading || contentLoading) {
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

      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-medium mb-8 text-center">Formas de contacto</h2>
        
        <div className="text-center mb-8">
          <a
            href="mailto:softworksargentina@gmail.com"
            className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors font-medium"
          >
            <Mail className="w-5 h-5" />
            Envianos un mail
          </a>
        </div>

        <div className="space-y-4 text-foreground/70 text-center">
          {config.contact_email && (
            <div>
              <strong className="text-foreground block mb-1">Email</strong>
              <a href={`mailto:${config.contact_email}`} className="hover:text-foreground transition-colors">
                {config.contact_email}
              </a>
            </div>
          )}

          {config.contact_phone && (
            <div>
              <strong className="text-foreground block mb-1">Teléfono</strong>
              <a href={`tel:${config.contact_phone.replace(/\s/g, '')}`} className="hover:text-foreground transition-colors">
                {config.contact_phone}
              </a>
            </div>
          )}

          {config.contact_hours && (
            <div>
              <strong className="text-foreground block mb-1">Horario</strong>
              <p>{config.contact_hours}</p>
            </div>
          )}

          {(config.social_instagram || config.social_tiktok) && (
            <div>
              <strong className="text-foreground block mb-2">Redes Sociales</strong>
              <div className="space-y-1">
                {config.social_instagram && (
                  <p>
                    <a href={`https://instagram.com/${config.social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      Instagram: {config.social_instagram}
                    </a>
                  </p>
                )}
                {config.social_tiktok && (
                  <p>
                    <a href={`https://tiktok.com/${config.social_tiktok}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                      TikTok: {config.social_tiktok}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
