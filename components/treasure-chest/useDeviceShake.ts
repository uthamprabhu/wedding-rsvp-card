'use client';

/**
 * Optional "shake the phone to open" gesture.
 *
 * Deliberately secondary: tap always works. The listener is attached whenever
 * the chest is closed, which is harmless everywhere - on the browsers that gate
 * motion access (iOS Safari 13+) the event simply never fires until permission
 * is granted, and permission is only ever requested from a real user gesture.
 * If the sensor is missing or the user declines, nothing breaks.
 */

import { useEffect, useRef } from 'react';

interface Options {
  /** Called once per deliberate shake. */
  onShake: () => void;
  /** Stop listening (e.g. once the chest is already open). */
  enabled?: boolean;
  /** Combined per-axis acceleration delta, in m/s^2, that counts as a shake. */
  threshold?: number;
  /** Ignore further shakes for this long, in ms. */
  cooldown?: number;
}

export function useDeviceShake({
  onShake,
  enabled = true,
  threshold = 22,
  cooldown = 1400,
}: Options) {
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      return;
    }

    let prevX = 0;
    let prevY = 0;
    let prevZ = 0;
    let prevT = 0;
    let primed = false;
    let hits = 0;
    let firedAt = 0;

    const handler = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;

      const now = event.timeStamp || performance.now();

      if (!primed) {
        prevX = a.x;
        prevY = a.y;
        prevZ = a.z;
        prevT = now;
        primed = true;
        return;
      }

      // Sample at ~50ms so we measure a gesture rather than sensor noise.
      if (now - prevT < 50) return;

      const delta =
        Math.abs(a.x - prevX) + Math.abs(a.y - prevY) + Math.abs(a.z - prevZ);
      prevX = a.x;
      prevY = a.y;
      prevZ = a.z;
      prevT = now;

      if (delta < threshold) {
        // Decay, so a single jolt while walking can never accumulate.
        hits = Math.max(0, hits - 1);
        return;
      }

      // Require two crossings in quick succession: a deliberate shake, not a bump.
      hits += 2;
      if (hits < 4) return;

      const t = performance.now();
      if (t - firedAt < cooldown) return;
      firedAt = t;
      hits = 0;
      onShakeRef.current();
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [enabled, threshold, cooldown]);
}
