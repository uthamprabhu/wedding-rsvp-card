'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DiamondRingLoaderProps {
  label?: string;
  overlay?: boolean;
}

/** Reusable transition loader for the journeys after the opening logo experience. */
export default function DiamondRingLoader({ label = 'Preparing the next chapter', overlay = false }: DiamondRingLoaderProps) {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPortalReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const loader = (
    <motion.div
      className={`diamond-ring-loader ${overlay ? 'diamond-ring-loader-overlay' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      role="status"
      aria-label={label}
    >
      <div className="diamond-ring-loader-mark" aria-hidden="true">
        <motion.svg className="diamond-ring-loader-orbit" viewBox="0 0 120 120" animate={{ rotate: 360 }} transition={{ duration: 4.6, repeat: Infinity, ease: 'linear' }}>
          <circle cx="60" cy="60" r="44" fill="none" stroke="url(#silver-ring)" strokeWidth="2" />
          <path d="M60 8l6 8-6 8-6-8z" fill="#f8f8fa" stroke="#aeb2ba" strokeWidth="1" />
          <defs><linearGradient id="silver-ring" x1="16" y1="16" x2="104" y2="104" gradientUnits="userSpaceOnUse"><stop stopColor="#8d929d" /><stop offset=".3" stopColor="#f7f7f8" /><stop offset=".58" stopColor="#aeb2ba" /><stop offset="1" stopColor="#f9f9fa" /></linearGradient></defs>
        </motion.svg>
        <motion.svg className="diamond-ring-loader-stone" viewBox="0 0 64 64" animate={{ y: [0, -2, 0], filter: ['drop-shadow(0 3px 4px rgba(82, 89, 102, .18))', 'drop-shadow(0 6px 8px rgba(82, 89, 102, .28))', 'drop-shadow(0 3px 4px rgba(82, 89, 102, .18))'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M32 7l17 14-17 35L15 21 32 7Z" fill="#edf2f7" stroke="#9ba2ae" strokeWidth="1.4" />
          <path d="M15 21h34M32 7v49M15 21l17 13 17-13" fill="none" stroke="#b6bdc8" strokeWidth="1" />
          <path d="M32 7l-7 14 7 13 7-13-7-14Z" fill="#fff" fillOpacity=".9" />
        </motion.svg>
      </div>
      <p>{label}</p>
    </motion.div>
  );

  // Animated route containers establish a containing block for fixed children.
  // Portal overlays to body so every route transition is viewport-centered.
  return overlay && portalReady ? createPortal(loader, document.body) : loader;
}
