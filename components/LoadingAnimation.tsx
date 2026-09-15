'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingAnimation() {
  return (
    <motion.div
      className="loading-experience fixed inset-0 flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="loading-logo-mark">
          <motion.span
            className="loading-logo-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
          />
          <Image src="/images/logo.jpeg" alt="" fill priority sizes="92px" />
        </div>
        <motion.p
          className="text-[#8B7355] text-[11px] tracking-[0.3em] uppercase font-light"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Preparing your invitation
        </motion.p>
      </div>
    </motion.div>
  );
}
