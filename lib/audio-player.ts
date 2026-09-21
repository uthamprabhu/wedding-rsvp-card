'use client';

/**
 * Singleton audio player for the wedding background music.
 *
 * The <audio> element lives at module scope so it survives client-side
 * navigation without ever being recreated or duplicated.
 *
 * ── Two distinct pieces of state ──────────────────────────────────────
 *  `enabled` — the user's *preference*, persisted to localStorage.
 *  `playing` — whether audio is *actually* coming out of the speakers,
 *              derived from real <audio> events, never assumed.
 *
 * Keeping these separate is the whole point. A browser can refuse to
 * autoplay while the preference is still ON, and in that case the toggle
 * button must show "muted", because that is the truth. Rendering the UI
 * from `enabled` alone is what made the button lie after a refresh.
 *
 * ── Autoplay strategy ────────────────────────────────────────────────
 *  1. Attempt play() on mount. Succeeds on Android Chrome and desktop
 *     browsers with relaxed autoplay policies.
 *  2. If blocked, capture-phase gesture listeners stay armed and retry on
 *     the first real interaction anywhere on the page. They are only
 *     removed once playback is *confirmed*, not merely attempted.
 *  3. visibilitychange retries when the tab regains focus, since some
 *     browsers suspend audio in background tabs.
 */

const STORAGE_KEY = 'farzeen-music-v2';
const AUDIO_SRC   = '/audio/main-audio.mp3';
const VOLUME      = 0.42;

type Listener = () => void;

export interface AudioSnapshot {
  /** User preference — what they asked for. */
  enabled: boolean;
  /** Reality — whether sound is actually playing right now. */
  playing: boolean;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
let audio: HTMLAudioElement | null = null;
let enabled = true; // default ON; overridden by initAudio from storage

/** Stable snapshot object — replaced only when values actually change, so
 *  useSyncExternalStore can rely on reference equality and skip renders. */
let snapshot: AudioSnapshot = { enabled: true, playing: false };

/** Must be a module constant: returning a fresh object from
 *  getServerSnapshot on every call would loop during hydration. */
const SERVER_SNAPSHOT: AudioSnapshot = { enabled: true, playing: false };

const listeners = new Set<Listener>();

function publish(next: Partial<AudioSnapshot>) {
  const merged: AudioSnapshot = {
    enabled: next.enabled ?? snapshot.enabled,
    playing: next.playing ?? snapshot.playing,
  };
  if (merged.enabled === snapshot.enabled && merged.playing === snapshot.playing) {
    return; // nothing changed — don't churn subscribers
  }
  snapshot = merged;
  listeners.forEach((l) => l());
}

/* ------------------------------------------------------------------ */
/* Audio element                                                       */
/* ------------------------------------------------------------------ */
function getAudio(): HTMLAudioElement {
  if (audio) return audio;

  audio = new Audio(AUDIO_SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = 'auto';

  /* Truth comes from the element itself, not from our intentions.
     `playing` fires when audio genuinely starts producing sound;
     `play` only means play() was called and may still be blocked. */
  audio.addEventListener('playing', () => publish({ playing: true }));
  audio.addEventListener('pause',   () => publish({ playing: false }));
  audio.addEventListener('ended',   () => publish({ playing: false }));
  audio.addEventListener('stalled', () => publish({ playing: false }));
  audio.addEventListener('error',   () => publish({ playing: false }));

  return audio;
}

/* ------------------------------------------------------------------ */
/* Gesture fallback                                                    */
/* ------------------------------------------------------------------ */
const GESTURE_EVENTS = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'] as const;

let gestureArmed = false;
let gestureHandler: (() => void) | null = null;

function disarmGestureListeners() {
  if (!gestureHandler) return;
  const h = gestureHandler;
  GESTURE_EVENTS.forEach((e) => document.removeEventListener(e, h, true));
  gestureHandler = null;
  gestureArmed = false;
}

/**
 * Arm capture-phase listeners that retry playback on the first real gesture.
 * Critically, they stay armed until playback actually succeeds — an earlier
 * version disarmed on the first gesture regardless of outcome, so a single
 * failed attempt permanently gave up.
 */
function armGestureListeners() {
  if (gestureArmed || typeof document === 'undefined') return;
  gestureArmed = true;

  const handler = () => {
    if (!enabled) {
      disarmGestureListeners();
      return;
    }
    const p = getAudio().play();
    if (p && typeof p.then === 'function') {
      p.then(() => disarmGestureListeners()).catch(() => {
        /* Still blocked — stay armed and try again on the next gesture. */
      });
    } else {
      disarmGestureListeners();
    }
  };

  gestureHandler = handler;
  GESTURE_EVENTS.forEach((e) =>
    document.addEventListener(e, handler, { capture: true, passive: true }),
  );
}

function tryPlay() {
  if (!enabled) return;
  const el = getAudio();

  const p = el.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      disarmGestureListeners();
    }).catch(() => {
      // Autoplay refused. Reflect the truth in the UI and wait for a gesture.
      publish({ playing: false });
      armGestureListeners();
    });
  }
}

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */
let initialized = false;

