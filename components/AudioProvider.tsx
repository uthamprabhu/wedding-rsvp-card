'use client';

import { useEffect } from 'react';
import { initAudio } from '@/lib/audio-player';
import MusicToggle from '@/components/MusicToggle';

export default function AudioProvider() {
  useEffect(() => {
    // initAudio creates the <audio> element, loads the stored preference,
    // attempts immediate play (works on many Android/desktop browsers), and
    // registers its own capture-phase gesture listeners to retry if blocked.
    initAudio();
    // initAudio is idempotent — calling it on re-renders or strict-mode
    // double-invocation is safe because all state lives at module scope.
  }, []);

  return <MusicToggle />;
}
