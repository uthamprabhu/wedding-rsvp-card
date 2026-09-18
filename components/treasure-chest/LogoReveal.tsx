'use client';

/**
 * The existing circular wedding logo, revealed out of the chest.
 *
 * The logo is a real mesh sitting *inside* the chest volume, so the front wall
 * and the closed lid hide it through ordinary depth testing - there is no
 * masking hack, no overlay and no crossfade. It then travels up through the
 * opening, clears the lid and settles toward the centre of frame.
 */

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TIMING, TIMING_REDUCED, type ChestRuntime } from './chestRuntime';
import { CHEST } from './chestGeometry';

const LOGO_SRC = '/images/logo.jpeg';

/**
 * Module-level cache for the logo texture. Owning the load (instead of going
 * through `useLoader`) means the texture can be configured for sRGB at load
 * time rather than mutated later, and the request starts the moment this module
 * is imported - which happens while the wedding loader is still on screen.
 */
let logoTexture: THREE.Texture | null = null;
let logoPending: Promise<THREE.Texture> | null = null;

function loadLogoTexture(): Promise<THREE.Texture> {
  if (logoTexture) return Promise.resolve(logoTexture);
  if (!logoPending) {
    logoPending = new THREE.TextureLoader().loadAsync(LOGO_SRC).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
      logoTexture = t;
      return t;
    });
  }
  return logoPending;
}

if (typeof window !== 'undefined') void loadLogoTexture().catch(() => {});

/** Height (chest-local) at which the logo rests hidden inside the chest. */
const Y_HIDDEN = 0.4;
/** Height at which it has fully cleared the open lid. */
const Y_CLEAR = 2.0;

const SPARKLES = 18;

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** Deterministic hash: keeps the sparkle layout pure and reproducible. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Props {
  runtimeRef: RefObject<ChestRuntime>;
  glowMap: THREE.Texture;
  /** Group holding both chest and logo; eased down as the logo settles. */
  alignRef: RefObject<THREE.Group | null>;
}

