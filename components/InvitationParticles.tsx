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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted to enable particles
    setIsMounted(true);
    
    const update = () => {
      setIsCompact(window.innerWidth < 700);
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    let cancelled = false;

    // Preload all particle assets with a timeout fallback for slow networks
    const preload = (src: string) => new Promise<void>((resolve) => {
      const image = new Image();
      const timeout = window.setTimeout(() => resolve(), 2000); // 2s fallback
      image.onload = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      image.onerror = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      image.src = src;
    });

    void Promise.all(particleAssets.map(preload)).then(() => {
      if (!cancelled) {
        setAssetsReady(true);
        // Immediately show particles once assets are ready
        requestAnimationFrame(() => {
          if (!cancelled) setIsVisible(true);
        });
      }
    });

    return () => { 
      cancelled = true; 
    };
  }, [isMounted]);

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: isCompact ? 36 : 45,
    preload: [
      { src: '/images/particles/star.svg', width: 24, height: 24 },
      { src: '/images/particles/heart.svg', width: 24, height: 24 },
      { src: '/images/particles/moon.svg', width: 24, height: 24 },
      { src: '/images/particles/gift.svg', width: 24, height: 24 },
    ],
    particles: {
      move: { 
        enable: !reducedMotion, 
        speed: isCompact ? 0.5 : 0.35, 
        random: true, 
        straight: false, 
        outModes: { default: 'out' },
        attract: { enable: false }
      },
      number: { 
        density: { enable: true, width: 1920, height: 1080 }, 
        value: isCompact ? 28 : 38 
      },
      opacity: { 
        value: { min: isCompact ? 0.35 : 0.3, max: 0.7 }, 
        animation: { 
          enable: !reducedMotion, 
          speed: 0.3, 
          minimumValue: 0.25, 
          sync: false 
        } 
      },
      reduceDuplicates: true,
      rotate: { 
        value: { min: 0, max: 360 }, 
        animation: { 
          enable: !reducedMotion, 
          speed: isCompact ? 1 : 1.3, 
          sync: false 
        } 
      },
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
      size: { value: { min: 8, max: 17 } },
    },
    detectRetina: true,
  }), [isCompact, reducedMotion]);

  if (!isMounted || !assetsReady) return null;

  return (
    <ParticlesProvider init={particlesInit}>
      <Particles
        id="invitation-dust"
        options={options}
        className={`invitation-particles ${isVisible ? 'is-visible' : ''}`}
      />
    </ParticlesProvider>
  );
}
