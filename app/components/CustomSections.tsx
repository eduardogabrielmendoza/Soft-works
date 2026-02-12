'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CustomSection, CustomButton } from '@/lib/types/sections';
import { toEmbedUrl } from '@/lib/types/sections';

// ============================================================
// Button Renderer
// ============================================================
const BTN_SIZE_CLASSES: Record<string, string> = {
  sm: 'px-4 py-1.5',
  md: 'px-8 py-3',
  lg: 'px-12 py-4',
};
const BTN_RADIUS_CLASSES: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};
const BTN_FONT_MAP: Record<string, string> = {
  xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem',
};

export function SectionButton({ btn }: { btn: CustomButton }) {
  const isExternal = btn.link.startsWith('http');
  const sizeClass = BTN_SIZE_CLASSES[btn.size || 'md'] || BTN_SIZE_CLASSES.md;
  const radiusClass = BTN_RADIUS_CLASSES[btn.borderRadius || 'full'] || BTN_RADIUS_CLASSES.full;

  const baseClasses = `inline-flex items-center justify-center ${sizeClass} font-medium tracking-wider uppercase transition-all duration-300 ${radiusClass}`;

  // Default style classes (overridden by custom colors via inline style)
  const styleClasses: Record<string, string> = {
    filled: 'bg-foreground text-white hover:opacity-90',
    outlined: 'border-2 border-foreground text-foreground hover:opacity-80',
    text: 'text-foreground underline underline-offset-4 hover:opacity-70',
  };

  const className = `${baseClasses} ${styleClasses[btn.style] || styleClasses.filled}`;

  // Build inline styles from custom color props
  const inlineStyle: React.CSSProperties = {};
  if (btn.fontSize) inlineStyle.fontSize = BTN_FONT_MAP[btn.fontSize] || undefined;
  if (btn.style === 'filled') {
    if (btn.color) inlineStyle.backgroundColor = btn.color;
    if (btn.textColor) inlineStyle.color = btn.textColor;
  } else if (btn.style === 'outlined') {
    if (btn.color) { inlineStyle.borderColor = btn.color; inlineStyle.color = btn.color; }
    if (btn.textColor) inlineStyle.color = btn.textColor;
  } else {
    if (btn.color || btn.textColor) inlineStyle.color = btn.textColor || btn.color;
  }

  if (isExternal) {
    return (
      <a href={btn.link} target="_blank" rel="noopener noreferrer" className={className} style={inlineStyle}>
        {btn.text}
      </a>
    );
  }

  return (
    <Link href={btn.link} className={className} style={inlineStyle}>
      {btn.text}
    </Link>
  );
}

// ============================================================
// Individual Section Renderers
// ============================================================

function TextSection({ section }: { section: CustomSection }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto text-center py-16 lg:py-24 px-6"
    >
      {section.title && (
        <h2 className="text-3xl lg:text-5xl font-light text-foreground mb-6 whitespace-pre-line">
          {section.title}
        </h2>
      )}
      {section.description && (
        <p className="text-base lg:text-lg text-foreground/70 leading-relaxed max-w-3xl mx-auto">
          {section.description}
        </p>
      )}
      {section.buttons && section.buttons.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {section.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
        </div>
      )}
    </motion.div>
  );
}

function ImageSection({ section }: { section: CustomSection }) {
  if (!section.image) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-8"
    >
      {section.title && (
        <h3 className="text-xl font-light text-foreground text-center mb-6 px-6">{section.title}</h3>
      )}
      <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden">
        <Image
          src={section.image}
          alt={section.title || 'Imagen'}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      {section.description && (
        <p className="text-sm text-foreground/50 text-center mt-4 px-6">{section.description}</p>
      )}
    </motion.div>
  );
}

function BannerSection({ section }: { section: CustomSection }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative w-full aspect-[9/12] md:aspect-[16/9] lg:aspect-[21/9] overflow-hidden"
    >
      {section.image && (
        <Image
          src={section.image}
          alt={section.title || 'Banner'}
          fill
          className="object-cover"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-6">
        {section.title && (
          <h2 className="text-3xl lg:text-5xl font-light text-white mb-4 whitespace-pre-line">
            {section.title}
          </h2>
        )}
        {section.description && (
          <p className="text-base lg:text-lg text-white/80 max-w-2xl">
            {section.description}
          </p>
        )}
        {section.buttons && section.buttons.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {section.buttons.map(btn => (
              <SectionButton key={btn.id} btn={{ ...btn, style: btn.style === 'filled' ? 'outlined' : btn.style }} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CTASection({ section }: { section: CustomSection }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gray-50 py-16 lg:py-24"
    >
      <div className="max-w-4xl mx-auto text-center px-6">
        {section.title && (
          <h2 className="text-2xl lg:text-4xl font-light text-foreground mb-4 whitespace-pre-line">
            {section.title}
          </h2>
        )}
        {section.description && (
          <p className="text-base text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-8">
            {section.description}
          </p>
        )}
        {section.buttons && section.buttons.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {section.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmbedSection({ section }: { section: CustomSection }) {
  const embedSrc = toEmbedUrl(section.embedUrl || '');
  if (!embedSrc) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-8"
    >
      {section.title && (
        <h3 className="text-xl font-light text-foreground text-center mb-6 px-6">{section.title}</h3>
      )}
      <div className="relative w-full aspect-video max-w-5xl mx-auto overflow-hidden rounded-lg">
        <iframe
          src={embedSrc}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={section.title || 'Embed'}
        />
      </div>
      {section.description && (
        <p className="text-sm text-foreground/50 text-center mt-4 px-6">{section.description}</p>
      )}
    </motion.div>
  );
}

function ImageTextSection({ section }: { section: CustomSection }) {
  const imageLeft = section.imagePosition !== 'right';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-16 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
          {/* Image */}
          <div className={`relative aspect-[4/5] overflow-hidden ${!imageLeft ? 'lg:order-2' : ''}`}>
            {section.image ? (
              <Image
                src={section.image}
                alt={section.title || ''}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-foreground/30 text-sm">Sin imagen</div>
            )}
          </div>
          {/* Text */}
          <div className={`space-y-6 ${!imageLeft ? 'lg:order-1' : ''}`}>
            {section.title && (
              <h2 className="text-2xl lg:text-4xl font-light text-foreground whitespace-pre-line">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-base text-foreground/70 leading-relaxed">
                {section.description}
              </p>
            )}
            {section.buttons && section.buttons.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-2">
                {section.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Renderer — Place this at the bottom of any public page
// ============================================================
export default function CustomSectionsRenderer({ sections }: { sections?: CustomSection[] }) {
  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map(section => {
        switch (section.type) {
          case 'text': return <TextSection key={section.id} section={section} />;
          case 'image': return <ImageSection key={section.id} section={section} />;
          case 'banner': return <BannerSection key={section.id} section={section} />;
          case 'cta': return <CTASection key={section.id} section={section} />;
          case 'embed': return <EmbedSection key={section.id} section={section} />;
          case 'image-text': return <ImageTextSection key={section.id} section={section} />;
          default: return null;
        }
      })}
    </>
  );
}
