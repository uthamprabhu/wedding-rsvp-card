'use client';

/**
 * Fixed bottom-right music toggle button.
 *
 * The icon is driven by whether audio is *actually playing*, not by the
 * stored preference. If a browser blocks autoplay after a refresh, this
 * shows the muted icon — which is the truth — and a tap starts playback.
 */

import { useSyncExternalStore } from 'react';
import {
  getSnapshot,
  getServerSnapshot,
  subscribe,
  toggleMusic,
} from '@/lib/audio-player';

export default function MusicToggle() {
  const { playing } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={toggleMusic}
      className="music-toggle"
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      aria-pressed={playing}
      title={playing ? 'Music on' : 'Music off'}
    >
      {playing ? (
        /* Music note — playing */
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 18V6l12-2v12"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx="6"  cy="18" r="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ) : (
        /* Music note with mute slash */
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 18V6l12-2v12"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
            opacity="0.45"
          />
          <circle cx="6"  cy="18" r="3" stroke="currentColor" strokeWidth="1.6" opacity="0.45"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.6" opacity="0.45"/>
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
