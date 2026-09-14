'use client';

import { useEffect } from 'react';

const colors = ['#f8efd8', '#d9b36e', '#af7a43', '#78503b', '#eee0c6'];

export default function RsvpCelebration() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let active = true;
    const timers: number[] = [];

    void import('canvas-confetti').then(({ default: confetti }) => {
      if (!active) return;

      const burst = (options: Record<string, unknown>) => {
        void confetti({
          colors,
          disableForReducedMotion: true,
          zIndex: 3,
          ...options,
        });
      };

      // A warm, centre-led blessing followed by two quiet side fireworks.
      burst({ particleCount: 44, spread: 64, startVelocity: 31, scalar: 0.92, shapes: ['star', 'circle'], origin: { x: 0.5, y: 0.56 } });
      timers.push(window.setTimeout(() => burst({ particleCount: 24, angle: 58, spread: 52, startVelocity: 27, scalar: 0.78, shapes: ['star'], origin: { x: 0.06, y: 0.68 } }), 260));
      timers.push(window.setTimeout(() => burst({ particleCount: 24, angle: 122, spread: 52, startVelocity: 27, scalar: 0.78, shapes: ['star'], origin: { x: 0.94, y: 0.68 } }), 360));
      timers.push(window.setTimeout(() => burst({ particleCount: 28, spread: 90, startVelocity: 18, gravity: 0.7, scalar: 0.66, shapes: ['circle', 'star'], origin: { x: 0.5, y: 0.48 } }), 740));
    });

    return () => {
      active = false;
      timers.forEach(window.clearTimeout);
    };
  }, []);

  return <div className="rsvp-celebration-aura" aria-hidden="true"><span /><span /><span /></div>;
}
