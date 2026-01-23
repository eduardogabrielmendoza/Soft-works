'use client';

import { motion } from 'framer-motion';

interface AnnouncementBarProps {
  isVisible: boolean;
}

export default function AnnouncementBar({ isVisible }: AnnouncementBarProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : '-120%' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-2 left-4 right-4 z-[55]"
    >
      <div className="bg-[#F2F0EB] rounded-full py-2.5 px-6 shadow-sm">
        <p className="text-xs sm:text-sm font-medium text-[#545454] tracking-wide text-center">
          Envío gratis en pedidos mayores a $100.000
        </p>
      </div>
    </motion.div>
  );
}