export default function LogoReveal({ runtimeRef, glowMap, alignRef }: Props) {
  const [logoTex, setLogoTex] = useState<THREE.Texture | null>(logoTexture);

  useEffect(() => {
    if (logoTex) return;
    let cancelled = false;
    void loadLogoTexture().then(
      (t) => {
        if (!cancelled) setLogoTex(t);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [logoTex]);

  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const sparkRef = useRef<THREE.Points>(null);

  /* ------------------------------ sparkles ------------------------------- */
  // A deliberately tiny amount of golden dust: 18 additive points, alive for
  // about a second and a half, then idle at zero opacity.
  const sparkles = useMemo(() => {
    const positions = new Float32Array(SPARKLES * 3);
    const angle = new Float32Array(SPARKLES);
    const radius = new Float32Array(SPARKLES);
    const speed = new Float32Array(SPARKLES);
    for (let i = 0; i < SPARKLES; i++) {
      angle[i] = hash(i + 1) * Math.PI * 2;
      radius[i] = 0.12 + hash(i + 41) * 0.5;
      speed[i] = 0.55 + hash(i + 97) * 0.9;
      positions[i * 3] = Math.cos(angle[i]) * radius[i];
      positions[i * 3 + 1] = Y_HIDDEN;
      positions[i * 3 + 2] = Math.sin(angle[i]) * radius[i] * 0.5;
    }
    return { positions, angle, radius, speed };
  }, []);

  useFrame((state, rawDelta) => {
    const runtime = runtimeRef.current;
    const group = groupRef.current;
    if (!runtime || !group) return;

    const dt = Math.min(rawDelta, 0.05);
    const T = runtime.reducedMotion ? TIMING_REDUCED : TIMING;
    const since = runtime.openAt >= 0 ? state.clock.elapsedTime - runtime.openAt : -1;

    const glowMat = glowRef.current?.material as THREE.MeshBasicMaterial | undefined;
    const sparkMat = sparkRef.current?.material as THREE.PointsMaterial | undefined;

    if (since < 0) {
      // Parked inside the chest, hidden by real geometry.
      group.position.set(0, Y_HIDDEN, 0);
      group.scale.setScalar(0.6);
      if (glowMat) glowMat.opacity = 0;
      if (sparkMat) sparkMat.opacity = 0;
      return;
    }

    /* ------------------------------- rise -------------------------------- */
    const rise = THREE.MathUtils.clamp(
      (since - T.logoRise) / (T.logoClear - T.logoRise),
      0,
      1,
    );
    const riseEased = easeInOutCubic(rise);
    // a touch of buoyancy at the top so it does not feel mechanical
    const overshoot = runtime.reducedMotion ? 0 : Math.sin(Math.PI * rise) * 0.05;
    const y = THREE.MathUtils.lerp(Y_HIDDEN, Y_CLEAR, riseEased) + overshoot;

    /* ------------------------------ settle ------------------------------- */
    const settle = THREE.MathUtils.clamp(
      (since - T.logoClear) / (T.logoSettle - T.logoClear),
      0,
      1,
    );
    const settleEased = easeOutCubic(settle);

    group.position.set(0, y, THREE.MathUtils.lerp(0, 0.25, settleEased));
    group.scale.setScalar(THREE.MathUtils.lerp(0.6, 1.16, settleEased));

    // Bring the reveal to the centre of frame: the chest eases down and shrinks
    // slightly while the logo holds its height, so the logo lands on the axis.
    const align = alignRef.current;
    if (align) {
      const base = -(CHEST.H + CHEST.R) / 2;
      align.position.y = THREE.MathUtils.lerp(base, base - 0.9, settleEased);
      align.scale.setScalar(THREE.MathUtils.lerp(1, 0.88, settleEased));
    }

    // Always present the logo square-on to the camera.
    group.lookAt(state.camera.position);

    /* ------------------------------- glow -------------------------------- */
    const glowIn = THREE.MathUtils.clamp((since - T.logoRise) / 0.45, 0, 1);
    if (glowMat) glowMat.opacity = glowIn * (0.5 - settleEased * 0.24);
    if (glowRef.current) {
      const s = 1.5 + glowIn * 0.5;
      glowRef.current.scale.set(s, s, s);
    }

    /* ----------------------------- sparkles ------------------------------ */
    const points = sparkRef.current;
    if (!runtime.reducedMotion && points && sparkMat) {
      const life = THREE.MathUtils.clamp((since - T.logoRise + 0.1) / 1.5, 0, 1);
      sparkMat.opacity = Math.sin(Math.PI * life) * 0.75;
      if (life > 0 && life < 1) {
        const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = 0; i < SPARKLES; i++) {
          const a = sparkles.angle[i] + since * 0.6;
          const r = sparkles.radius[i] * (1 + life * 0.5);
          arr[i * 3] = Math.cos(a) * r;
          arr[i * 3 + 1] += sparkles.speed[i] * dt;
          arr[i * 3 + 2] = Math.sin(a) * r * 0.5;
        }
        attr.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <group ref={groupRef} position={[0, Y_HIDDEN, 0]} scale={0.6}>
        {/* soft champagne halo behind the mark */}
        <mesh ref={glowRef} position={[0, 0, -0.04]} scale={1.5}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial
            map={glowMap}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* the existing wedding logo, unchanged */}
        {logoTex && (
          <mesh>
            <circleGeometry args={[0.5, 48]} />
            <meshBasicMaterial map={logoTex} toneMapped={false} />
          </mesh>
        )}

        {/* thin brushed-gold rim */}
        <mesh position={[0, 0, 0.002]}>
          <ringGeometry args={[0.5, 0.532, 48]} />
          <meshStandardMaterial
            color="#d8b26a"
            metalness={0.82}
            roughness={0.28}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>

      <points ref={sparkRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkles.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          map={glowMap}
          color="#ffd79a"
          size={0.1}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </>
  );
}
