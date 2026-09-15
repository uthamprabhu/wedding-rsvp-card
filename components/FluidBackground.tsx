'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { FluidConfig as WebGLFluidConfig } from 'webgl-fluid';

interface FluidBackgroundProps {
  className?: string;
  variant?: 'home' | 'itinerary';
  forwardPagePointer?: boolean;
}

interface FluidInstance {
  destroy?: () => void;
  pause?: () => void;
}

type FluidColor = { r: number; g: number; b: number };
type ActiveFluidConfig = WebGLFluidConfig & { SPLAT_COLOR?: FluidColor };

// Gold remains the visual lead; the three accents arrive only occasionally so
// the interaction feels richer without becoming a rainbow effect.
const fluidColors: FluidColor[] = [
  { r: 1, g: 0.62, b: 0.28 },
  { r: 1, g: 0.62, b: 0.28 },
  { r: 1, g: 0.62, b: 0.28 },
  { r: 0.94, g: 0.39, b: 0.16 },
  { r: 0.72, g: 0.24, b: 0.24 },
  { r: 0.26, g: 0.48, b: 0.36 },
];

export default function FluidBackground({ className = '', variant = 'home', forwardPagePointer = false }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<FluidInstance | null>(null);
  const fluidConfigRef = useRef<ActiveFluidConfig | null>(null);

  // Different configs for each variant
  const getVariantConfig = useCallback((): ActiveFluidConfig => {
    const baseConfig = {
      IMMEDIATE: true,
      AUTO: false,
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 512,
      CAPTURE_RESOLUTION: 512,
      SHADING: true,
      COLORFUL: true,
      PAUSED: false,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      TRANSPARENT: true,
      BLOOM: true,
      BLOOM_ITERATIONS: 8,
      BLOOM_RESOLUTION: 256,
      SUNRAYS: false,
    };

    switch (variant) {
      case 'home':
        // Keep the opening exactly as its original colourful fluid experience.
        // With no fixed splat colour, webgl-fluid generates its own rich hues.
        return {
          ...baseConfig,
          DENSITY_DISSIPATION: 1.5,
          VELOCITY_DISSIPATION: 0.98,
          PRESSURE: 0.6,
          PRESSURE_ITERATIONS: 20,
          CURL: 25,
          SPLAT_RADIUS: 0.25,
          SPLAT_FORCE: 5000,
          COLORFUL: true,
          COLOR_UPDATE_SPEED: 10,
          BLOOM_INTENSITY: 0.4,
          BLOOM_THRESHOLD: 0.6,
          BLOOM_SOFT_KNEE: 0.7,
        };

      case 'itinerary':
        // The itinerary shares home interaction behaviour, but its gold-led
        // palette is deliberately calmer and has a thinner interaction trail.
        return {
          ...baseConfig,
          DENSITY_DISSIPATION: 1.1,
          VELOCITY_DISSIPATION: 0.3,
          PRESSURE: 0.6,
          PRESSURE_ITERATIONS: 20,
          CURL: 25,
          SPLAT_RADIUS: 0.105,
          SPLAT_FORCE: 3600,
          SPLAT_COUNT: 5,
          SPLAT_COLOR: { r: 1, g: 0.62, b: 0.28 },
          COLORFUL: false,
          BLOOM_INTENSITY: 0.32,
          BLOOM_THRESHOLD: 0.6,
          BLOOM_SOFT_KNEE: 0.7,
        };

      default:
        return baseConfig;
    }
  }, [variant]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check for WebGL support
    const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
    if (!gl) {
      return;
    }

    // Dynamically import webgl-fluid to avoid SSR issues
    let isActive = true;
    import('webgl-fluid').then(({ default: WebGLFluid }) => {
      if (!canvasRef.current || !isActive) return;

      const fluidConfig = getVariantConfig();
      fluidConfigRef.current = fluidConfig;
      fluidRef.current = new WebGLFluid(canvasRef.current, fluidConfig);
    }).catch(() => {
      // Fluid simulation unavailable - fallback to static background
    });

    return () => {
      isActive = false;
      if (fluidRef.current && typeof fluidRef.current.destroy === 'function') {
        fluidRef.current.destroy();
      }
      fluidConfigRef.current = null;
    };
  }, [getVariantConfig, variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (variant !== 'itinerary') return;

    let colorIndex = 0;
    let lastColorChange = 0;
    const tintNextTrail = () => {
      const now = performance.now();
      if (now - lastColorChange < 140) return;
      lastColorChange = now;
      colorIndex = (colorIndex + 1) % fluidColors.length;
      const target = fluidConfigRef.current?.SPLAT_COLOR;
      if (target) Object.assign(target, fluidColors[colorIndex]);
    };

    // Capture phase runs before webgl-fluid's handler, so each new trail gets
    // its colour before the simulation paints it.
    canvas.addEventListener('mousemove', tintNextTrail, true);
    canvas.addEventListener('touchmove', tintNextTrail, true);
    return () => {
      canvas.removeEventListener('mousemove', tintNextTrail, true);
      canvas.removeEventListener('touchmove', tintNextTrail, true);
    };
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!forwardPagePointer || !canvas) return;

    let frame = 0;
    let latestPoint: { x: number; y: number } | undefined;
    const forward = () => {
      frame = 0;
      if (!latestPoint) return;
      canvas.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: false,
        clientX: latestPoint.x,
        clientY: latestPoint.y,
      }));
    };
    const queuePoint = (x: number, y: number) => {
      latestPoint = { x, y };
      if (!frame) frame = window.requestAnimationFrame(forward);
    };
    const onMouseMove = (event: MouseEvent) => queuePoint(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) queuePoint(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [forwardPagePointer]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      if (fluidRef.current) {
        // Pause fluid simulation if user prefers reduced motion
        if (mediaQuery.matches && typeof fluidRef.current.pause === 'function') {
          fluidRef.current.pause();
        }
      }
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ 
        touchAction: 'none',
        zIndex: 5, // Between paper background and hero
      }}
      aria-hidden="true"
    />
  );
}
