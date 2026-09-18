'use client';

/**
 * Single source of truth for device-motion access, shared by the landing
 * treasure chest (shake to open) and the RSVP / itinerary lantern (tilt to
 * swing).
 *
 * Why one module: on iOS, motion and orientation are ONE underlying permission.
 * Asking twice for the same grant is the fastest way to get it denied, so the
 * chest asks once, the answer is remembered, and the lantern inherits it.
 *
 * Status meanings:
 *   unsupported - no sensor API at all (typical desktop) -> use pointer fallback
 *   open        - sensor works with no prompt (Android, Chrome OS, etc.)
 *   needs-ask   - iOS/iPadOS gate, guest has not answered yet -> show the card
 *   granted     - iOS gate, guest said yes
 *   declined    - iOS gate, guest said no -> never ask again
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'farzeen-motion-access';

type Choice = 'granted' | 'declined';
export type MotionStatus = 'unsupported' | 'open' | 'needs-ask' | 'granted' | 'declined';

interface GatedCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/* ------------------------------- storage ------------------------------- */

let choice: Choice | null = null;
let choiceLoaded = false;
const listeners = new Set<() => void>();

function readChoice(): Choice | null {
  if (choiceLoaded) return choice;
  choiceLoaded = true;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    choice = value === 'granted' || value === 'declined' ? value : null;
  } catch {
    // private mode / storage disabled: fall back to in-memory only
    choice = null;
  }
  return choice;
}

function writeChoice(next: Choice) {
  choice = next;
  choiceLoaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* in-memory is enough for this visit */
  }
  listeners.forEach((l) => l());
}

/* ----------------------------- capabilities ---------------------------- */

function ctor(name: 'DeviceOrientationEvent' | 'DeviceMotionEvent'): GatedCtor | undefined {
  if (typeof window === 'undefined' || !(name in window)) return undefined;
  return (window as unknown as Record<string, GatedCtor>)[name];
}

export function hasMotionApi(): boolean {
  return !!ctor('DeviceOrientationEvent') || !!ctor('DeviceMotionEvent');
}

/**
 * True only on iOS / iPadOS. The `DeviceOrientationEvent` *object* exists on
 * Android and on every desktop browser, so testing for that is what wrongly
 * shows a permission dialog to people who do not need one. The
 * `requestPermission` *function* on it is the Apple-only signal.
 */
export function isMotionGated(): boolean {
  return (
    typeof ctor('DeviceOrientationEvent')?.requestPermission === 'function' ||
    typeof ctor('DeviceMotionEvent')?.requestPermission === 'function'
  );
}

export function getMotionStatus(): MotionStatus {
  if (!hasMotionApi()) return 'unsupported';
  if (!isMotionGated()) return 'open';
  return readChoice() ?? 'needs-ask';
}

/* -------------------------------- actions ------------------------------ */

/**
 * MUST be called directly from a user gesture handler, with no `await` before
 * it, or iOS rejects the request outright.
 *
 * Both constructors are asked in the same tick: iOS treats them as a single
 * permission and shows one dialog, but requesting both means we are not relying
 * on that being true forever.
 */
export async function requestMotionAccess(): Promise<boolean> {
  const orientation = ctor('DeviceOrientationEvent');
  const motion = ctor('DeviceMotionEvent');

  const pending: Promise<'granted' | 'denied'>[] = [];
  if (typeof orientation?.requestPermission === 'function') {
    pending.push(orientation.requestPermission());
  }
  if (typeof motion?.requestPermission === 'function') {
    pending.push(motion.requestPermission());
  }
  if (pending.length === 0) return true; // not gated on this platform

  try {
    const results = await Promise.all(pending);
    const granted = results.every((r) => r === 'granted');
    writeChoice(granted ? 'granted' : 'declined');
    return granted;
  } catch {
    // Safari throws when the call is not tied to a gesture. Never surface it.
    writeChoice('declined');
    return false;
  }
}

export function declineMotion() {
  writeChoice('declined');
}

/**
 * Forget a stored "granted" so the guest can be asked again. Used when the flag
 * says yes but the sensor never actually delivers data, which happens when iOS
 * has not carried the grant across a fresh page load.
 */
export function forgetMotionGrant() {
  if (readChoice() !== 'granted') return;
  choice = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/* --------------------------------- hook -------------------------------- */

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverStatus = (): MotionStatus => 'unsupported';

export function useMotionStatus(): MotionStatus {
  return useSyncExternalStore(subscribe, getMotionStatus, serverStatus);
}
