/**
 * Mutable state shared between the chest, the logo and the sparkles.
 *
 * Deliberately a plain object held in a ref rather than React state: the
 * animation reads it every frame inside `useFrame`, and writing to React state
 * per frame is the single biggest cause of jank in react-three-fiber scenes.
 */

export interface ChestRuntime {
  /** Latched open by tap / keyboard / shake. */
  open: boolean;
  /** Scene clock time (seconds) at which opening began, -1 while closed. */
  openAt: number;
  hovered: boolean;
  pressed: boolean;
  reducedMotion: boolean;
  /** Set once the full reveal has finished so the page can hand over. */
  completed: boolean;
}

export function createChestRuntime(reducedMotion: boolean): ChestRuntime {
  return {
    open: false,
    openAt: -1,
    hovered: false,
    pressed: false,
    reducedMotion,
    completed: false,
  };
}

/** Choreography, in seconds relative to `openAt`. */
export const TIMING = {
  latch: 0.0,
  lidStart: 0.16,
  glowStart: 0.2,
  logoRise: 0.44,
  logoClear: 1.08,
  logoSettle: 1.86,
  done: 2.1,
} as const;

/** Reduced-motion choreography: same beats, much shorter. */
export const TIMING_REDUCED = {
  latch: 0.0,
  lidStart: 0.05,
  glowStart: 0.06,
  logoRise: 0.18,
  logoClear: 0.42,
  logoSettle: 0.7,
  done: 0.85,
} as const;
