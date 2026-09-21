'use client';

/**
 * Drop-in reusable butterfly effect for any page.
 *
 * Delays mounting the heavy Three.js canvas until after first paint, so it
 * never competes with page content. The delay is configurable so pages with
 * heavier initial loads can push it later.
 *
 * Usage (any page or component):
 *   import DeferredButterflies from '@/components/DeferredButterflies';
 *   <DeferredButterflies />               // default 1 s delay
 *   <DeferredButterflies delay={1500} />  // custom delay in ms
 */

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const RealisticButterflies = dynamic(
  () => import('@/components/RealisticButterflies'),
  { ssr: false, loading: () => null },
);

interface Props {
  /** Milliseconds to wait after mount before loading the Three.js scene.
   *  Default: 1000 — lets page content paint first. */
  delay?: number;
}

export default function DeferredButterflies({ delay = 1000 }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return ready ? <RealisticButterflies /> : null;
}
