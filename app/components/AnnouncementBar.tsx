'use client';

import { motion } from 'framer-motion';

interface AnnouncementBarProps {
  isVisible: boolean;
}

export default function AnnouncementBar({ isVisible }: AnnouncementBarProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : '-100%' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-[55] bg-[#F5EDE4] border-b border-[#E8DED3]"
    >
      <div className="py-2.5 px-4 text-center">
        <p className="text-xs sm:text-sm font-medium text-[#6B5E54] tracking-wide uppercase">
          Envío gratis en pedidos mayores a $100.000
        </p>
      </div>
    </motion.div>
  );
}
