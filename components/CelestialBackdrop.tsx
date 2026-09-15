'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

interface CelestialBackdropProps {
  page: 'itinerary' | 'rsvp';
}

const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

function PetalledFlower({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const petals = [0, 72, 144, 216, 288];
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {petals.map((rotation) => <ellipse key={rotation} cx="0" cy="-16" rx="9" ry="19" fill="#d4b16f" fillOpacity=".48" stroke="#b58b4f" strokeOpacity=".56" strokeWidth=".8" transform={`rotate(${rotation})`} />)}
    <circle r="9" fill="#b88a4d" fillOpacity=".92" />
    <circle r="4" fill="#f8e6bb" fillOpacity=".9" />
    <circle cx="-2" cy="-2" r="1.2" fill="#8d6636" />
    <circle cx="3" cy="2" r="1.2" fill="#8d6636" />
  </g>;
}

function CornerFloralCluster({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 300 300" fill="none" aria-hidden="true">
    <g stroke="#9b7543" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 281C64 205 105 165 162 128C207 99 239 62 276 13" strokeWidth="1.35" />
      <path d="M62 224C77 203 92 188 113 171M114 171C133 155 149 142 166 127M166 127C189 107 207 84 223 61" strokeWidth="1" strokeOpacity=".8" />
      <path d="M75 207C50 194 42 175 51 157C72 165 84 184 75 207Z" fill="#d5b778" fillOpacity=".24" strokeWidth=".9" />
      <path d="M126 159C108 144 108 125 122 112C139 125 140 144 126 159Z" fill="#d5b778" fillOpacity=".24" strokeWidth=".9" />
      <path d="M185 107C171 91 174 71 190 61C204 77 201 95 185 107Z" fill="#d5b778" fillOpacity=".24" strokeWidth=".9" />
      <path d="M42 248C28 242 23 229 30 218C43 224 49 237 42 248Z" fill="#d5b778" fillOpacity=".36" strokeWidth=".8" />
    </g>
    <PetalledFlower x={112} y={171} scale={1.02} />
    <PetalledFlower x={169} y={126} scale={.78} />
    <PetalledFlower x={223} y={61} scale={.58} />
    <g fill="#caa25e" fillOpacity=".8" stroke="#a57b43" strokeOpacity=".62" strokeWidth=".7">
      <path d="M58 217C49 205 52 194 62 189C71 200 68 211 58 217Z" />
      <path d="M38 224C31 213 34 204 43 200C51 210 48 220 38 224Z" />
      <path d="M190 61C185 50 189 42 197 39C203 49 200 58 190 61Z" />
    </g>
  </svg>;
}

export function RsvpLantern() {
  return (
    <svg className="rsvp-lantern-art" viewBox="0 0 160 310" fill="none" aria-hidden="true">
      <defs><linearGradient id="lantern-brass" x1="33" y1="94" x2="128" y2="247" gradientUnits="userSpaceOnUse"><stop stopColor="#8d6636" /><stop offset=".35" stopColor="#e7c887" /><stop offset=".66" stopColor="#b88949" /><stop offset="1" stopColor="#76502d" /></linearGradient><radialGradient id="lantern-light" cx="0" cy="0" r="1" gradientTransform="translate(80 189) rotate(90) scale(66 38)"><stop stopColor="#fff9dc" stopOpacity=".88" /><stop offset="1" stopColor="#d99e4c" stopOpacity=".18" /></radialGradient><filter id="lantern-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" /></filter></defs>
      <path d="M80 0V63M71 15H89M69 37H91" stroke="#9a7040" strokeWidth="1.25" /><path d="M80 0C72 8 72 17 80 24C88 17 88 8 80 0Z" fill="#c49a5a" opacity=".82" /><path d="M56 76L80 54L104 76" stroke="url(#lantern-brass)" strokeWidth="5" strokeLinejoin="round" /><path d="M61 76H99L108 103H52L61 76Z" fill="url(#lantern-brass)" stroke="#845d32" strokeWidth="1.2" />
      <path d="M52 103H108L118 132V238L104 261H56L42 238V132L52 103Z" fill="url(#lantern-brass)" stroke="#7a5430" strokeWidth="1.5" /><ellipse cx="80" cy="190" rx="30" ry="59" fill="url(#lantern-light)" filter="url(#lantern-glow)" opacity=".6" /><path d="M55 119H105V236H55V119Z" fill="url(#lantern-light)" stroke="#714b28" strokeWidth="2" /><path d="M68 119V236M92 119V236M55 151H105M55 202H105" stroke="#80582f" strokeWidth="2" /><path d="M61 143L80 128L99 143M61 178L80 163L99 178M61 220L80 205L99 220" stroke="#f1d393" strokeOpacity=".72" strokeWidth="1" />
      <path d="M42 132H118M45 240H115L102 263H58L45 240Z" fill="url(#lantern-brass)" stroke="#754f2a" strokeWidth="1.3" /><path d="M80 263V280M70 280H90" stroke="#9b7040" strokeWidth="2" strokeLinecap="round" /><path d="M80 280L74 292L80 302L86 292L80 280Z" fill="#b88748" /><circle cx="80" cy="178" r="4" fill="#fff6cd" /><circle cx="80" cy="178" r="10" fill="#ffd981" opacity=".28" />
    </svg>
  );
}

type OrientationPermissionApi = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const motionChoiceKey = 'farzeen-lantern-motion-choice';

export function AdaptiveLantern() {
  const lanternRef = useRef<HTMLDivElement>(null);
  const pendingTilt = useRef({ x: 0, y: 0, rotation: 0 });
  const animationFrame = useRef(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  const applyTilt = useCallback(() => {
    const lantern = lanternRef.current;
    if (!lantern) return;
    const { x, y, rotation } = pendingTilt.current;
    lantern.style.setProperty('--lantern-motion-x', `${x.toFixed(2)}px`);
    lantern.style.setProperty('--lantern-motion-y', `${y.toFixed(2)}px`);
    lantern.style.setProperty('--lantern-motion-rotate', `${rotation.toFixed(2)}deg`);
  }, []);

  const scheduleTilt = useCallback((x: number, y: number, rotation: number) => {
    pendingTilt.current = { x, y, rotation };
    if (animationFrame.current) return;
    animationFrame.current = window.requestAnimationFrame(() => {
      animationFrame.current = 0;
      applyTilt();
    });
  }, [applyTilt]);

  useEffect(() => {
    const supportsOrientation = typeof window.DeviceOrientationEvent !== 'undefined';
    const storedChoice = window.sessionStorage.getItem(motionChoiceKey);

    if (!supportsOrientation) {
      const pointerTilt = (event: PointerEvent) => {
        const x = (event.clientX / window.innerWidth - .5) * 7;
        const y = (event.clientY / window.innerHeight - .5) * 2;
        scheduleTilt(x, y, x * .72);
      };
      window.addEventListener('pointermove', pointerTilt, { passive: true });
      return () => {
        window.removeEventListener('pointermove', pointerTilt);
        if (animationFrame.current) window.cancelAnimationFrame(animationFrame.current);
      };
    }

    const stateFrame = window.requestAnimationFrame(() => {
      if (storedChoice === 'granted') setMotionEnabled(true);
      if (!storedChoice) setShowPrompt(true);
    });

    return () => {
      window.cancelAnimationFrame(stateFrame);
      if (animationFrame.current) window.cancelAnimationFrame(animationFrame.current);
    };
  }, [scheduleTilt]);

  useEffect(() => {
    if (!motionEnabled) return;
    const orientationTilt = (event: DeviceOrientationEvent) => {
      const gamma = Math.max(-40, Math.min(40, event.gamma ?? 0));
      const beta = Math.max(-40, Math.min(40, event.beta ?? 0));
      scheduleTilt(gamma * .12, beta * .035, gamma * .13);
    };
    window.addEventListener('deviceorientation', orientationTilt, { passive: true });
    return () => window.removeEventListener('deviceorientation', orientationTilt);
  }, [motionEnabled, scheduleTilt]);

  const enableMotion = async () => {
    const orientationApi = window.DeviceOrientationEvent as OrientationPermissionApi;
    try {
      if (typeof orientationApi.requestPermission === 'function') {
        const permission = await orientationApi.requestPermission();
        if (permission !== 'granted') throw new Error('Motion permission was denied.');
      }
      window.sessionStorage.setItem(motionChoiceKey, 'granted');
      setMotionEnabled(true);
      setShowPrompt(false);
    } catch {
      window.sessionStorage.setItem(motionChoiceKey, 'declined');
      setShowPrompt(false);
    }
  };

  const dismissPrompt = () => {
    window.sessionStorage.setItem(motionChoiceKey, 'declined');
    setShowPrompt(false);
  };

  return <>
    <div ref={lanternRef} className="lantern-motion-shell"><RsvpLantern /></div>
    {showPrompt && <motion.aside className="lantern-motion-permission" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }} aria-label="Lantern motion preference">
      <span className="lantern-motion-permission-gem">✦</span>
      <div><p>Bring the lantern to life</p><small>Allow gentle motion for a more immersive invitation.</small></div>
      <div className="lantern-motion-permission-actions"><button type="button" onClick={dismissPrompt}>Not now</button><button type="button" onClick={() => { void enableMotion(); }}>Enable motion</button></div>
    </motion.aside>}
  </>;
}

function RsvpCornerLines() {
  return <div className="rsvp-corner-lines" aria-hidden="true"><i className="rsvp-corner rsvp-corner-tl" /><i className="rsvp-corner rsvp-corner-tr" /><i className="rsvp-corner rsvp-corner-bl" /><i className="rsvp-corner rsvp-corner-br" /></div>;
}

export default function CelestialBackdrop({ page }: CelestialBackdropProps) {
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
      {page === 'itinerary' && <ParticlesProvider init={particlesInit}>
        <Particles id={`${page}-sparkles`} options={options} className="celestial-sparkles" />
      </ParticlesProvider>}
      <div className="celestial-arch celestial-arch-left" />
      <div className="celestial-arch celestial-arch-right" />
      {page === 'rsvp' ? <RsvpCornerLines /> : <><CornerFloralCluster className="itinerary-floral-cluster itinerary-floral-cluster-top" /><CornerFloralCluster className="itinerary-floral-cluster itinerary-floral-cluster-bottom" /></>}
    </div>
  );
}
