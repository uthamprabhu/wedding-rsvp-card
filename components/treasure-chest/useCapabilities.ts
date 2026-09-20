'use client';

/**
 * Device capability reads for the chest hero.
 *
 * These are all *external* browser values, so they go through
 * `useSyncExternalStore` rather than a setState-in-effect. Expensive probes
 * (WebGL context creation) are memoised at module scope so the snapshot getter
 * stays cheap and returns a stable value.
 */

import { useSyncExternalStore } from 'react';
import type { ChestQuality } from './chestTextures';

/* ---------------------------- media queries ---------------------------- */

interface MediaStore {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => boolean;
}

const mediaStores = new Map<string, MediaStore>();

function mediaStore(query: string): MediaStore {
  let store = mediaStores.get(query);
  if (!store) {
    store = {
      subscribe: (cb: () => void) => {
        const mq = window.matchMedia(query);
        mq.addEventListener('change', cb);
        return () => mq.removeEventListener('change', cb);
      },
      getSnapshot: () => window.matchMedia(query).matches,
    };
    mediaStores.set(query, store);
  }
  return store;
}

const serverFalse = () => false;

export function useMediaQuery(query: string): boolean {
  const store = mediaStore(query);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, serverFalse);
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const useIsTouch = () => useMediaQuery('(hover: none)');

/* ------------------------------- WebGL -------------------------------- */

let webglCache: boolean | null = null;

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    if (!gl) return false;

    // A software rasteriser can report WebGL but will never hold 60fps, so it
    // is treated as unsupported and routed to the CSS fallback instead.
    const ctx = gl as WebGLRenderingContext;
    const debug = ctx.getExtension('WEBGL_debug_renderer_info');
    if (debug) {
      const renderer = String(
        ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? '',
      ).toLowerCase();
      if (renderer.includes('swiftshader') || renderer.includes('software')) return false;
    }
    // release the probe context promptly
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function getWebGL(): boolean {
  if (webglCache === null) webglCache = probeWebGL();
  return webglCache;
}

const noopSubscribe = () => () => {};

export function useWebGLSupport(): boolean {
  return useSyncExternalStore(noopSubscribe, getWebGL, serverFalse);
}

/* ------------------------------- quality ------------------------------- */

let qualityCache: ChestQuality | null = null;

function getQuality(): ChestQuality {
  if (qualityCache) return qualityCache;
  const cores = navigator.hardwareConcurrency ?? 4;
  const isTouch = window.matchMedia('(hover: none)').matches;
  qualityCache = !isTouch
    ? cores >= 4
      ? 'high'
      : 'low'
    : // Capable phones still get the finer texture set and real shadow maps;
      // everything else stays lean so 60fps is never at risk.
      cores >= 8 && window.devicePixelRatio <= 3
      ? 'high'
      : 'low';
  return qualityCache;
}

const serverQuality = (): ChestQuality => 'low';

export function useChestQuality(): ChestQuality {
  return useSyncExternalStore(noopSubscribe, getQuality, serverQuality);
}

/* --------------------------- motion sensor ---------------------------- */

// Motion access is shared with the RSVP / itinerary lantern, so it lives in one
// place rather than being detected twice. See lib/motion-access.ts.
export {
  useMotionStatus,
  useMotionAskNeeded,
  requestMotionAccess,
  declineMotion,
} from '@/lib/motion-access';
export type { MotionStatus } from '@/lib/motion-access';

/* --------------------------- device class ------------------------------ */

// Robust mobile/tablet/desktop classification (UA + touch capability), shared
// with the same call sites. See lib/device.ts.
export { useDeviceClass } from '@/lib/device';
export type { DeviceClass } from '@/lib/device';
