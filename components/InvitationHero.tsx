'use client';

import { motion } from 'framer-motion';
import TreasureChest from '@/components/treasure-chest/TreasureChest';

interface InvitationHeroProps {
  onOpen: () => void;
}

export default function InvitationHero({ onOpen }: InvitationHeroProps) {
  return (
    <motion.div
      className="invitation-hero-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      {/* Restrained monogram: the logo itself is inside the chest until it is
          opened, so the hero still carries the couple's mark. */}
      <motion.p
        className="invitation-hero-monogram"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Farzeen <span>&amp;</span> Bilal
      </motion.p>

      <TreasureChest onOpen={onOpen} />
    </motion.div>
  );
}
