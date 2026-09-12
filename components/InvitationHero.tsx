'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface InvitationHeroProps {
  onOpen: () => void;
}

export default function InvitationHero({ onOpen }: InvitationHeroProps) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-10"
      style={{ pointerEvents: 'none' }} // Allow events to pass through to fluid canvas
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      {/* Circular Logo with subtle pulse */}
      <motion.div
        className="relative mb-8 cursor-pointer"
        style={{ pointerEvents: 'auto' }} // Re-enable pointer events for the logo
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpen}
      >
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4A574]/20 to-[#B8956A]/20 blur-2xl scale-110" />
        
        {/* Logo container with premium shadow and gentle pulse */}
        <motion.div 
          className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-2xl ring-1 ring-black/5"
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Image
            src="/images/logo.jpeg"
            alt="Wedding Logo"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
          />
        </motion.div>
      </motion.div>

      {/* Invitation Text */}
      <motion.div
        className="flex flex-col items-center gap-3 cursor-pointer"
        style={{ pointerEvents: 'auto' }} // Re-enable pointer events for text
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        onClick={onOpen}
      >
        <p className="text-[#6B5744] text-base md:text-lg tracking-[0.2em] uppercase font-light">
          Click to open the invitation
        </p>
        
        {/* Animated chevron icon */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-[#8B7355]" strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
