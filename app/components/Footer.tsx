'use client';

import Link from 'next/link';
import { Instagram, Youtube, Twitter, Facebook, Mail } from 'lucide-react';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';
import { useLayoutContent } from '@/lib/hooks/useLayoutContent';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';
import { SectionButton } from './CustomSections';

// Icono de TikTok (no viene con lucide-react)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function Footer() {
  const { config } = useSiteConfig();
  const { layout } = useLayoutContent();

  // Verificar si hay redes sociales configuradas
  const hasSocialLinks = config.social_instagram || config.social_youtube || config.social_tiktok || config.social_twitter || config.social_facebook;

  // Filtrar links de eventos y ubicaciones
  const filteredColumns = layout.footer.linkColumns.map(col => ({
    ...col,
    links: col.links.filter(link => 
      !link.href.includes('/eventos') && !link.href.includes('/ubicaciones')
    ),
  })).filter(col => col.links.length > 0);

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Links Grid - Dynamic from layout config */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {filteredColumns.map(col => (
            <div key={col.id}>
              <h4 className="font-medium mb-4 text-sm" style={textStyleCSS(layout.textStyles, `footer-col-${col.id}-title`)}>{col.title}</h4>
              <ul className="space-y-3 text-sm text-foreground/70">
                {col.links.map(link => (
                  <li key={link.id}>
                    <Link href={link.href} className="hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer CTA Buttons */}
        {layout.footer.buttons && layout.footer.buttons.length > 0 && (
          <div className={`flex flex-wrap gap-4 mb-12 ${BTN_ALIGN_CLASS[layout.footer.buttonAlignment || 'center']}`}>
            {layout.footer.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <p className="text-sm text-foreground/70">
                © {config.site_name} {new Date().getFullYear()}
              </p>
              <a
                href={`mailto:${layout.footer.contactEmail}`}
                className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                {layout.footer.contactEmail}
              </a>
            </div>

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-2">
                {config.social_instagram && (
                  <a
                    href={`https://instagram.com/${config.social_instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5 text-foreground" />
                  </a>
                )}
                {config.social_youtube && (
                  <a
                    href={`https://youtube.com/@${config.social_youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Youtube"
                  >
                    <Youtube className="w-5 h-5 text-foreground" />
                  </a>
                )}
                {config.social_tiktok && (
                  <a
                    href={`https://tiktok.com/${config.social_tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="TikTok"
                  >
                    <TikTokIcon />
                  </a>
                )}
                {config.social_twitter && (
                  <a
                    href={`https://twitter.com/${config.social_twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5 text-foreground" />
                  </a>
                )}
                {config.social_facebook && (
                  <a
                    href={`https://facebook.com/${config.social_facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5 text-foreground" />
                  </a>
                )}
              </div>
            )}

            <Link
              href="/no-vender-informacion"
              className="text-xs text-foreground/70 hover:text-foreground transition-colors"
            >
              No vender mi información personal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
