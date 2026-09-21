'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Butterfly {
  curve: THREE.CubicBezierCurve3 | null;
  cycle: number;
  delay: number;
  duration: number;
  hasHeading: boolean;
  heading: number;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  point: THREE.Vector3;
  seed: number;
  tangent: THREE.Vector3;
}

interface ButterflyOptions {
  colorA: string;
  colorB: string;
  delay: number;
  duration: number;
  seed: number;
}

const butterflyOptions: ButterflyOptions[] = [
  { colorA: '#1677ff', colorB: '#70d7ff', delay: 0.7,  duration: 15, seed: 3.1  },
  { colorA: '#ff6b16', colorB: '#ffd05b', delay: 3.1,  duration: 17, seed: 8.6  },
  { colorA: '#8d45e8', colorB: '#f58bd8', delay: 5.4,  duration: 14, seed: 14.2 },
  { colorA: '#f04468', colorB: '#ff9d6c', delay: 8.3,  duration: 16, seed: 19.7 },
  { colorA: '#17a589', colorB: '#88f1d2', delay: 11.2, duration: 18, seed: 25.4 },
];

/* ------------------------------------------------------------------ *
 * Module-level texture cache: one network request no matter how many
 * pages mount <RealisticButterflies> in the same session.
 * ------------------------------------------------------------------ */
let cachedTexture: THREE.Texture | null = null;
let texturePromise: Promise<THREE.Texture> | null = null;

function loadTexture(): Promise<THREE.Texture> {
  if (cachedTexture) return Promise.resolve(cachedTexture);
  if (!texturePromise) {
    texturePromise = new THREE.TextureLoader().loadAsync('/butterfly.png').then((t) => {
      t.colorSpace    = THREE.SRGBColorSpace;
      t.magFilter     = THREE.LinearFilter;
      t.minFilter     = THREE.LinearMipmapLinearFilter;
      cachedTexture   = t;
      return t;
    }).catch((err) => {
      console.error('Failed to load butterfly texture:', err);
      texturePromise = null; // allow retry on next mount
      throw err;
    });
  }
  return texturePromise;
}

/* ------------------------------------------------------------------ */

