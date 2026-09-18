/**
 * Procedural PBR texture set for the treasure chest.
 *
 * Everything here is drawn on an offscreen canvas at runtime, which means the
 * chest ships with ZERO image/model bytes over the network. Generation happens
 * once, is memoised by the scene, and costs a few milliseconds while the
 * existing wedding loader is still on screen.
 *
 * Maps produced:
 *   wood   -> colour + normal + roughness (aged walnut, plank seams, grain)
 *   brass  -> colour + normal + roughness (antique brass with engraved scroll)
 *   velvet -> colour (interior lining)
 *   shadow -> alpha gradient used for the grounded contact shadow
 *   glow   -> radial additive gradient for the interior light + sparkles
 */

import * as THREE from 'three';

export type ChestQuality = 'low' | 'high';

export interface ChestTextureSet {
  woodMap: THREE.Texture;
  woodNormal: THREE.Texture;
  woodRough: THREE.Texture;
  brassMap: THREE.Texture;
  brassNormal: THREE.Texture;
  brassRough: THREE.Texture;
  velvetMap: THREE.Texture;
  velvetNormal: THREE.Texture;
  shadowMap: THREE.Texture;
  glowMap: THREE.Texture;
  dispose: () => void;
}

/* ------------------------------------------------------------------ *
 * Small deterministic noise helpers (no dependencies)
 * ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value-noise lattice with bilinear interpolation. */
function makeNoise(gridSize: number, seed: number) {
  const rand = mulberry32(seed);
  const g = new Float32Array(gridSize * gridSize);
  for (let i = 0; i < g.length; i++) g[i] = rand();

  const at = (x: number, y: number) => {
    const xi = ((x % gridSize) + gridSize) % gridSize;
    const yi = ((y % gridSize) + gridSize) % gridSize;
    return g[yi * gridSize + xi];
  };

  // u,v in 0..1 -> tileable noise in 0..1
  return (u: number, v: number) => {
    const x = u * gridSize;
    const y = v * gridSize;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    // smoothstep for softer lobes
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = at(x0, y0);
    const n10 = at(x0 + 1, y0);
    const n01 = at(x0, y0 + 1);
    const n11 = at(x0 + 1, y0 + 1);
    return (
      n00 * (1 - sx) * (1 - sy) +
      n10 * sx * (1 - sy) +
      n01 * (1 - sx) * sy +
      n11 * sx * sy
    );
  };
}

function makeFbm(seed: number) {
  const octaves = [
    { n: makeNoise(4, seed + 1), a: 0.5 },
    { n: makeNoise(8, seed + 2), a: 0.27 },
    { n: makeNoise(16, seed + 3), a: 0.14 },
    { n: makeNoise(32, seed + 4), a: 0.09 },
  ];
  return (u: number, v: number) => {
    let s = 0;
    for (const o of octaves) s += o.n(u, v) * o.a;
    return s;
  };
}

function canvas2d(size: number, height = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas unavailable');
  return { c, ctx };
}

/**
 * Convert a greyscale height canvas into a tangent-space normal map using a
 * Sobel operator. Wraps at the edges so the result stays tileable.
 */
function heightToNormal(
  height: HTMLCanvasElement,
  strength: number,
): HTMLCanvasElement {
  const w = height.width;
  const h = height.height;
  const src = height
    .getContext('2d')!
    .getImageData(0, 0, w, h).data;

  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum[i] = (src[i * 4] * 0.299 + src[i * 4 + 1] * 0.587 + src[i * 4 + 2] * 0.114) / 255;
  }

  const { c: out, ctx } = canvas2d(w, h);
  const img = ctx.createImageData(w, h);
  const px = (x: number, y: number) =>
    lum[(((y % h) + h) % h) * w + (((x % w) + w) % w)];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = px(x - 1, y - 1);
      const t = px(x, y - 1);
      const tr = px(x + 1, y - 1);
      const l = px(x - 1, y);
      const r = px(x + 1, y);
      const bl = px(x - 1, y + 1);
      const b = px(x, y + 1);
      const br = px(x + 1, y + 1);

      const dx = tl + 2 * l + bl - (tr + 2 * r + br);
      const dy = tl + 2 * t + tr - (bl + 2 * b + br);

      let nx = dx * strength;
      let ny = dy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;

      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

