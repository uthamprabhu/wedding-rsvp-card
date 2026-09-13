'use client';

import { useEffect, useRef } from 'react';

interface FluidBackgroundProps {
  className?: string;
  variant?: 'home' | 'itinerary' | 'rsvp';
}

interface FluidInstance {
  destroy?: () => void;
  pause?: () => void;
}

export default function FluidBackground({ className = '', variant = 'home' }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<FluidInstance | null>(null);

  // Different configs for each variant
  const getVariantConfig = () => {
    const baseConfig = {
      IMMEDIATE: true,
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
        // Gold/champagne - elegant and romantic
        return {
          ...baseConfig,
          DENSITY_DISSIPATION: 1.5,
          VELOCITY_DISSIPATION: 0.98,
          PRESSURE: 0.6,
          PRESSURE_ITERATIONS: 20,
          CURL: 25,
          SPLAT_RADIUS: 0.25,
          SPLAT_FORCE: 5000,
          COLOR_UPDATE_SPEED: 10,
          BLOOM_INTENSITY: 0.4,
          BLOOM_THRESHOLD: 0.6,
          BLOOM_SOFT_KNEE: 0.7,
          COLOR_PALETTE: [
            { r: 0.9, g: 0.75, b: 0.5 },   // Gold
            { r: 0.95, g: 0.85, b: 0.7 },  // Champagne
            { r: 0.85, g: 0.7, b: 0.55 },  // Warm gold
            { r: 0.92, g: 0.8, b: 0.65 },  // Light gold
            { r: 0.88, g: 0.73, b: 0.58 }, // Rose gold
          ],
        };

      case 'itinerary':
        // Softer pastels - dreamy timeline feel
        return {
          ...baseConfig,
          DENSITY_DISSIPATION: 2.0,
          VELOCITY_DISSIPATION: 0.95,
          PRESSURE: 0.5,
          PRESSURE_ITERATIONS: 18,
          CURL: 30,
          SPLAT_RADIUS: 0.3,
          SPLAT_FORCE: 4000,
          COLOR_UPDATE_SPEED: 8,
          BLOOM_INTENSITY: 0.5,
          BLOOM_THRESHOLD: 0.5,
          BLOOM_SOFT_KNEE: 0.8,
          COLOR_PALETTE: [
            { r: 0.9, g: 0.8, b: 0.7 },    // Soft peach
            { r: 0.85, g: 0.75, b: 0.85 }, // Lavender
            { r: 0.95, g: 0.9, b: 0.75 },  // Cream
            { r: 0.8, g: 0.85, b: 0.9 },   // Soft blue
            { r: 0.9, g: 0.85, b: 0.8 },   // Blush
          ],
        };

      case 'rsvp':
        // Vibrant celebration colors - excited energy
        return {
          ...baseConfig,
          DENSITY_DISSIPATION: 1.2,
          VELOCITY_DISSIPATION: 0.96,
          PRESSURE: 0.7,
          PRESSURE_ITERATIONS: 22,
          CURL: 20,
          SPLAT_RADIUS: 0.35,
          SPLAT_FORCE: 6000,
          COLOR_UPDATE_SPEED: 12,
          BLOOM_INTENSITY: 0.6,
          BLOOM_THRESHOLD: 0.55,
          BLOOM_SOFT_KNEE: 0.6,
          COLOR_PALETTE: [
            { r: 0.95, g: 0.6, b: 0.7 },   // Rose pink
            { r: 0.9, g: 0.75, b: 0.5 },   // Gold
            { r: 0.85, g: 0.55, b: 0.75 }, // Orchid
            { r: 0.95, g: 0.85, b: 0.6 },  // Warm gold
            { r: 0.9, g: 0.65, b: 0.65 },  // Coral
          ],
        };

      default:
        return baseConfig;
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check for WebGL support
    const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported, fluid simulation disabled');
      return;
    }

    // Dynamically import webgl-fluid to avoid SSR issues
    let isActive = true;
    import('webgl-fluid').then(({ default: WebGLFluid }) => {
      if (!canvasRef.current || !isActive) return;

      fluidRef.current = new WebGLFluid(canvasRef.current, getVariantConfig());

      console.log(`WebGL Fluid initialized (${variant}):`, fluidRef.current);
    }).catch(error => {
      console.warn('Failed to load webgl-fluid:', error);
    });

    return () => {
      isActive = false;
      if (fluidRef.current && typeof fluidRef.current.destroy === 'function') {
        fluidRef.current.destroy();
      }
    };
  }, [variant]);

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
    />
  );
}