function createButterfly(
  texture: THREE.Texture,
  options: ButterflyOptions,
  isCompact: boolean,
): Butterfly {
  // Lower segment count on mobile: 24×12 → 12×6 halves vertex count
  const [segW, segH] = isCompact ? [12, 6] : [24, 12];
  const geometry = new THREE.PlaneGeometry(52, 26, segW, segH);
  const colorA   = new THREE.Color(options.colorA);
  const colorB   = new THREE.Color(options.colorB);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    side:        THREE.DoubleSide,
    uniforms: {
      map:    { value: texture },
      time:   { value: 0 },
      phase:  { value: options.seed },
      colorA: { value: colorA },
      colorB: { value: colorB },
    },
    vertexShader: `
      uniform float time;
      uniform float phase;
      varying vec2 vUv;
      void main() {
        float flap = radians(sin(time * (7.0 + sin(phase) * .8) - length(position.xy) / 52.0 * 2.6 + phase) * 48.0 + 28.0);
        float hovering = cos(time * 2.4 + phase) * 1.5;
        vec3 fluttered = vec3(
          cos(flap) * position.x,
          position.y + hovering,
          sin(flap) * abs(position.x) + hovering
        );
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(fluttered, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec2 vUv;
      void main() {
        vec4 wing = texture2D(map, vUv);
        if (wing.a < .04) discard;
        vec3 color = mix(colorA, colorB, vUv.y);
        gl_FragColor = vec4(color, 1.0) * wing;
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -0.18;
  return {
    curve: null, cycle: -1,
    delay: options.delay, duration: options.duration,
    hasHeading: false, heading: 0,
    material, mesh,
    point: new THREE.Vector3(),
    seed: options.seed,
    tangent: new THREE.Vector3(),
  };
}

const fract = (v: number) => v - Math.floor(v);
const noise  = (v: number) => fract(Math.sin(v * 91.47) * 3471.91);
const smoothAngle = (cur: number, tgt: number, dt: number) => {
  const turn = Math.atan2(Math.sin(tgt - cur), Math.cos(tgt - cur));
  return cur + turn * (1 - Math.exp(-dt * 6));
};

function edgePoint(side: number, amount: number, w: number, h: number) {
  const ov = 45;
  if (side === 0) return new THREE.Vector2(-w / 2 - ov, THREE.MathUtils.lerp(-h / 2, h / 2, amount));
  if (side === 1) return new THREE.Vector2(THREE.MathUtils.lerp(-w / 2, w / 2, amount), h / 2 + ov);
  if (side === 2) return new THREE.Vector2(w / 2 + ov, THREE.MathUtils.lerp(-h / 2, h / 2, amount));
  return new THREE.Vector2(THREE.MathUtils.lerp(-w / 2, w / 2, amount), -h / 2 - ov);
}

export default function RealisticButterflies() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isCompact          = window.matchMedia('(max-width: 700px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isCompact,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.15 : 1.5));

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.set(0, 0, 160);
    const timer  = new THREE.Timer();
    timer.connect(document);

    let butterflies: Butterfly[] = [];
    let active = true; // false while off-screen or tab hidden

    loadTexture().then((texture) => {
      butterflies = butterflyOptions
        .filter((_, i) => !isCompact || i < 3)
        .map((opt) => createButterfly(texture, opt, isCompact));
      butterflies.forEach(({ mesh }) => scene.add(mesh));
    }).catch(() => { /* texture load failed, stay empty */ });

    let width = 0;
    let height = 0;
    const resize = () => {
      width  = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.left   = -width  / 2;
      camera.right  =  width  / 2;
      camera.top    =  height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    /* ------------ pause/resume on visibility change ------------ */
    const onVisibility = () => { active = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    /* ------------ pause/resume when scrolled off-screen -------- */
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => { active = entry.isIntersecting; },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    /* ----------------------------- render loop ----------------- */
    const frameInterval = isCompact ? 1000 / 40 : 1000 / 55;
    let animationFrame  = 0;
    let lastFrame       = 0;

    const render = (timestamp: number) => {
      animationFrame = requestAnimationFrame(render);
      if (!active) return;
      if (timestamp - lastFrame < frameInterval) return;
      lastFrame = timestamp;

      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      const delta   = timer.getDelta();

      butterflies.forEach((butterfly) => {
        if (elapsed < butterfly.delay || !width || !height) {
          butterfly.mesh.visible = false;
          butterfly.hasHeading   = false;
          return;
        }

        butterfly.mesh.visible = true;
        const flightTime = elapsed - butterfly.delay;
        const cycle      = Math.floor(flightTime / butterfly.duration);
        const flight     = (flightTime % butterfly.duration) / butterfly.duration;
        const pathSeed   = butterfly.seed + cycle * 11.31;

        if (butterfly.cycle !== cycle || !butterfly.curve) {
          butterfly.cycle  = cycle;
          const startSide  = Math.floor(noise(pathSeed) * 4);
          const endSide    = (startSide + 1 + Math.floor(noise(pathSeed + 1) * 3)) % 4;
          const start      = edgePoint(startSide, noise(pathSeed + 2), width, height);
          const end        = edgePoint(endSide,   noise(pathSeed + 3), width, height);
          butterfly.curve  = new THREE.CubicBezierCurve3(
            new THREE.Vector3(start.x, start.y, 0),
            new THREE.Vector3(
              THREE.MathUtils.lerp(start.x, end.x, .28) + (noise(pathSeed + 4) - .5) * width * .55,
              THREE.MathUtils.lerp(start.y, end.y, .28) + (noise(pathSeed + 5) - .5) * height * .5,
              20,
            ),
            new THREE.Vector3(
              THREE.MathUtils.lerp(start.x, end.x, .72) + (noise(pathSeed + 6) - .5) * width * .55,
              THREE.MathUtils.lerp(start.y, end.y, .72) + (noise(pathSeed + 7) - .5) * height * .5,
              -12,
            ),
            new THREE.Vector3(end.x, end.y, 0),
          );
        }

        butterfly.curve.getPoint(flight, butterfly.point);
        butterfly.curve.getTangent(flight, butterfly.tangent);
        const drift = Math.sin(elapsed * (1.8 + noise(pathSeed + 8)) + butterfly.seed) * 8;

        butterfly.material.uniforms.time.value = elapsed;
        butterfly.mesh.position.set(
          butterfly.point.x,
          butterfly.point.y + drift,
          butterfly.point.z,
        );

        const targetHeading = Math.atan2(butterfly.tangent.y, butterfly.tangent.x) - Math.PI / 2;
        butterfly.heading   = butterfly.hasHeading
          ? smoothAngle(butterfly.heading, targetHeading, delta)
          : targetHeading;
        butterfly.hasHeading = true;

        const bank = Math.sin(elapsed * 2.1 + butterfly.seed) * .12
                   + Math.sin(elapsed * 1.3 + butterfly.seed) * .04;
        butterfly.mesh.rotation.z = butterfly.heading + bank;
      });

      renderer.render(scene, camera);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      timer.dispose();
      butterflies.forEach(({ mesh, material }) => {
        mesh.geometry.dispose();
        material.dispose();
      });
      // Do NOT dispose the cached texture — it is shared across instances.
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="realistic-butterflies"
      aria-hidden="true"
    />
  );
}