function toTexture(
  c: HTMLCanvasElement,
  {
    srgb = false,
    repeat = 1,
    anisotropy = 4,
  }: { srgb?: boolean; repeat?: number; anisotropy?: number } = {},
) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.setScalar(repeat);
  t.anisotropy = anisotropy;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------------------ *
 * Aged walnut
 * ------------------------------------------------------------------ */

/**
 * Grain runs along U. Plank seams are perpendicular (along V) so that on the
 * lid's half-cylinder the staves read as running front-to-back over the dome,
 * exactly like the reference chest.
 */
function drawWood(size: number) {
  const { c, ctx } = canvas2d(size, size);
  const fbm = makeFbm(1337);
  const rand = mulberry32(99);
  const PLANKS = 5;

  // Base tone
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#4a2f1c');
  base.addColorStop(0.5, '#5b3a22');
  base.addColorStop(1, '#3f2716');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Per-plank tonal variation so no two staves match
  for (let p = 0; p < PLANKS; p++) {
    const y0 = (p / PLANKS) * size;
    const ph = size / PLANKS;
    const tone = rand();
    ctx.fillStyle = `rgba(${90 + tone * 40}, ${56 + tone * 26}, ${30 + tone * 16}, 0.3)`;
    ctx.fillRect(0, y0, size, ph);
  }

  // Grain: long wavy strokes along U
  ctx.lineWidth = 1;
  const strokes = Math.floor(size * 1.15);
  for (let i = 0; i < strokes; i++) {
    const y = rand() * size;
    const amp = 1.5 + rand() * 5;
    const freq = 1 + rand() * 2.5;
    const phase = rand() * Math.PI * 2;
    const dark = rand() > 0.42;
    const alpha = 0.05 + rand() * 0.16;
    ctx.strokeStyle = dark
      ? `rgba(28, 15, 7, ${alpha})`
      : `rgba(158, 112, 66, ${alpha * 0.75})`;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const u = x / size;
      const wobble =
        Math.sin(u * Math.PI * 2 * freq + phase) * amp +
        (fbm(u * 1.4, y / size) - 0.5) * 7;
      const yy = y + wobble;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // A couple of knots for natural imperfection
  for (let k = 0; k < 3; k++) {
    const kx = rand() * size;
    const ky = rand() * size;
    const kr = size * (0.02 + rand() * 0.035);
    for (let r = kr; r > 0; r -= 1.6) {
      ctx.strokeStyle = `rgba(30, 16, 8, ${0.05 + 0.16 * (1 - r / kr)})`;
      ctx.beginPath();
      ctx.ellipse(kx, ky, r, r * 0.45, rand() * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Plank seams: dark grooves with a lit lower lip
  for (let p = 1; p <= PLANKS; p++) {
    const y = (p / PLANKS) * size;
    const g = ctx.createLinearGradient(0, y - 4, 0, y + 4);
    g.addColorStop(0, 'rgba(20, 10, 4, 0)');
    g.addColorStop(0.45, 'rgba(14, 7, 2, 0.85)');
    g.addColorStop(0.55, 'rgba(14, 7, 2, 0.85)');
    g.addColorStop(1, 'rgba(150, 108, 64, 0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 4, size, 8);
  }

  // Subtle dirt / patina blotches
  const blot = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / size, y / size);
      const i = (y * size + x) * 4;
      blot.data[i] = 12;
      blot.data[i + 1] = 6;
      blot.data[i + 2] = 2;
      blot.data[i + 3] = Math.max(0, (n - 0.52)) * 210;
    }
  }
  const { c: bc, ctx: bctx } = canvas2d(size, size);
  bctx.putImageData(blot, 0, 0);
  ctx.drawImage(bc, 0, 0);

  return c;
}

function drawWoodHeight(size: number) {
  const { c, ctx } = canvas2d(size, size);
  const fbm = makeFbm(1337);
  const rand = mulberry32(99);
  const PLANKS = 5;

  ctx.fillStyle = '#9a9a9a';
  ctx.fillRect(0, 0, size, size);

  // grain grooves
  ctx.lineWidth = 1;
  const strokes = Math.floor(size * 0.9);
  for (let i = 0; i < strokes; i++) {
    const y = rand() * size;
    const amp = 1.5 + rand() * 5;
    const freq = 1 + rand() * 2.5;
    const phase = rand() * Math.PI * 2;
    ctx.strokeStyle = rand() > 0.5
      ? 'rgba(0,0,0,0.16)'
      : 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    for (let x = 0; x <= size; x += 4) {
      const u = x / size;
      const yy =
        y +
        Math.sin(u * Math.PI * 2 * freq + phase) * amp +
        (fbm(u * 1.4, y / size) - 0.5) * 7;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // seams cut deep
  for (let p = 1; p <= PLANKS; p++) {
    const y = (p / PLANKS) * size;
    const g = ctx.createLinearGradient(0, y - 5, 0, y + 5);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.5, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(255,255,255,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 5, size, 10);
  }

  return c;
}

function drawWoodRough(size: number) {
  const { c, ctx } = canvas2d(size, size);
  const fbm = makeFbm(4242);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / size, y / size);
      // aged, mostly matte wood with slightly polished high spots
      const v = 150 + n * 80;
      const i = (y * size + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/* ------------------------------------------------------------------ *
 * Antique brass with engraved scrollwork
 * ------------------------------------------------------------------ */

/**
 * One ornament cell. Strap length runs along X (U), strap width along Y (V).
 * Drawn as pure luminance so it can feed both the height->normal pass and a
 * multiply pass over the brass colour.
 */
function drawScrollCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
  lw: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';

  const cx = w / 2;
  const cy = h / 2;

  // central rosette
  ctx.beginPath();
  ctx.arc(cx, cy, h * 0.14, 0, Math.PI * 2);
  ctx.stroke();
  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(a) * h * 0.22,
      cy + Math.sin(a) * h * 0.22,
      h * 0.1,
      h * 0.05,
      a,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }

  // mirrored S-scrolls with leaf curls flanking the rosette
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * h * 0.36, cy);
    ctx.bezierCurveTo(
      cx + dir * w * 0.2,
      cy - h * 0.36,
      cx + dir * w * 0.34,
      cy + h * 0.34,
      cx + dir * w * 0.48,
      cy,
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + dir * w * 0.3, cy - h * 0.2, h * 0.1, 0, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + dir * w * 0.42, cy + h * 0.2, h * 0.08, Math.PI, Math.PI * 2.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBrassOrnament(
  size: number,
  ink: string,
  bg: string,
  lw: number,
  border: string,
) {
  const { c, ctx } = canvas2d(size, Math.round(size / 4));
  const w = c.width;
  const h = c.height;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const CELLS = 3;
  const cw = w / CELLS;
  for (let i = 0; i < CELLS; i++) {
    drawScrollCell(ctx, i * cw, 0, cw, h, ink, lw);
  }

  // raised beaded border along both strap edges
  ctx.strokeStyle = border;
  ctx.lineWidth = lw * 1.3;
  for (const yy of [h * 0.09, h * 0.91]) {
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(w, yy);
    ctx.stroke();
  }
  return c;
}

function drawBrass(size: number) {
  const { c, ctx } = canvas2d(size, Math.round(size / 4));
  const w = c.width;
  const h = c.height;
  const fbm = makeFbm(777);

  // polished brass base, brighter through the middle of the strap
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#6d5220');
  g.addColorStop(0.18, '#b08a3c');
  g.addColorStop(0.42, '#e0bd6e');
  g.addColorStop(0.58, '#cfa751');
  g.addColorStop(0.85, '#8a6828');
  g.addColorStop(1, '#5d4419');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // patina mottling
  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x / w, y / h);
      const i = (y * w + x) * 4;
      const t = (n - 0.5) * 0.42;
      const dark = Math.max(0, n - 0.6) * 0.75;
      img.data[i] = THREE.MathUtils.clamp(img.data[i] * (1 + t) - dark * 90, 0, 255);
      img.data[i + 1] = THREE.MathUtils.clamp(img.data[i + 1] * (1 + t) - dark * 80, 0, 255);
      img.data[i + 2] = THREE.MathUtils.clamp(img.data[i + 2] * (1 + t * 0.7) - dark * 40, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);

  // engraved lines darken the colour map so the ornament reads even in shadow
  const orn = drawBrassOrnament(size, 'rgba(48, 32, 8, 0.62)', 'rgba(0,0,0,0)', Math.max(1, size / 220), 'rgba(60, 42, 12, 0.5)');
  ctx.drawImage(orn, 0, 0);

  // and a faint highlight offset by a pixel to fake bevelled engraving
  const hi = drawBrassOrnament(size, 'rgba(255, 232, 170, 0.3)', 'rgba(0,0,0,0)', Math.max(1, size / 300), 'rgba(255, 236, 180, 0.28)');
  ctx.drawImage(hi, 0, -Math.max(1, size / 260));

  return c;
}

function drawBrassHeight(size: number) {
  const { c, ctx } = canvas2d(size, Math.round(size / 4));
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, c.width, c.height);
  const orn = drawBrassOrnament(size, '#ffffff', 'rgba(0,0,0,0)', Math.max(1.5, size / 170), '#f0f0f0');
  ctx.drawImage(orn, 0, 0);

  // soften so the engraving reads as cast metal rather than wire
  ctx.filter = 'blur(1px)';
  ctx.drawImage(c, 0, 0);
  ctx.filter = 'none';
  return c;
}

function drawBrassRough(size: number) {
  const { c, ctx } = canvas2d(size, Math.round(size / 4));
  const fbm = makeFbm(31337);
  const w = c.width;
  const h = c.height;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x / w, y / h);
      // polished (low roughness) with tarnished patches
      const v = 60 + n * 130;
      const i = (y * w + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // crevices of the engraving hold dirt -> rougher
  const orn = drawBrassOrnament(size, 'rgba(235,235,235,0.85)', 'rgba(0,0,0,0)', Math.max(1, size / 200), 'rgba(30,30,30,0.5)');
  ctx.drawImage(orn, 0, 0);
  return c;
}

/* ------------------------------------------------------------------ *
 * Interior lining, contact shadow, glow
 * ------------------------------------------------------------------ */

function drawVelvet(size: number) {
  const { c, ctx } = canvas2d(size, size);
  const fbm = makeFbm(2024);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / size, y / size);
      const i = (y * size + x) * 4;
      // deep wine velvet tuned to the #3A0712 hero background
      img.data[i] = 74 + n * 46;
      img.data[i + 1] = 12 + n * 14;
      img.data[i + 2] = 22 + n * 16;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function drawVelvetHeight(size: number) {
  const { c, ctx } = canvas2d(size, size);
  const fbm = makeFbm(2024);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x / size, y / size);
      const v = 90 + n * 120;
      const i = (y * size + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function drawContactShadow(size: number) {
  const { c, ctx } = canvas2d(size, size);
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.88)');
  g.addColorStop(0.35, 'rgba(0,0,0,0.6)');
  g.addColorStop(0.62, 'rgba(0,0,0,0.24)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function drawGlow(size: number) {
  const { c, ctx } = canvas2d(size, size);
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 244, 214, 1)');
  g.addColorStop(0.22, 'rgba(255, 214, 148, 0.68)');
  g.addColorStop(0.55, 'rgba(214, 152, 74, 0.2)');
  g.addColorStop(1, 'rgba(180, 120, 50, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/* ------------------------------------------------------------------ */

export function createChestTextures(quality: ChestQuality): ChestTextureSet {
  const woodSize = quality === 'high' ? 512 : 256;
  const brassSize = quality === 'high' ? 512 : 256;
  const smallSize = quality === 'high' ? 256 : 128;

  const woodMap = toTexture(drawWood(woodSize), { srgb: true });
  const woodNormal = toTexture(heightToNormal(drawWoodHeight(woodSize), 1.5));
  const woodRough = toTexture(drawWoodRough(Math.min(256, woodSize)));

  const brassMap = toTexture(drawBrass(brassSize), { srgb: true });
  const brassNormal = toTexture(heightToNormal(drawBrassHeight(brassSize), 2.4));
  const brassRough = toTexture(drawBrassRough(brassSize));

  const velvetMap = toTexture(drawVelvet(smallSize), { srgb: true });
  const velvetNormal = toTexture(heightToNormal(drawVelvetHeight(smallSize), 0.8));

  const shadowMap = toTexture(drawContactShadow(smallSize), { srgb: true });
  shadowMap.wrapS = THREE.ClampToEdgeWrapping;
  shadowMap.wrapT = THREE.ClampToEdgeWrapping;

  const glowMap = toTexture(drawGlow(smallSize), { srgb: true });
  glowMap.wrapS = THREE.ClampToEdgeWrapping;
  glowMap.wrapT = THREE.ClampToEdgeWrapping;

  const all = [
    woodMap,
    woodNormal,
    woodRough,
    brassMap,
    brassNormal,
    brassRough,
    velvetMap,
    velvetNormal,
    shadowMap,
    glowMap,
  ];

  return {
    woodMap,
    woodNormal,
    woodRough,
    brassMap,
    brassNormal,
    brassRough,
    velvetMap,
    velvetNormal,
    shadowMap,
    glowMap,
    dispose: () => all.forEach((t) => t.dispose()),
  };
}
