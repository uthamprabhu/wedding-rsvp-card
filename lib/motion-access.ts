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
 * Two layers of state, kept deliberately separate:
 *
 *  1. The guest's PREFERENCE, persisted in localStorage: 'unset' | 'enabled' |
 *     'disabled'. This is what task requirements #6 asks for by name, and it
 *     is the only thing that decides whether the unlock sheet appears again.
 *  2. The underlying SENSOR status, derived fresh every time from the browser:
 *     whether a permission API exists at all, and whether it is gated
 *     (iOS/iPadOS) or open (Android, desktop-with-sensor, etc). This is never
 *     persisted, because permission state can change between visits (a guest
 *     can revoke it in iOS Settings) and the code must not assume yesterday's
 *     grant still holds.
 *
 * `useMotionStatus()` below folds both layers into the single status the rest
 * of the app already consumes, so existing call sites did not need to change
 * shape - only the meaning of "granted" became more honest (see below).
 */

import { useCallback, useSyncExternalStore } from 'react';
import { useDeviceClass } from './device';

/** Bump this if the meaning of the stored value ever needs to change. */
const STORAGE_KEY = 'farzeen-motion-access-v2';

export type MotionPreference = 'unset' | 'enabled' | 'disabled';

export type MotionStatus =
  /** No sensor exists on this device/browser at all. */
  | 'unsupported'
  /** Sensor works with no permission prompt (Android, etc). */
  | 'open'
  /** iOS/iPadOS gate, guest has not chosen yet -> show the unlock sheet. */
  | 'needs-ask'
  /** iOS/iPadOS gate, guest said yes. */
  | 'granted'
  /** Guest said no, OR the device has no sensor worth asking about. */
  | 'declined';

interface GatedCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/* ------------------------------- storage -------------------------------- */

let preference: MotionPreference | null = null;
let preferenceLoaded = false;
const listeners = new Set<() => void>();

function readPreference(): MotionPreference {
  if (preferenceLoaded) return preference ?? 'unset';
  preferenceLoaded = true;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    preference = value === 'enabled' || value === 'disabled' ? value : 'unset';
  } catch {
    // Private mode / storage disabled: fall back to in-memory only, so the
    // guest is not re-asked on every re-render within the same visit.
    preference = 'unset';
  }
  return preference;
}

function writePreference(next: MotionPreference) {
  preference = next;
  preferenceLoaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* in-memory is enough for this visit */
  }
  listeners.forEach((l) => l());
}

/** Explicit, named accessor for requirement #6 ("unset / motion-enabled / motion-disabled"). */
export function getMotionPreference(): MotionPreference {
  return readPreference();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverPreference = (): MotionPreference => 'unset';

export function useMotionPreference(): MotionPreference {
  return useSyncExternalStore(subscribe, readPreference, serverPreference);
}

/* ----------------------------- capabilities ----------------------------- */

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

/**
 * The full status, folding the persisted preference and the live sensor
 * capability together. Desktop is excluded at the call site (see
 * `useMotionStatus`) rather than here, so this function stays a pure read of
 * "what can this browser do" and is easy to reason about on its own.
 */
function computeStatus(): MotionStatus {
  if (!hasMotionApi()) return 'unsupported';

  const pref = readPreference();
  if (pref === 'disabled') return 'declined';

  if (!isMotionGated()) return 'open'; // Android etc: nothing to grant, always live

  if (pref === 'enabled') return 'granted';
  return 'needs-ask';
}

const serverStatus = (): MotionStatus => 'unsupported';

/**
 * The status consumed by the chest and the lantern. Deliberately reports
 * 'unsupported' on desktop regardless of what the browser's sensor APIs claim
 * - a laptop with a gyroscope-capable Chromium build must never trigger any
 * motion UI, per the desktop-exclusion requirement.
 */
export function useMotionStatus(): MotionStatus {
  const deviceClass = useDeviceClass();
  const status = useSyncExternalStore(subscribe, computeStatus, serverStatus);
  return deviceClass === 'desktop' ? 'unsupported' : status;
}

/** Should the unlock sheet be offered right now? Desktop is never eligible. */
export function useMotionAskNeeded(): boolean {
  const deviceClass = useDeviceClass();
  const pref = useMotionPreference();
  const gated = useSyncExternalStore(subscribe, isMotionGated, () => false);
  const hasApi = useSyncExternalStore(subscribe, hasMotionApi, () => false);
  return deviceClass !== 'desktop' && hasApi && gated && pref === 'unset';
}

/* -------------------------------- actions -------------------------------- */

/**
 * MUST be called directly from a user gesture handler, with no `await` before
 * it, or iOS rejects the request outright.
 *
 * Both constructors are asked in the same tick: iOS treats them as a single
 * permission and shows one dialog, but requesting both means we are not
 * relying on that being true forever.
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

  if (pending.length === 0) {
    // Not gated on this platform: there is nothing to grant, motion is just live.
    writePreference('enabled');
    return true;
  }

  try {
    const results = await Promise.all(pending);
    const granted = results.every((r) => r === 'granted');
    writePreference(granted ? 'enabled' : 'disabled');
    return granted;
  } catch {
    // Safari throws when the call is not tied to a gesture. Never surface it.
    writePreference('disabled');
    return false;
  }
}

export function declineMotion() {
  writePreference('disabled');
}

/**
 * Forget a stored "enabled" so the guest can be asked again. Used when the
 * preference says yes but the sensor never actually delivers data, which
 * happens when iOS has not carried the grant across a fresh page load.
 */
export function forgetMotionGrant() {
  if (readPreference() !== 'enabled') return;
  preference = 'unset';
  preferenceLoaded = true;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Convenience hook mirroring `declineMotion` for components that prefer hooks. */
export function useDeclineMotion(): () => void {
  return useCallback(() => declineMotion(), []);
}
