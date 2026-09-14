'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';
import RealisticButterflies from '@/components/RealisticButterflies';

interface CelestialBackdropProps {
  butterflies?: boolean;
  page: 'itinerary' | 'rsvp';
}

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

function FloralFlourish({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 240 240" fill="none" aria-hidden="true">
      <path d="M17 218C39 166 67 128 123 101C154 86 184 66 211 22" stroke="currentColor" strokeWidth="1.2" />
      <path d="M63 163C38 154 30 132 39 113C60 120 72 140 63 163Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M98 126C78 112 77 88 91 73C110 86 113 108 98 126Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M137 94C125 72 133 51 153 42C164 61 158 83 137 94Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M58 175C77 181 86 197 79 214C61 209 52 194 58 175Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="119" cy="102" r="4" fill="currentColor" />
      <path d="M113 102C95 91 96 73 111 65C124 77 124 92 113 102Z" stroke="currentColor" />
      <path d="M126 102C139 87 156 92 163 106C148 117 132 115 126 102Z" stroke="currentColor" />
      <path d="M119 109C131 121 126 139 112 144C101 130 105 115 119 109Z" stroke="currentColor" />
      <path d="M112 106C96 117 80 109 76 94C91 87 107 92 112 106Z" stroke="currentColor" />
    </svg>
  );
}

export function RsvpLantern() {
  return (
    <svg className="rsvp-hanging-lantern" viewBox="0 0 160 310" fill="none" aria-hidden="true">
      <defs><linearGradient id="lantern-brass" x1="33" y1="94" x2="128" y2="247" gradientUnits="userSpaceOnUse"><stop stopColor="#8d6636" /><stop offset=".35" stopColor="#e7c887" /><stop offset=".66" stopColor="#b88949" /><stop offset="1" stopColor="#76502d" /></linearGradient><radialGradient id="lantern-light" cx="0" cy="0" r="1" gradientTransform="translate(80 189) rotate(90) scale(66 38)"><stop stopColor="#fff9dc" stopOpacity=".88" /><stop offset="1" stopColor="#d99e4c" stopOpacity=".18" /></radialGradient><filter id="lantern-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" /></filter></defs>
      <path d="M80 0V63M71 15H89M69 37H91" stroke="#9a7040" strokeWidth="1.25" /><path d="M80 0C72 8 72 17 80 24C88 17 88 8 80 0Z" fill="#c49a5a" opacity=".82" /><path d="M56 76L80 54L104 76" stroke="url(#lantern-brass)" strokeWidth="5" strokeLinejoin="round" /><path d="M61 76H99L108 103H52L61 76Z" fill="url(#lantern-brass)" stroke="#845d32" strokeWidth="1.2" />
      <path d="M52 103H108L118 132V238L104 261H56L42 238V132L52 103Z" fill="url(#lantern-brass)" stroke="#7a5430" strokeWidth="1.5" /><ellipse cx="80" cy="190" rx="30" ry="59" fill="url(#lantern-light)" filter="url(#lantern-glow)" opacity=".6" /><path d="M55 119H105V236H55V119Z" fill="url(#lantern-light)" stroke="#714b28" strokeWidth="2" /><path d="M68 119V236M92 119V236M55 151H105M55 202H105" stroke="#80582f" strokeWidth="2" /><path d="M61 143L80 128L99 143M61 178L80 163L99 178M61 220L80 205L99 220" stroke="#f1d393" strokeOpacity=".72" strokeWidth="1" />
      <path d="M42 132H118M45 240H115L102 263H58L45 240Z" fill="url(#lantern-brass)" stroke="#754f2a" strokeWidth="1.3" /><path d="M80 263V280M70 280H90" stroke="#9b7040" strokeWidth="2" strokeLinecap="round" /><path d="M80 280L74 292L80 302L86 292L80 280Z" fill="#b88748" /><circle cx="80" cy="178" r="4" fill="#fff6cd" /><circle cx="80" cy="178" r="10" fill="#ffd981" opacity=".28" />
    </svg>
  );
}

function RsvpCornerLines() {
  return <div className="rsvp-corner-lines" aria-hidden="true"><i className="rsvp-corner rsvp-corner-tl" /><i className="rsvp-corner rsvp-corner-tr" /><i className="rsvp-corner rsvp-corner-bl" /><i className="rsvp-corner rsvp-corner-br" /></div>;
}

export default function CelestialBackdrop({ butterflies = false, page }: CelestialBackdropProps) {
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    const updateOffset = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => setScrollOffset(window.scrollY));
    };
    window.addEventListener('scroll', updateOffset, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateOffset);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const options: ISourceOptions = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'bubble' },
        onClick: { enable: true, mode: 'push' },
        resize: { enable: true },
      },
      modes: {
        bubble: { distance: 110, duration: 1.2, opacity: 0.9, size: 7 },
        push: { quantity: 3 },
      },
    },
    particles: {
      color: { value: ['#b18a52', '#d4b77c', '#fff4d9'] },
      move: { enable: true, speed: 0.38, random: true, outModes: { default: 'out' } },
      number: { density: { enable: true }, value: 34 },
      opacity: { value: { min: 0.2, max: 0.62 }, animation: { enable: true, speed: 0.45, minimumValue: 0.16, sync: false } },
      shape: { type: 'char', options: { char: { value: ['✦', '✧', '·'], font: 'serif', style: '', weight: '400' } } },
      size: { value: { min: 2, max: 7 } },
    },
    detectRetina: true,
  }), []);

  return (
    <div className={`celestial-backdrop celestial-backdrop-${page}`} aria-hidden="true">
      <ParticlesProvider init={particlesInit}>
        <Particles id={`${page}-sparkles`} options={options} className="celestial-sparkles" style={{ transform: `translate3d(0, ${Math.min(scrollOffset * 0.045, 26)}px, 0)` }} />
      </ParticlesProvider>
      {page === 'itinerary' && <p className="celestial-arabic">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>}
      <div className="celestial-arch celestial-arch-left" />
      <div className="celestial-arch celestial-arch-right" />
      {page === 'rsvp' ? <RsvpCornerLines /> : <><FloralFlourish className="celestial-floral celestial-floral-top" /><FloralFlourish className="celestial-floral celestial-floral-bottom" /></>}
      {butterflies && <RealisticButterflies />}
    </div>
  );
}
