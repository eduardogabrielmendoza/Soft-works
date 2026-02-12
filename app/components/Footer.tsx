'use client';

import Link from 'next/link';
import { Instagram, Youtube, Twitter, Facebook, Mail } from 'lucide-react';
import { useState } from 'react';
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
  const [email, setEmail] = useState('');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeMessage('¡Gracias por suscribirte!');
    setEmail('');
    setTimeout(() => setSubscribeMessage(''), 3000);
  };

  // Verificar si hay redes sociales configuradas
  const hasSocialLinks = config.social_instagram || config.social_youtube || config.social_tiktok || config.social_twitter || config.social_facebook;

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Newsletter Section */}
        <div className="mb-12 lg:mb-16 max-w-2xl">
          <h3 className="text-2xl lg:text-3xl font-medium mb-4" style={textStyleCSS(layout.textStyles, 'footer-newsletter-title')}>
            {layout.footer.newsletterTitle.replace('{site_name}', config.site_name)}
          </h3>
          <p className="text-sm text-foreground/70 mb-6" style={textStyleCSS(layout.textStyles, 'footer-newsletter-desc')}>
            {layout.footer.newsletterDescription}
          </p>
          {subscribeMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
              {subscribeMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Suscribirse
            </button>
          </form>
          <p className="text-xs text-foreground/50 mt-3">
            Al suscribirte, aceptas nuestra{' '}
            <Link href="/politica-privacidad" className="underline hover:text-foreground">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>

        {/* Links Grid - Dynamic from layout config */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {layout.footer.linkColumns.map(col => (
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
