'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import TreasureChest from '@/components/treasure-chest/TreasureChest';

interface InvitationHeroProps {
  onOpen: () => void;
}

const TOP_DECOR = '/images/decor/top-left-hero-decor.png';
const BOT_DECOR = '/images/decor/bottom-left-hero-decor.png';

const corners = [
  { key: 'tl', src: TOP_DECOR, style: {}, objPos: 'top left' },
  { key: 'tr', src: TOP_DECOR, style: { transform: 'scaleX(-1)' }, objPos: 'top right' },
  { key: 'bl', src: BOT_DECOR, style: {}, objPos: 'bottom left' },
  { key: 'br', src: BOT_DECOR, style: { transform: 'scaleX(-1)' }, objPos: 'bottom right' },
] as const;

export default function InvitationHero({ onOpen }: InvitationHeroProps) {
  return (
    <motion.div
      className="invitation-hero-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      {/* Four independent corner decorations – same PNG, CSS-mirrored.
          Each is absolutely positioned so the transparent centre of the PNG
          sits over the chest without covering it. pointer-events: none on
          the wrapper ensures taps always reach the chest beneath. */}
      <div className="hero-decor-frame" aria-hidden="true">
        {corners.map(({ key, src, style, objPos }) => (
          <div key={key} className={`hero-decor-corner hero-decor-${key}`} style={style}>
            <Image
              src={src}
              alt=""
              fill
              sizes="30vw"
              priority
              draggable={false}
              style={{ objectFit: 'contain', objectPosition: objPos }}
            />
          </div>
        ))}
      </div>

      {/* Couple logo mark replacing the text monogram */}
      <motion.div
        className="invitation-hero-logo"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="/images/fabi-logo.png"
          alt="Farzeen & Bilal"
          width={160}
          height={80}
          priority
          className="invitation-hero-logo-img"
        />
      </motion.div>

      <TreasureChest onOpen={onOpen} />
    </motion.div>
  );
}
