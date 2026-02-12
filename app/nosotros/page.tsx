'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer, { SectionButton } from '@/app/components/CustomSections';
import { textStyleCSS, BTN_ALIGN_CLASS } from '@/lib/types/sections';
import { Loader2 } from 'lucide-react';

export default function NosotrosPage() {
  const { nosotros: content, isLoading } = usePagesContent();

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="px-4 py-16 lg:py-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl lg:text-6xl font-medium mb-6" style={textStyleCSS(content.textStyles, 'hero-title')}>{content.hero.title}</h1>
          <p className="text-lg lg:text-xl text-foreground/70 leading-relaxed" style={textStyleCSS(content.textStyles, 'hero-desc')}>
            {content.hero.description}
          </p>
          {content.hero.buttons && content.hero.buttons.length > 0 && (
            <div className={`flex flex-wrap gap-3 mt-6 ${BTN_ALIGN_CLASS[content.hero.buttonAlignment || 'center']}`}>
              {content.hero.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
            </div>
          )}
        </motion.div>
      </section>

      {/* Image Header */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="aspect-[16/9] lg:aspect-[21/9] relative mb-16 overflow-hidden"
      >
        <Image
          src={content.headerImage}
          alt="Equipo Fundador Softworks"
          fill
          className="object-cover"
        />
      </motion.div>

      {/* Misión y Visión */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="aspect-[4/5] relative rounded-lg overflow-hidden"
          >
            <Image
              src={content.vision.image}
              alt="Equipo Softworks"
              fill
              className="object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-medium mb-6" style={textStyleCSS(content.textStyles, 'vision-title')}>{content.vision.title}</h2>
            <p className="text-foreground/70 leading-relaxed mb-4" style={textStyleCSS(content.textStyles, 'vision-p1')}>
              {content.vision.paragraph1}
            </p>
            <p className="text-foreground/70 leading-relaxed" style={textStyleCSS(content.textStyles, 'vision-p2')}>
              {content.vision.paragraph2}
            </p>
            {content.vision.buttons && content.vision.buttons.length > 0 && (
              <div className={`flex flex-wrap gap-3 mt-6 ${BTN_ALIGN_CLASS[content.vision.buttonAlignment || 'left']}`}>
                {content.vision.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
              </div>
            )}
          </motion.div>
        </div>

        {/* Valores invertido */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-3xl lg:text-4xl font-medium mb-6" style={textStyleCSS(content.textStyles, 'values-title')}>{content.values.title}</h2>
            <ul className="space-y-4">
              {content.values.items.map((value, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="border-l-2 border-foreground pl-4"
                >
                  <h3 className="font-medium mb-1" style={textStyleCSS(content.textStyles, `value-${i}-title`)}>{value.title}</h3>
                  <p className="text-sm text-foreground/70" style={textStyleCSS(content.textStyles, `value-${i}-desc`)}>{value.description}</p>
                </motion.li>
              ))}
            </ul>
            {content.values.buttons && content.values.buttons.length > 0 && (
              <div className={`flex flex-wrap gap-3 mt-6 ${BTN_ALIGN_CLASS[content.values.buttonAlignment || 'left']}`}>
                {content.values.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="aspect-[4/5] relative rounded-lg overflow-hidden order-1 lg:order-2"
          >
            <Image
              src={content.values.image}
              alt="Proceso de Producción"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center px-4"
        >
          <h2 className="text-3xl lg:text-4xl font-medium mb-6" style={textStyleCSS(content.textStyles, 'cta-title')}>{content.cta.title}</h2>
          <p className="text-foreground/70 mb-8" style={textStyleCSS(content.textStyles, 'cta-desc')}>
            {content.cta.description}
          </p>
          <Link
            href={content.cta.buttonLink}
            className="inline-block px-8 py-3 border-2 border-foreground rounded-full hover:bg-foreground hover:text-white transition-all font-medium"
            style={textStyleCSS(content.textStyles, 'cta-btntext')}
          >
            {content.cta.buttonText}
          </Link>
          {content.cta.buttons && content.cta.buttons.length > 0 && (
            <div className={`flex flex-wrap gap-4 mt-4 ${BTN_ALIGN_CLASS[content.cta.buttonAlignment || 'center']}`}>
              {content.cta.buttons.map(btn => <SectionButton key={btn.id} btn={btn} />)}
            </div>
          )}
        </motion.div>
      </section>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
