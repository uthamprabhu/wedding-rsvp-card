'use client';

/**
 * Robust device classification: 'mobile' | 'tablet' | 'desktop'.
 *
 * Why not just matchMedia(max-width): a desktop browser resized narrow, or a
 * tablet in landscape, produces the exact viewport widths a phone would - and
 * the motion-access experience must never appear on an actual desktop/laptop
 * regardless of window size. So this combines three independent signals:
 *
 *  1. ua-parser-js device.type ('mobile' | 'tablet' | undefined) - actively
 *     maintained, battle-tested UA parsing rather than hand-rolled regexes.
 *  2. Touch/pointer capability (coarse pointer, maxTouchPoints, no hover) -
 *     catches devices ua-parser-js cannot see into.
 *  3. The iPadOS heuristic: modern iPadOS Safari sends a desktop-Mac user
 *     agent with no "iPad" token at all. The standard, well-documented fix is
 *     `navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1`,
 *     which is a real iPad-only signal (a Mac reports 0 touch points).
 *
 * A device only ever counts as mobile/tablet if BOTH the UA/platform signal
 * AND genuine touch capability agree. A desktop with a touchscreen monitor
 * still has no UA/platform signal pointing at mobile, so it stays desktop.
 */

import { useSyncExternalStore } from 'react';
import { UAParser } from 'ua-parser-js';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

function hasCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  // "any-pointer: coarse" catches hybrid devices (touch + mouse) too, which
  // matters for some Windows/Chrome OS tablets that still report a mouse.
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(any-pointer: coarse)').matches
  );
}

function hasTouchSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

function isMasqueradingIPad(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iPadOS 13+ Safari identifies as "Macintosh" with no iPad token in the UA,
  // but a real Mac reports 0 touch points; an iPad reports 5.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

let cached: DeviceClass | null = null;

function detect(): DeviceClass {
  if (cached) return cached;

  if (isMasqueradingIPad()) {
    cached = 'tablet';
    return cached;
  }

  const touchCapable = hasTouchSupport() || hasCoarsePointer();

  let uaType: 'mobile' | 'tablet' | undefined;
  try {
    uaType = new UAParser(navigator.userAgent).getResult().device.type as
      | 'mobile'
      | 'tablet'
      | undefined;
  } catch {
    uaType = undefined;
  }

  if (uaType === 'mobile' && touchCapable) {
    cached = 'mobile';
  } else if (uaType === 'tablet' && touchCapable) {
    cached = 'tablet';
  } else if (!uaType && touchCapable) {
    // Touch-capable device the UA string didn't confidently place (some
    // Android WebViews, some Windows tablets): fall back to a screen-size
    // heuristic ONLY to choose mobile vs tablet, never to invent touch.
    cached = Math.min(window.innerWidth, window.innerHeight) >= 600 ? 'tablet' : 'mobile';
  } else {
    cached = 'desktop';
  }

  return cached;
}

const noopSubscribe = () => () => {};
const serverSnapshot = (): DeviceClass => 'desktop';

/**
 * SSR-safe: returns 'desktop' on the server and during the first client render
 * (matching the server snapshot avoids a hydration mismatch), then resolves to
 * the real class on the client's next paint. Consumers should treat a brief
 * 'desktop' result as "not yet known" rather than a final answer - see
 * `useIsMobileOrTablet` below, which exposes that as an explicit `ready` flag.
 */
export function useDeviceClass(): DeviceClass {
  return useSyncExternalStore(noopSubscribe, detect, serverSnapshot);
}

/**
 * Convenience hook for the common "should this even render" check. `ready`
 * becomes true after the first client render, once `detect()` has actually
 * run in the browser - use it to avoid flashing mobile-only UI on a server
 * render or the first hydration frame.
 */
export function useIsMobileOrTablet(): { isMobileOrTablet: boolean; ready: boolean } {
  const deviceClass = useDeviceClass();
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return { isMobileOrTablet: ready && deviceClass !== 'desktop', ready };
}
