'use client';

/**
 * Hero treasure chest: capability detection, interaction and accessibility.
 *
 * Everything WebGL lives behind a dynamic import so the landing page is never
 * blocked by the 3D bundle, and a device without usable WebGL does not download
 * it at all - it gets the CSS-3D fallback instead.
 */

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { createChestRuntime } from './chestRuntime';
import {
  declineMotion,
  requestMotionAccess,
  useChestQuality,
  useDeviceClass,
  useMotionAskNeeded,
  useMotionStatus,
  useReducedMotion,
  useWebGLSupport,
} from './useCapabilities';
import { useDeviceShake } from './useDeviceShake';
import { useChestAudio } from './useChestAudio';
import TreasureChestFallback from './TreasureChestFallback';
import MotionUnlockSheet from './MotionUnlockSheet';

const loadScene = () => import('./TreasureChestScene');
const TreasureChestScene = dynamic(loadScene, { ssr: false, loading: () => null });

/** Ignore a pointer release that travelled far enough to be a drag or scroll. */
const TAP_SLOP = 14;

interface Props {
  /** Called once the logo has settled; hands control back to the page. */
  onOpen: () => void;
}

export default function TreasureChest({ onOpen }: Props) {
  const webgl = useWebGLSupport();
  const quality = useChestQuality();
  const reducedMotion = useReducedMotion();
  const motionStatus = useMotionStatus();
  const deviceClass = useDeviceClass();
  const isMobileOrTablet = deviceClass !== 'desktop';
  // Robust replacement for the old `hover: none` viewport check: whether the
  // unlock sheet is genuinely owed right now (mobile/tablet, sensor exists,
  // gated by iOS, and the guest has not chosen yet).
  const askNeeded = useMotionAskNeeded();

  const [open, setOpen] = useState(false);
  // Closes the sheet the instant a button is pressed, without waiting for the
  // async permission round-trip (enableMotion) or the storage-listener replay
  // (declineMotion) to flip `askNeeded`. Set only from direct event handlers,
  // never from an effect, so no derived-state/cascading-render lint issue.
  const [dismissed, setDismissed] = useState(false);

  const runtimeRef = useRef(createChestRuntime(false));
  const handedOff = useRef(false);
  const { playLatch, playOpen } = useChestAudio();

  // Keep the animation runtime in step with the reduced-motion preference.
  useEffect(() => {
    runtimeRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  // Warm the 3D chunk while the existing wedding loader is still on screen.
  useEffect(() => {
    if (webgl) void loadScene();
  }, [webgl]);

  /* -------------------------------- opening ------------------------------- */
  const handleOpen = useCallback(() => {
    const runtime = runtimeRef.current;
    if (runtime.open) return;
    runtime.open = true;
    setOpen(true);
    playLatch();
    window.setTimeout(playOpen, reducedMotion ? 40 : 150);
  }, [playLatch, playOpen, reducedMotion]);

  const handleCompleted = useCallback(() => {
    if (handedOff.current) return;
    handedOff.current = true;
    onOpen();
  }, [onOpen]);

  /* ---------------------------- shake gesture ----------------------------- */
  const shakeLive = motionStatus === 'open' || motionStatus === 'granted';
  useDeviceShake({ onShake: handleOpen, enabled: !open && shakeLive });

  // Sheet visibility is derived, not stored: it is owed whenever the guest has
  // not chosen yet, minus an immediate local override once a button is pressed
  // (so it closes instantly rather than waiting on the permission round-trip).
  const sheetOpen = askNeeded && !dismissed && !open;

  // This is the single motion ask for the whole invitation: the lantern on the
  // RSVP and itinerary screens inherits the answer and stays silent.
  const enableMotion = useCallback(async () => {
    setDismissed(true);
    await requestMotionAccess();
  }, []);

  const dismissMotion = useCallback(() => {
    setDismissed(true);
    declineMotion();
  }, []);

  // Chest UI must be mutually exclusive: exactly one of "shake" or "tap" is
  // ever shown, and never both. Mobile/tablet with a live sensor -> shake.
  // Everything else (desktop, or mobile/tablet that declined/has no sensor)
  // -> tap. The sheet itself only ever appears on mobile/tablet.
  const shakeHintable = isMobileOrTablet && shakeLive;

  /* --------------------------- pointer handling --------------------------- */
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    runtimeRef.current.pressed = true;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const start = pointerStart.current;
    if (!start || start.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP) {
      pointerStart.current = null;
      runtimeRef.current.pressed = false;
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pointerStart.current;
      runtimeRef.current.pressed = false;
      pointerStart.current = null;
      if (!start || start.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP) return;
      handleOpen();
    },
    [handleOpen],
  );

  const onPointerCancel = useCallback(() => {
    pointerStart.current = null;
    runtimeRef.current.pressed = false;
  }, []);

  const onPointerEnter = useCallback(() => {
    runtimeRef.current.hovered = true;
  }, []);

  const onPointerLeave = useCallback(() => {
    const runtime = runtimeRef.current;
    runtime.hovered = false;
    runtime.pressed = false;
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      e.preventDefault();
      handleOpen();
    },
    [handleOpen],
  );

  return (
    <div className="chest-stage">
      <div
        className={`chest-hit${open ? ' is-open' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open the wedding invitation"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
      >
        {webgl ? (
          <TreasureChestScene
            runtimeRef={runtimeRef}
            quality={quality}
            boosted={open}
            reducedMotion={reducedMotion}
            onCompleted={handleCompleted}
          />
        ) : (
          <TreasureChestFallback
            open={open}
            reducedMotion={reducedMotion}
            onCompleted={handleCompleted}
          />
        )}
      </div>

      {/* Mutually exclusive by construction: shakeHintable and the tap hint
          can never both be true, so "shake to open" and "tap to open" never
          appear together (requirement #8). */}
      <div className={`chest-caption${open ? ' is-hidden' : ''}`}>
        <p className="chest-hint">
          {open
            ? 'Opening your invitation'
            : shakeHintable
              ? 'Shake gently to open'
              : 'Tap the chest to open the invitation'}
        </p>

        {shakeHintable ? (
          <Sparkles className="chest-chevron" size={16} strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <ChevronDown className="chest-chevron" size={18} strokeWidth={1.5} aria-hidden="true" />
        )}
      </div>

      {/* The one motion ask for the whole invitation. Never blocks the chest:
          tap still opens it underneath, and "Not Now" is remembered so nobody
          is asked again. Mobile/tablet only - desktop never mounts this. */}
      {isMobileOrTablet && (
        <MotionUnlockSheet
          open={sheetOpen}
          onEnable={() => void enableMotion()}
          onDismiss={dismissMotion}
        />
      )}
    </div>
  );
}
