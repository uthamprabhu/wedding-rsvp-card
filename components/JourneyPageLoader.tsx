'use client';

import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import DiamondRingLoader from '@/components/DiamondRingLoader';

interface JourneyPageLoaderProps {
  label: string;
}

/** Lets background shaders and particles mount beneath a polished route handoff. */
export default function JourneyPageLoader({ label }: JourneyPageLoaderProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 560);
    return () => window.clearTimeout(timer);
  }, []);

  return <AnimatePresence>{visible && <DiamondRingLoader label={label} overlay />}</AnimatePresence>;
}
