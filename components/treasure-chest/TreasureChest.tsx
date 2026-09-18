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
  requestMotionPermission,
  useChestQuality,
  useIsTouch,
  useMotionSupport,
  useReducedMotion,
  useWebGLSupport,
} from './useCapabilities';
import { useDeviceShake } from './useDeviceShake';
import { useChestAudio } from './useChestAudio';
import TreasureChestFallback from './TreasureChestFallback';

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
  const motion = useMotionSupport();
  const isTouch = useIsTouch();

  const [open, setOpen] = useState(false);
  const [shakeArmed, setShakeArmed] = useState(false);

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
  useDeviceShake({ onShake: handleOpen, enabled: !open });

  const enableShake = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    const granted = await requestMotionPermission();
    setShakeArmed(granted);
  }, []);

  // Only mention shaking on a touch device: desktop Chrome exposes
  // DeviceMotionEvent even with no accelerometer behind it. The opt-in appears
  // only where a permission prompt is genuinely required (iOS Safari); on
  // Android the gesture already works with no prompt at all.
  const canShake = isTouch && motion.available;
  const needsOptIn = canShake && motion.needsPermission && !shakeArmed;
  const shakeReady = canShake && (!motion.needsPermission || shakeArmed);

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

      <div className={`chest-caption${open ? ' is-hidden' : ''}`}>
        <p className="chest-hint">
          {open ? 'Opening your invitation' : 'Tap the chest to open the invitation'}
        </p>

        {needsOptIn ? (
          <button type="button" className="chest-shake-optin" onClick={enableShake}>
            <Sparkles size={13} aria-hidden="true" />
            <span>or shake your phone</span>
          </button>
        ) : shakeReady ? (
          <p className="chest-shake-ready">
            <Sparkles size={13} aria-hidden="true" />
            <span>or shake your phone</span>
          </p>
        ) : (
          <ChevronDown className="chest-chevron" size={18} strokeWidth={1.5} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
