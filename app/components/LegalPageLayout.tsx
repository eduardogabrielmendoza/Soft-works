'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-medium mb-4 text-[#545454]"
          >
            {title}
          </motion.h1>
          {lastUpdated && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-[#545454]/60"
            >
              Última actualización: {lastUpdated}
            </motion.p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm">
            <div className="prose prose-sm max-w-none space-y-8">
              {children}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
