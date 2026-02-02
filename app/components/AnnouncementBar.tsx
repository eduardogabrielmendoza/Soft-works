'use client';

import { motion } from 'framer-motion';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

interface AnnouncementBarProps {
  isVisible: boolean;
}

export default function AnnouncementBar({ isVisible }: AnnouncementBarProps) {
  const { config } = useSiteConfig();
  
  // No mostrar si está deshabilitado o no hay texto
  if (!config.announcement_enabled || !config.announcement_text) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : '-120%' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-2 left-4 right-4 z-[55]"
    >
      <div className="bg-[#F2F0EB] rounded-full py-2.5 px-6 shadow-sm">
        <p className="text-xs sm:text-sm font-medium text-[#545454] tracking-wide text-center">
          {config.announcement_text}
        </p>
      </div>
    </motion.div>
  );
}
