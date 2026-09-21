'use client';

/**
 * WebGL scene for the hero chest.
 *
 * Performance model (mobile first, target 60fps, never more):
 *  - `frameloop="demand"` plus a rate-limited driver: 30fps while the chest is
 *    idle, 60fps only during the opening. Rendering stops when the tab hides.
 *  - one static 64px Lightformer environment (`frames={1}`) instead of an HDR
 *    download, which is what makes the brass read as metal.
 *  - `PerformanceMonitor` drops device pixel ratio on weak GPUs.
 *  - shadow maps and the higher-resolution texture set are gated behind a
 *    device quality check; low-end devices get the procedural contact shadow.
 *  - the canvas keeps its alpha so the hero's #3A0712 comes straight from CSS.
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import ChestModel from './ChestModel';
import LogoReveal from './LogoReveal';
import { CHEST } from './chestGeometry';
import { createChestTextures, type ChestQuality } from './chestTextures';
import type { ChestRuntime } from './chestRuntime';

/** Slight three-quarter turn so the chest reads as a solid object with depth. */
const CHEST_TURN = -0.4;
const BASE_Y = -(CHEST.H + CHEST.R) / 2;

interface Props {
  runtimeRef: RefObject<ChestRuntime>;
  quality: ChestQuality;
  /** Raised to 60fps while the reveal plays. */
  boosted: boolean;
  reducedMotion: boolean;
  onCompleted: () => void;
  /** Fired once the WebGL context exists, so the loader can be dismissed. */
  onReady?: () => void;
}

/* ------------------------------------------------------------------ *
 * Rate-limited render driver
 * ------------------------------------------------------------------ */

/**
 * Drives `frameloop="demand"` at a deliberate rate and watches for sustained
 * overrun.
 *
 * drei's PerformanceMonitor is not usable here: it judges against a ~50-60fps
 * baseline and would read the intentional 30fps idle cap as a failing GPU. This
 * measures the gap between frames against *our* target instead, so a genuinely
 * struggling device is detected while a healthy capped one is left alone.
 */
function RenderDriver({ fps, onSlow }: { fps: number; onSlow: () => void }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const interval = 1000 / fps;
    let raf = 0;
    let stopped = false;
    let last = 0;
    let warmup = 0;
    let slow = 0;
    let reported = false;

    const tick = (t: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);

      // Nothing is visible, so nothing is worth rendering.
      if (document.hidden) {
        last = t;
        return;
      }
      const gap = t - last;
      if (gap < interval - 1) return;
      last = t;
      invalidate();

      if (reported || warmup++ < 15) return;
      // A device that cannot hold the target will keep overshooting the gap.
      slow = gap > interval * 1.7 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 12) {
        reported = true;
        onSlow();
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [fps, invalidate, onSlow]);

  return null;
}

/* ------------------------------------------------------------------ *
 * Responsive fit
 * ------------------------------------------------------------------ */

/**
 * Horizontal footprint: chest width (CHEST.W = 2.0) plus a little side margin.
 */
const SPAN_X = 2.15;

/**
 * Vertical envelope of the *entire reveal*, in chest-local units — not just the
 * closed chest.
 *
 *   logo crown   ≈ Y_CLEAR (2.0) + half the logo plane at settle scale (~0.81)
 *                  − the align offset (0.825)               →  about +2.0
 *   sunken floor ≈ align offset (−0.825) − the settle descent (−0.9)
 *                                                            →  about −1.73
 *
 * so the reveal needs roughly 3.8 units end to end.
 *
 * This previously budgeted 1.75 — the height of the closed chest alone. A WebGL
 * canvas cannot draw outside its own bounds, so the lid swing, the rising logo
 * and the chest's descent were all rendered past the frustum edge and simply
 * never seen. Sizing to the full envelope keeps every beat on screen, and as a
 * bonus the chest covers fewer fragments, so it is marginally *cheaper* to
 * shade rather than more expensive.
 */
const SPAN_Y = 3.8;

function useFitScale() {
  const viewport = useThree((s) => s.viewport);
  return useMemo(() => {
    // Width still guards narrow phones so the chest never kisses the edges.
    const byWidth = (viewport.width * 0.82) / SPAN_X;
    // Height budgets for the whole animation, not just the resting chest.
    const byHeight = (viewport.height * 0.94) / SPAN_Y;
    // Floor lowered from 0.4: the taller budget legitimately lands below it on
    // short landscape viewports, and clamping there would reintroduce clipping.
    return THREE.MathUtils.clamp(Math.min(byWidth, byHeight), 0.3, 1.15);
  }, [viewport.width, viewport.height]);
}

/* ------------------------------------------------------------------ *
 * Scene contents
 * ------------------------------------------------------------------ */

