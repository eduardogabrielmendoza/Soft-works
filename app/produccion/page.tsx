'use client';

import Image from 'next/image';
import { usePagesContent } from '@/lib/hooks/usePagesContent';
import CustomSectionsRenderer from '@/app/components/CustomSections';
import { Loader2 } from 'lucide-react';

export default function ProduccionPage() {
  const { produccion: content, isLoading } = usePagesContent();

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
        <h1 className="text-4xl lg:text-5xl font-medium mb-6">{content.hero.title}</h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          {content.hero.description}
        </p>
      </section>

      {/* Production Pillars */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {content.pillars.map((pillar, i) => (
            <div key={i} className="text-center">
              <div className="aspect-square rounded-lg mx-auto mb-6 w-full max-w-sm relative overflow-hidden group cursor-pointer">
                <Image
                  src={pillar.image}
                  alt={pillar.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium mb-2">{pillar.title}</h3>
              <p className="text-foreground/70">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <CustomSectionsRenderer sections={content.customSections} />
    </div>
  );
}
