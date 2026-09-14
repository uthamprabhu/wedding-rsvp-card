'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

export default function InvitationParticles() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const update = () => setIsCompact(window.innerWidth < 700 || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 40,
    preload: [
      { src: '/images/particles/star.svg', width: 24, height: 24 },
      { src: '/images/particles/heart.svg', width: 24, height: 24 },
      { src: '/images/particles/moon.svg', width: 24, height: 24 },
      { src: '/images/particles/gift.svg', width: 24, height: 24 },
    ],
    particles: {
      move: { enable: !isCompact, speed: 0.22, random: true, straight: false, outModes: { default: 'out' } },
      number: { density: { enable: true }, value: isCompact ? 20 : 40 },
      opacity: { value: { min: 0.28, max: 0.62 }, animation: { enable: !isCompact, speed: 0.18, minimumValue: 0.22, sync: false } },
      reduceDuplicates: true,
      rotate: { value: { min: 0, max: 360 }, animation: { enable: !isCompact, speed: 1.1, sync: false } },
      shape: {
        type: 'image',
        options: {
          image: [
            { src: '/images/particles/star.svg', width: 24, height: 24 },
            { src: '/images/particles/heart.svg', width: 24, height: 24 },
            { src: '/images/particles/moon.svg', width: 24, height: 24 },
            { src: '/images/particles/gift.svg', width: 24, height: 24 },
          ],
        },
      },
      size: { value: { min: 7, max: 16 } },
    },
    detectRetina: true,
  }), [isCompact]);

  return (
    <ParticlesProvider init={particlesInit}>
      <Particles id="invitation-dust" options={options} className="invitation-particles" />
    </ParticlesProvider>
  );
}
