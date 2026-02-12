'use client';

import { useLayoutContent } from '@/lib/hooks/useLayoutContent';
import { textStyleCSS } from '@/lib/types/sections';

export default function BrandSection() {
  const { layout } = useLayoutContent();

  if (!layout.brandSection.enabled) return null;

  return (
    <section className="w-full bg-white py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
        <h2
          className="text-[80px] sm:text-[120px] lg:text-[180px] xl:text-[220px] font-bold text-foreground/20 tracking-wide select-none"
          style={textStyleCSS(layout.textStyles, 'brand-text')}
        >
          {layout.brandSection.text}
        </h2>
      </div>
    </section>
  );
}
