'use client';

/**
 * Tiny synthesised chest SFX: a metallic latch tick and a soft wooden hinge
 * creak. Built with WebAudio oscillators/noise so it ships no audio files and
 * nothing is ever preloaded.
 *
 * Autoplay safe by construction: the AudioContext is created lazily inside the
 * tap handler, so it is always tied to a user gesture. Any failure is swallowed
 * because sound is purely decorative here.
 */

import { useCallback, useEffect, useRef } from 'react';

export function useChestAudio(muted = false) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    },
    [],
  );

  const ensure = useCallback(() => {
    if (muted || typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        ctxRef.current = new Ctor();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, [muted]);

  /** Short band-limited noise burst, used for both latch and creak. */
  const noise = useCallback(
    (
      ctx: AudioContext,
      at: number,
      duration: number,
      frequency: number,
      q: number,
      gain: number,
      type: BiquadFilterType = 'bandpass',
    ) => {
      const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;

      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, at);
      amp.gain.exponentialRampToValueAtTime(gain, at + 0.008);
      amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);

      src.connect(filter).connect(amp).connect(ctx.destination);
      src.start(at);
      src.stop(at + duration + 0.02);
    },
    [],
  );

  /** Metallic latch tick: two quick inharmonic partials. */
  const playLatch = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    noise(ctx, t, 0.045, 2600, 6, 0.06, 'highpass');
    [1840, 2670].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.82, t + 0.07);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(0.035 - i * 0.012, t + 0.006);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(amp).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    });
  }, [ensure, noise]);

  /** Soft wooden hinge: low body thump plus a slow filtered creak. */
  const playOpen = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const t = ctx.currentTime;

    // wooden body
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(128, t);
    osc.frequency.exponentialRampToValueAtTime(74, t + 0.3);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);

    // hinge creak sweeping upward as the lid travels
    const frames = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 9;
    filter.frequency.setValueAtTime(430, t + 0.04);
    filter.frequency.linearRampToValueAtTime(880, t + 0.42);
    const creak = ctx.createGain();
    creak.gain.setValueAtTime(0.0001, t + 0.04);
    creak.gain.linearRampToValueAtTime(0.02, t + 0.16);
    creak.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(filter).connect(creak).connect(ctx.destination);
    src.start(t + 0.04);
    src.stop(t + 0.54);
  }, [ensure]);

  return { playLatch, playOpen };
}
