'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

const particleAssets = [
  '/images/particles/star.svg',
  '/images/particles/heart.svg',
  '/images/particles/moon.svg',
  '/images/particles/gift.svg',
];

export default function InvitationParticles() {
  const [isCompact, setIsCompact] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsCompact(window.innerWidth < 700);
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // tsParticles can briefly draw an image placeholder while SVGs are still
    // decoding. Preload all four assets before its canvas is allowed to mount.
    const preload = (src: string) => new Promise<void>((resolve) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
    });

    void Promise.all(particleAssets.map(preload)).then(() => {
      if (!cancelled) setAssetsReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: isCompact ? 36 : 40,
    preload: [
      { src: '/images/particles/star.svg', width: 24, height: 24 },
      { src: '/images/particles/heart.svg', width: 24, height: 24 },
      { src: '/images/particles/moon.svg', width: 24, height: 24 },
      { src: '/images/particles/gift.svg', width: 24, height: 24 },
    ],
    particles: {
      move: { enable: !reducedMotion, speed: isCompact ? 0.34 : 0.22, random: true, straight: false, outModes: { default: 'out' } },
      number: { density: { enable: true }, value: isCompact ? 30 : 40 },
      opacity: { value: { min: isCompact ? 0.34 : 0.28, max: 0.66 }, animation: { enable: !reducedMotion, speed: 0.2, minimumValue: 0.24, sync: false } },
      reduceDuplicates: true,
      rotate: { value: { min: 0, max: 360 }, animation: { enable: !reducedMotion, speed: isCompact ? 0.75 : 1.1, sync: false } },
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
  }), [isCompact, reducedMotion]);

  return (
    <ParticlesProvider init={particlesInit}>
      {assetsReady && <Particles
        id="invitation-dust"
        options={options}
        className={`invitation-particles ${isVisible ? 'is-visible' : ''}`}
        particlesLoaded={() => {
          // Let the canvas complete its first real draw, then fade it in.
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => setIsVisible(true)));
        }}
      />}
    </ParticlesProvider>
  );
}