function SceneContents({
  runtimeRef,
  quality,
  onCompleted,
}: {
  runtimeRef: RefObject<ChestRuntime>;
  quality: ChestQuality;
  onCompleted: () => void;
}) {
  const scale = useFitScale();
  const alignRef = useRef<THREE.Group>(null);
  const castShadows = quality === 'high';

  // One procedural texture set for the whole feature: chest, contact shadow and
  // the logo halo all read from it, so generation happens exactly once.
  const tex = useMemo(() => createChestTextures(quality), [quality]);
  useEffect(() => () => tex.dispose(), [tex]);

  const shadowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex.shadowMap,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        color: new THREE.Color(0x14030a),
        blending: THREE.NormalBlending,
      }),
    [tex],
  );
  useEffect(() => () => shadowMat.dispose(), [shadowMat]);

  const firedRef = useRef(false);
  useFrame(() => {
    if (runtimeRef.current?.completed && !firedRef.current) {
      firedRef.current = true;
      onCompleted();
    }
  });

  return (
    <>
      {/* ---------------------------- lighting ---------------------------- */}
      <ambientLight intensity={0.5} color="#f0d8c0" />
      {/* soft key from front-upper-left */}
      <directionalLight
        position={[3.4, 4.6, 3.6]}
        intensity={2.5}
        color="#fff3dd"
        castShadow={castShadows}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0015}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={14}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      {/* warm fill bouncing off the burgundy room */}
      <directionalLight position={[-3.6, 0.9, 2.4]} intensity={0.75} color="#c8713c" />
      {/* rim highlight that picks out the brass edges */}
      <directionalLight position={[-1.8, 2.6, -3.6]} intensity={1.35} color="#ffd9a2" />

      {/* Tiny static studio: two strip lights and a warm bounce card. This is
          what gives the metal believable reflections without an HDR download. */}
      <Environment resolution={64} frames={1}>
        <color attach="background" args={['#24060d']} />
        <Lightformer
          intensity={3.2}
          color="#fff0d4"
          position={[2.5, 3, 2.5]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[6, 3, 1]}
        />
        <Lightformer
          intensity={1.5}
          color="#ffb877"
          position={[-3, 1, 1.5]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[5, 3, 1]}
        />
        <Lightformer
          intensity={0.9}
          color="#7a1c2c"
          position={[0, -2.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>

      {/* ------------------------------ chest ----------------------------- */}
      <group scale={scale}>
        <group ref={alignRef} position={[0, BASE_Y, 0]}>
          <group rotation={[0, CHEST_TURN, 0]}>
            <ChestModel
              runtimeRef={runtimeRef}
              quality={quality}
              castShadows={castShadows}
              tex={tex}
            />

            {/* Grounded contact shadow: one textured quad, sitting just under
                the feet (which stand at y = -0.065) so nothing z-fights. */}
            <mesh
              material={shadowMat}
              position={[0, -0.066, 0.06]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[3.5, 2.6]} />
            </mesh>

            {/* real cast shadows only where the device can afford them */}
            {castShadows && (
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.068, 0]}>
                <planeGeometry args={[9, 9]} />
                <shadowMaterial opacity={0.4} color="#12030a" />
              </mesh>
            )}
          </group>

          <Suspense fallback={null}>
            <LogoReveal runtimeRef={runtimeRef} glowMap={tex.glowMap} alignRef={alignRef} />
          </Suspense>
        </group>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function TreasureChestScene({
  runtimeRef,
  quality,
  boosted,
  reducedMotion,
  onCompleted,
  onReady,
}: Props) {
  const [dpr, setDpr] = useState<number>(quality === 'high' ? 1.75 : 1.25);
  const handleSlow = useCallback(() => setDpr(1), []);

  // 60fps only while the reveal is actually playing; 30 is plenty for the
  // near-imperceptible idle, and a reduced-motion chest is static so it barely
  // needs to redraw at all.
  const fps = boosted ? 60 : reducedMotion ? 8 : 30;

  return (
    <Canvas
      className="chest-canvas"
      frameloop="demand"
      dpr={dpr}
      shadows={quality === 'high' ? 'soft' : false}
      gl={{
        alpha: true,
        antialias: quality === 'high',
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0.72, 5.4], fov: 30, near: 0.1, far: 40 }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        camera.lookAt(0, 0, 0);
        // Context is live and the first frame is about to paint — safe to
        // fade the loader out now rather than leaving the area blank.
        onReady?.();
      }}
      // the DOM wrapper owns the interaction, so the canvas stays inert
      style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
    >
      <RenderDriver fps={fps} onSlow={handleSlow} />
      <SceneContents runtimeRef={runtimeRef} quality={quality} onCompleted={onCompleted} />
    </Canvas>
  );
}
