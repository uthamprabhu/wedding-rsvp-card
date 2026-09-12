'use client';

import { motion } from 'framer-motion';
import { Atom } from 'react-loading-indicators';

export default function LoadingAnimation() {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center gap-6">
        <Atom 
          color="#D4A574" 
          size="large"
          text=""
          textColor=""
        />
        <motion.p
          className="text-[#8B7355] text-sm tracking-[0.3em] uppercase font-light"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Loading
        </motion.p>
      </div>
    </motion.div>
  );
}
