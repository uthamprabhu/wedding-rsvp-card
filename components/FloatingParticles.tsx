'use client';

import { useCallback, useMemo } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Container, Engine, ISourceOptions } from '@tsparticles/engine';

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

export default function FloatingParticles() {
  const particlesLoaded = useCallback(async () => {
    // Particles initialized
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'bubble',
          },
          resize: true,
        },
        modes: {
          bubble: {
            distance: 150,
            size: 12,
            duration: 2,
            opacity: 1,
          },
        },
      },
      particles: {
        color: {
          value: '#ffffff',
        },
        move: {
          enable: true,
          speed: 0.8,
          direction: 'none',
          random: true,
          straight: false,
          outModes: 'out',
        },
        number: {
          density: {
            enable: true,
          },
          value: 150,
        },
        opacity: {
          value: 0.7,
          animation: {
            enable: true,
            speed: 0.8,
            minimumValue: 0.4,
            sync: false,
          },
        },
        shape: {
          type: 'image',
          options: {
            image: [
              {
                src: '/images/particles/heart.svg',
                width: 24,
                height: 24,
              },
              {
                src: '/images/particles/moon.svg',
                width: 24,
                height: 24,
              },
              {
                src: '/images/particles/star.svg',
                width: 24,
                height: 24,
              },
              {
                src: '/images/particles/gift.svg',
                width: 24,
                height: 24,
              },
            ],
          },
        },
        size: {
          value: 20, // Made bigger for better emoji visibility
          random: {
            enable: true,
            minimumValue: 14,
          },
          animation: {
            enable: true,
            speed: 3,
            minimumValue: 14,
            sync: false,
          },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  return (
    <ParticlesProvider init={particlesInit}>
      <Particles
        id="wedding-particles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="fixed inset-0"
        style={{ zIndex: 15, pointerEvents: 'none' }}
      />
    </ParticlesProvider>
  );
}
