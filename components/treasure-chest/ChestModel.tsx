'use client';

/**
 * The chest itself: merged geometry + procedural PBR materials + the hinge
 * animation.
 *
 * The lid is a child of a group positioned exactly on the rear hinge line, so
 * opening is a single `rotation.x` on a real pivot. Nothing fades, scales or
 * swaps. The body never moves during the open.
 *
 * All per-frame writes go through refs (object3D transforms, or materials
 * reached via a mesh ref) so nothing mutates props or memoised values.
 */

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildChestGeometry, CHEST, HINGE_POSITION } from './chestGeometry';
import type { ChestQuality, ChestTextureSet } from './chestTextures';
import { TIMING, TIMING_REDUCED, type ChestRuntime } from './chestRuntime';

const { H, R } = CHEST;

interface Props {
  runtimeRef: RefObject<ChestRuntime>;
  quality: ChestQuality;
  castShadows: boolean;
  /** Shared procedural texture set, built once by the scene. */
  tex: ChestTextureSet;
}

export default function ChestModel({ runtimeRef, quality, castShadows, tex }: Props) {
  const geo = useMemo(() => buildChestGeometry(quality), [quality]);
  useEffect(() => () => geo.dispose(), [geo]);

  const materials = useMemo(() => {
    const wood = new THREE.MeshStandardMaterial({
      map: tex.woodMap,
      normalMap: tex.woodNormal,
      roughnessMap: tex.woodRough,
      roughness: 1,
      metalness: 0.04,
      envMapIntensity: 0.4,
      normalScale: new THREE.Vector2(0.85, 0.85),
    });

    const brass = new THREE.MeshStandardMaterial({
      map: tex.brassMap,
      normalMap: tex.brassNormal,
      roughnessMap: tex.brassRough,
      roughness: 1,
      // Just short of a pure conductor: the engraved scroll still catches the
      // environment, but the brass keeps reading as gold from the direct lights
      // alone rather than going black if reflections are weak.
      metalness: 0.84,
      envMapIntensity: 1.2,
      // straps are thin shells laid on the dome, so both faces must draw
      side: THREE.DoubleSide,
      normalScale: new THREE.Vector2(1.25, 1.25),
    });

    const lining = new THREE.MeshStandardMaterial({
      map: tex.velvetMap,
      normalMap: tex.velvetNormal,
      roughness: 0.94,
      metalness: 0,
      side: THREE.BackSide,
      emissive: new THREE.Color(0x6d3512),
      emissiveIntensity: 0,
    });

    const iron = new THREE.MeshStandardMaterial({
      color: '#241d18',
      roughness: 0.5,
      metalness: 0.85,
      envMapIntensity: 0.7,
    });

    const glow = new THREE.MeshBasicMaterial({
      map: tex.glowMap,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    return { wood, brass, lining, iron, glow };
  }, [tex]);

  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );

  /* --------------------------- instanced rivets --------------------------- */
  const bodyRivetMesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo.rivet, materials.brass, geo.bodyRivets.length);
    geo.bodyRivets.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = castShadows;
    return m;
  }, [geo, materials.brass, castShadows]);

  const lidRivetMesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo.rivet, materials.brass, geo.lidRivets.length);
    geo.lidRivets.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = castShadows;
    return m;
  }, [geo, materials.brass, castShadows]);

  /* ------------------------------- refs ---------------------------------- */
  const rootRef = useRef<THREE.Group>(null);
  const idleRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const haspRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const liningRef = useRef<THREE.Mesh>(null);

  // spring integrators, held in refs so useFrame owns all mutation
  const lid = useRef({ a: 0, v: 0 });
  const hasp = useRef({ a: 0, v: 0 });
  const hover = useRef(0);

  useFrame((state, rawDelta) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const reducedMotion = runtime.reducedMotion;
    const T = reducedMotion ? TIMING_REDUCED : TIMING;

    if (runtime.open && runtime.openAt < 0) runtime.openAt = t;
    const since = runtime.openAt >= 0 ? t - runtime.openAt : -1;
    const opening = since >= 0;

    const substeps = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / substeps;

    /* ----------------------------- lid hinge ----------------------------- */
    const lidTarget = opening && since >= T.lidStart ? CHEST.OPEN_ANGLE : 0;
    const lidState = lid.current;

    if (reducedMotion) {
      lidState.a = THREE.MathUtils.damp(lidState.a, lidTarget, 9, dt);
      lidState.v = 0;
    } else {
      // Under-damped spring: the lid overshoots a few degrees and settles back,
      // which is what a heavy hinged lid actually does.
      for (let i = 0; i < substeps; i++) {
        const accel = (lidTarget - lidState.a) * 46 - lidState.v * 7.4;
        lidState.v += accel * h;
        lidState.a += lidState.v * h;
      }
    }

    /* ------------------------- latch / hasp motion ------------------------ */
    // snaps clear of the escutcheon the instant the chest is tapped
    const haspTarget = opening ? -0.62 : 0;
    const haspState = hasp.current;
    for (let i = 0; i < substeps; i++) {
      const accel = (haspTarget - haspState.a) * 150 - haspState.v * 11;
      haspState.v += accel * h;
      haspState.a += haspState.v * h;
    }

    let haspAngle = haspState.a;
    if (!opening && !reducedMotion) {
      // Idle: every few seconds the latch gives one tiny damped rattle, as if
      // something inside nudged it. Pure maths, no extra state, no allocation.
      const phase = t % 4.6;
      if (phase < 0.6) {
        haspAngle += Math.sin(phase * 32) * Math.exp(-phase * 7.5) * 0.085;
      }
    }

    if (lidRef.current) lidRef.current.rotation.x = lidState.a;
    if (haspRef.current) haspRef.current.rotation.x = haspAngle;

    /* ------------------------------- idle -------------------------------- */
    const idle = idleRef.current;
    if (idle) {
      if (reducedMotion) {
        idle.rotation.z = 0;
        idle.position.y = 0;
      } else if (!opening) {
        // A slow settle-breath plus an occasional almost imperceptible shift.
        idle.position.y = Math.sin(t * 0.85) * 0.006;
        idle.rotation.z = Math.sin(t * 0.62) * 0.0034;
        const nudge = t % 7.4;
        if (nudge < 0.5) {
          idle.rotation.z += Math.sin(nudge * 26) * Math.exp(-nudge * 8) * 0.006;
        }
      } else {
        // settle to neutral so the body is rock steady while the lid swings
        idle.position.y = THREE.MathUtils.damp(idle.position.y, 0, 8, dt);
        idle.rotation.z = THREE.MathUtils.damp(idle.rotation.z, 0, 8, dt);
      }
    }

    /* --------------------------- hover / press --------------------------- */
    const root = rootRef.current;
    if (root) {
      const wantHover = runtime.hovered && !opening ? 1 : 0;
      hover.current = THREE.MathUtils.damp(hover.current, wantHover, 7, dt);
      const press = runtime.pressed && !opening ? 0.985 : 1;
      root.position.y = hover.current * 0.05;
      root.rotation.x = hover.current * -0.024;
      root.scale.setScalar(THREE.MathUtils.damp(root.scale.x, press, 14, dt));
    }

    /* -------------------------- interior light --------------------------- */
    const glowT = opening
      ? THREE.MathUtils.clamp((since - T.glowStart) / 0.5, 0, 1)
      : 0;
    const eased = glowT * glowT * (3 - 2 * glowT);

    if (lightRef.current) {
      lightRef.current.intensity = eased * (quality === 'high' ? 3.1 : 2.6);
    }
    const lining = liningRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (lining) lining.emissiveIntensity = eased * 0.5;

    const glowMesh = glowRef.current;
    if (glowMesh) {
      (glowMesh.material as THREE.MeshBasicMaterial).opacity = eased * 0.5;
      const s = 0.55 + eased * 0.55;
      glowMesh.scale.set(s, s, s);
    }

    /* ---------------------------- completion ----------------------------- */
    if (opening && !runtime.completed && since >= T.done) runtime.completed = true;
  });

  return (
    <group ref={rootRef}>
      <group ref={idleRef}>
        {/* ---------------------------- body ---------------------------- */}
        <mesh
          geometry={geo.bodyWood}
          material={materials.wood}
          castShadow={castShadows}
          receiveShadow={castShadows}
        />
        {/* BackSide box: reads as a lined, open-topped cavity */}
        <mesh ref={liningRef} geometry={geo.bodyLining} material={materials.lining} />
        <mesh geometry={geo.bodyBrass} material={materials.brass} castShadow={castShadows} />
        <mesh geometry={geo.bodyDark} material={materials.iron} castShadow={castShadows} />
        <primitive object={bodyRivetMesh} />

        {/* interior light + the warm pool of light across the opening */}
        <pointLight
          ref={lightRef}
          position={[0, H * 0.46, 0]}
          color="#ffca7a"
          intensity={0}
          distance={4.2}
          decay={2}
        />
        <mesh
          ref={glowRef}
          material={materials.glow}
          position={[0, H - 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2.4, 2.4]} />
        </mesh>

        {/* --------- lid, hinged on the real rear hinge pin --------- */}
        <group ref={lidRef} position={HINGE_POSITION}>
          <mesh geometry={geo.lidWood} material={materials.wood} castShadow={castShadows} />
          <mesh geometry={geo.lidLining} material={materials.lining} />
          <mesh geometry={geo.lidBrass} material={materials.brass} castShadow={castShadows} />
          <primitive object={lidRivetMesh} />

          {/* latch arm, pivots at its own top so it can rattle on its own */}
          <group
            ref={haspRef}
            position={[0, 0.045 - CHEST.HINGE_LIFT, R * 2 + 0.025 + CHEST.HINGE_BACK]}
          >
            <mesh geometry={geo.hasp} material={materials.brass} castShadow={castShadows} />
          </group>
        </group>
      </group>
    </group>
  );
}