export function initAudio(): void {
  if (typeof window === 'undefined') return;

  if (initialized) {
    // Fresh page mount within the SPA — another chance to start if we were
    // previously blocked.
    if (enabled && getAudio().paused) {
      tryPlay();
      armGestureListeners();
    }
    return;
  }
  initialized = true;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  enabled = stored === null ? true : stored === 'true';

  const el = getAudio(); // create element so preload starts immediately
  publish({ enabled, playing: !el.paused });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && enabled && getAudio().paused) tryPlay();
  });

  // Attempt autoplay right away, and arm the gesture fallback in the same
  // breath rather than waiting for the promise to reject. On iOS the
  // rejection can land after the user has already tapped.
  tryPlay();
  armGestureListeners();
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Call synchronously from inside a real user-gesture handler to start playback.
 *
 * This is the primary way music actually begins on mobile. Autoplay on mount
 * is refused by Android Chrome and iOS Safari, and the shake-to-open gesture
 * on the landing chest fires `devicemotion`, which grants no user activation —
 * so without an explicit call from a tap/key handler there may be no qualifying
 * gesture for the entire visit.
 *
 * Must not be awaited or deferred by the caller: user activation is consumed at
 * the end of the current task, so `await something(); unlockAudio()` is too late.
 */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;

  // Defensive: if the provider's mount effect has not run yet, initialise now
  // so the stored on/off preference is respected rather than assumed.
  if (!initialized) {
    initAudio();
    return; // initAudio already attempts playback
  }

  if (!enabled) return; // guest chose silence — respect it

  const el = getAudio();
  if (!el.paused) return; // already playing

  const p = el.play();
  if (p && typeof p.then === 'function') {
    p.then(() => disarmGestureListeners()).catch(() => {
      // Still refused; leave the listeners armed for the next gesture.
      publish({ playing: false });
      armGestureListeners();
    });
  }
}

/**
 * Toggle based on what is *actually happening*, not on the stored
 * preference. If the preference says ON but autoplay was blocked, the
 * button reads "muted" — so a tap must start the music, not flip the
 * preference to OFF and appear to do nothing.
 */
export function toggleMusic(): void {
  if (typeof window === 'undefined') return;

  const el = getAudio();
  const actuallyPlaying = !el.paused;

  if (actuallyPlaying) {
    enabled = false;
    window.localStorage.setItem(STORAGE_KEY, 'false');
    el.pause();
    disarmGestureListeners();
    publish({ enabled, playing: false });
  } else {
    enabled = true;
    window.localStorage.setItem(STORAGE_KEY, 'true');
    publish({ enabled });
    // We are inside a genuine user gesture here, so this should succeed.
    const p = el.play();
    if (p && typeof p.then === 'function') {
      p.then(() => disarmGestureListeners()).catch(() => {
        publish({ playing: false });
        armGestureListeners();
      });
    }
  }
}

export function getSnapshot(): AudioSnapshot { return snapshot; }
export function getServerSnapshot(): AudioSnapshot { return SERVER_SNAPSHOT; }

/** Preference. */
export function isMusicEnabled(): boolean { return snapshot.enabled; }
/** Reality — use this to drive UI. */
export function isMusicPlaying(): boolean { return snapshot.playing; }

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
