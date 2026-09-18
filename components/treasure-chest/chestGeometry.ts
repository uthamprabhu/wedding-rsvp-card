/**
 * Treasure chest geometry.
 *
 * The chest is assembled from a modest number of primitives (open-topped body
 * shell, half-cylinder dome lid, wrapped brass straps, extruded escutcheon,
 * instanced dome rivets) and then merged per material so the whole hero object
 * costs roughly ten draw calls and ~25k triangles. No external model is
 * downloaded, and every part exists in real 3D space so the lid rotates around
 * a genuine rear hinge and the body genuinely occludes the interior.
 *
 * Local space convention:
 *   - body sits on y = 0 and rises to y = H
 *   - lid is a half cylinder of radius R = D / 2 whose axis is along X at y = H
 *   - the rear hinge line is (y = H, z = -R)
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const CHEST = {
  W: 2.0, // width  (X)
  D: 1.3, // depth  (Z)
  H: 1.0, // body height (Y)
  T: 0.075, // wall thickness
  get R() {
    return this.D / 2;
  },
  /** Fully open angle of the lid, in radians (past vertical, resting back). */
  OPEN_ANGLE: -1.98,
  /**
   * The hinge pin stands proud of the chest, exactly like the barrel of a real
   * strap hinge. Without this the lid's rear face would sweep through the body
   * rim on any swing past 90 degrees.
   */
  HINGE_LIFT: 0.05,
  HINGE_BACK: 0.02,
} as const;

const { W, D, H, T, HINGE_LIFT, HINGE_BACK } = CHEST;
const R = D / 2;

/** Lid pivot in body space. The lid group is placed here. */
export const HINGE_POSITION: [number, number, number] = [
  0,
  H + HINGE_LIFT,
  -(R + HINGE_BACK),
];

export interface ChestGeometrySet {
  bodyWood: THREE.BufferGeometry;
  bodyLining: THREE.BufferGeometry;
  bodyBrass: THREE.BufferGeometry;
  bodyDark: THREE.BufferGeometry;
  lidWood: THREE.BufferGeometry;
  lidLining: THREE.BufferGeometry;
  lidBrass: THREE.BufferGeometry;
  hasp: THREE.BufferGeometry;
  bodyRivets: THREE.Matrix4[];
  lidRivets: THREE.Matrix4[];
  rivet: THREE.BufferGeometry;
  dispose: () => void;
}

/* ------------------------------------------------------------------ *
 * Part helpers
 * ------------------------------------------------------------------ */

interface Part {
  geo: THREE.BufferGeometry;
  /** position */
  p?: [number, number, number];
  /** euler rotation */
  r?: [number, number, number];
  /** uv tiling applied to this part only, so straps keep a consistent scale */
  uv?: [number, number];
  /** rotate uv 90deg so the ornament runs along the part's long axis */
  uvRot?: boolean;
}

function transformUV(geo: THREE.BufferGeometry, uv?: [number, number], uvRot?: boolean) {
  const attr = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;
  if (!attr) return;
  const arr = attr.array as Float32Array;
  for (let i = 0; i < arr.length; i += 2) {
    let u = arr[i];
    let v = arr[i + 1];
    if (uvRot) {
      const t = u;
      u = v;
      v = t;
    }
    if (uv) {
      u *= uv[0];
      v *= uv[1];
    }
    arr[i] = u;
    arr[i + 1] = v;
  }
  attr.needsUpdate = true;
}

/**
 * Bake each part's transform into its vertices and merge. Everything is
 * converted to non-indexed first so extruded shapes (non-indexed) can merge
 * with primitives (indexed) safely.
 */
function mergeParts(parts: Part[]): THREE.BufferGeometry {
  const m = new THREE.Matrix4();
  const e = new THREE.Euler();
  const baked: THREE.BufferGeometry[] = [];

  for (const part of parts) {
    const g = part.geo.index ? part.geo.toNonIndexed() : part.geo.clone();
    // every source primitive is freshly constructed, so it can go now
    part.geo.dispose();

    transformUV(g, part.uv, part.uvRot);

    e.set(part.r?.[0] ?? 0, part.r?.[1] ?? 0, part.r?.[2] ?? 0);
    m.makeRotationFromEuler(e);
    m.setPosition(part.p?.[0] ?? 0, part.p?.[1] ?? 0, part.p?.[2] ?? 0);
    g.applyMatrix4(m);

    // drop anything the merge does not need
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') {
        g.deleteAttribute(name);
      }
    }
    baked.push(g);
  }

  const merged = mergeGeometries(baked, false);
  baked.forEach((g) => g.dispose());
  if (!merged) throw new Error('Failed to merge chest geometry');
  merged.computeBoundingSphere();
  return merged;
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/** Half-cylinder shell with its axis along X and the dome facing +Y. */
function dome(radius: number, length: number, segments: number, capped = true) {
  const g = new THREE.CylinderGeometry(radius, radius, length, segments, 1, !capped, 0, Math.PI);
  g.rotateZ(Math.PI / 2);
  return g;
}

/* ------------------------------------------------------------------ *
 * Escutcheon (ornate shield lock plate)
 * ------------------------------------------------------------------ */

function escutcheon(): THREE.BufferGeometry {
  const hw = 0.15;
  const hh = 0.19;
  const s = new THREE.Shape();
  s.moveTo(0, hh);
  s.bezierCurveTo(hw * 0.85, hh, hw, hh * 0.45, hw, hh * 0.05);
  s.bezierCurveTo(hw, -hh * 0.55, hw * 0.55, -hh * 0.82, 0, -hh);
  s.bezierCurveTo(-hw * 0.55, -hh * 0.82, -hw, -hh * 0.55, -hw, hh * 0.05);
  s.bezierCurveTo(-hw, hh * 0.45, -hw * 0.85, hh, 0, hh);

  // keyhole: round barrel over a tapered slot
  const hole = new THREE.Path();
  hole.absarc(0, 0.015, 0.032, Math.PI * 0.82, Math.PI * 2.18, false);
  hole.lineTo(0.019, -0.075);
  hole.lineTo(-0.019, -0.075);
  hole.closePath();
  s.holes.push(hole);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 10,
  });
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ *
 * Rivets
 * ------------------------------------------------------------------ */

function rivetMatrix(
  x: number,
  y: number,
  z: number,
  normal: THREE.Vector3,
  scale: number,
): THREE.Matrix4 {
  // Flatten the dome along its surface normal so it reads as a hammered rivet
  // rather than a floating ball.
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    q,
    new THREE.Vector3(scale, scale * 0.55, scale),
  );
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

export function buildChestGeometry(quality: 'low' | 'high'): ChestGeometrySet {
  const domeSeg = quality === 'high' ? 56 : 32;
  const strapSeg = quality === 'high' ? 40 : 24;
  const rivetSeg = quality === 'high' ? 10 : 7;

  const wallH = H - T;
  const wallY = (T + H) / 2;
  const strapX = [-0.46, 0, 0.46];
  const endBandX = [-(W / 2 - 0.075), W / 2 - 0.075];

  /* ---------------- body shell: five real planks, open top ---------------- */
  // uv v-scale controls how many wood staves appear: the texture holds 5 planks
  // per tile, so 0.8 over the 0.93-tall wall reads as ~4 courses of timber.
  const bodyWood = mergeParts([
    // floor
    { geo: box(W, T, D), p: [0, T / 2, 0], uv: [2.4, 0.6] },
    // front / back
    { geo: box(W, wallH, T), p: [0, wallY, D / 2 - T / 2], uv: [2.4, 0.8] },
    { geo: box(W, wallH, T), p: [0, wallY, -(D / 2 - T / 2)], uv: [2.4, 0.8] },
    // left / right
    { geo: box(T, wallH, D - T * 2), p: [-(W / 2 - T / 2), wallY, 0], uv: [1.5, 0.8] },
    { geo: box(T, wallH, D - T * 2), p: [W / 2 - T / 2, wallY, 0], uv: [1.5, 0.8] },
  ]);

  /* ---------------- interior lining (BackSide box = open top) ---------------- */
  const bodyLining = mergeParts([
    {
      geo: box(W - T * 2 - 0.012, H - T - 0.01, D - T * 2 - 0.012),
      p: [0, T + (H - T) / 2, 0],
      uv: [3, 2],
    },
  ]);

  /* ---------------- body brass ---------------- */
  const bodyBrassParts: Part[] = [];

  // horizontal rails, top and bottom, wrapping all four sides
  for (const y of [H - 0.085, 0.1]) {
    bodyBrassParts.push(
      { geo: box(W + 0.012, 0.09, 0.028), p: [0, y, D / 2 + 0.014], uv: [4, 1] },
      { geo: box(W + 0.012, 0.09, 0.028), p: [0, y, -(D / 2 + 0.014)], uv: [4, 1] },
      { geo: box(0.028, 0.09, D), p: [W / 2 + 0.014, y, 0], uv: [2.6, 1], uvRot: true },
      { geo: box(0.028, 0.09, D), p: [-(W / 2 + 0.014), y, 0], uv: [2.6, 1], uvRot: true },
    );
  }

  // vertical straps continuing the lid straps down the front and back
  for (const x of strapX) {
    for (const z of [D / 2 + 0.013, -(D / 2 + 0.013)]) {
      bodyBrassParts.push({
        geo: box(0.085, H - 0.12, 0.026),
        p: [x, H / 2 - 0.01, z],
        uv: [1.8, 1],
        uvRot: true,
      });
    }
  }

  // wrapped corner brackets (two plates per vertical edge)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      bodyBrassParts.push(
        {
          geo: box(0.13, H - 0.02, 0.026),
          p: [sx * (W / 2 - 0.065), H / 2, sz * (D / 2 + 0.013)],
          uv: [2.2, 1],
          uvRot: true,
        },
        {
          geo: box(0.026, H - 0.02, 0.13),
          p: [sx * (W / 2 + 0.013), H / 2, sz * (D / 2 - 0.065)],
          uv: [2.2, 1],
          uvRot: true,
        },
      );
    }
  }

  // brass lip around the opening, visible once the lid swings back
  bodyBrassParts.push(
    { geo: box(W, 0.032, T), p: [0, H + 0.016, D / 2 - T / 2], uv: [5, 1] },
    { geo: box(W, 0.032, T), p: [0, H + 0.016, -(D / 2 - T / 2)], uv: [5, 1] },
    { geo: box(T, 0.032, D - T * 2), p: [W / 2 - T / 2, H + 0.016, 0], uv: [3, 1], uvRot: true },
    { geo: box(T, 0.032, D - T * 2), p: [-(W / 2 - T / 2), H + 0.016, 0], uv: [3, 1], uvRot: true },
  );

  // escutcheon on the front, centred under the lid
  bodyBrassParts.push({
    geo: escutcheon(),
    p: [0, H - 0.31, D / 2 + 0.006],
    uv: [1.4, 1.4],
  });

  // Strap-hinge barrels on the rear, sitting on the pivot line. These are the
  // visible reason the lid can swing past vertical without fouling the rim.
  for (const x of [-0.62, 0, 0.62]) {
    const barrel = new THREE.CylinderGeometry(0.036, 0.036, 0.17, 12, 1);
    barrel.rotateZ(Math.PI / 2);
    bodyBrassParts.push({
      geo: barrel,
      p: [x, H + HINGE_LIFT, -(R + HINGE_BACK)],
      uv: [2, 1],
    });
    // leaf plate tying the barrel back onto the rear panel
    bodyBrassParts.push({
      geo: box(0.1, 0.16, 0.026),
      p: [x, H - 0.1, -(D / 2 + 0.014)],
      uv: [1, 1.4],
      uvRot: true,
    });
  }

  const bodyBrass = mergeParts(bodyBrassParts);

  /* ---------------- dark iron: side handles + feet ---------------- */
  const darkParts: Part[] = [];
  for (const sx of [-1, 1]) {
    const hx = sx * (W / 2 + 0.02);
    // swing handle
    const handle = new THREE.TorusGeometry(0.115, 0.019, 7, 18, Math.PI * 1.1);
    darkParts.push({
      geo: handle,
      p: [hx, H * 0.58, 0],
      r: [0, Math.PI / 2, Math.PI * 0.95],
    });
    // mounting bosses
    for (const sz of [-1, 1]) {
      darkParts.push({
        geo: box(0.05, 0.05, 0.05),
        p: [sx * (W / 2 + 0.008), H * 0.58 + 0.105, sz * 0.108],
      });
    }
  }
  // feet
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      darkParts.push({
        geo: box(0.17, 0.07, 0.17),
        p: [sx * (W / 2 - 0.1), -0.03, sz * (D / 2 - 0.1)],
      });
    }
  }
  const bodyDark = mergeParts(darkParts);

  /* ---------------- lid (local space: origin at the rear hinge pin) ---------------- */
  // The pivot sits at HINGE_POSITION, so the dome is offset forward and down to
  // land flush on the body rim when closed.
  const lidZ = R + HINGE_BACK;
  const lidY = -HINGE_LIFT;

  // u runs front-to-back over the dome (grain direction), v runs along the
  // chest width, so the plank seams read as staves running over the curve.
  const lidWood = mergeParts([
    { geo: dome(R, W, domeSeg), p: [0, lidY, lidZ], uv: [1.6, 1.4] },
  ]);

  const lidLining = mergeParts([
    { geo: dome(R - 0.055, W - T * 2, domeSeg, false), p: [0, lidY, lidZ], uv: [2, 3] },
  ]);

  const lidBrassParts: Part[] = [];
  // five straps wrapping over the dome. u follows the arc (the strap's long
  // axis) and v spans its width, so the engraved scroll runs along the strap.
  for (const x of endBandX) {
    lidBrassParts.push({
      geo: dome(R + 0.016, 0.135, strapSeg, false),
      p: [x, lidY, lidZ],
      uv: [4, 1],
    });
  }
  for (const x of strapX) {
    lidBrassParts.push({
      geo: dome(R + 0.015, 0.085, strapSeg, false),
      p: [x, lidY, lidZ],
      uv: [4, 1],
    });
  }
  // brass band along both lower edges of the lid
  lidBrassParts.push(
    { geo: box(W + 0.01, 0.062, 0.05), p: [0, lidY + 0.028, lidZ + R - 0.024], uv: [5, 1] },
    { geo: box(W + 0.01, 0.062, 0.05), p: [0, lidY + 0.028, lidZ - R + 0.024], uv: [5, 1] },
  );
  const lidBrass = mergeParts(lidBrassParts);

  /* ---------------- hasp (latch arm hanging from the lid front) ---------------- */
  // its own pivot: origin at the top of the arm so it can jiggle independently
  const hasp = mergeParts([
    { geo: box(0.115, 0.1, 0.05), p: [0, -0.045, 0], uv: [1.4, 1] },
    { geo: box(0.09, 0.2, 0.026), p: [0, -0.16, 0.026], uv: [1, 2.2], uvRot: true },
    // catch plate at the tip
    { geo: box(0.075, 0.05, 0.05), p: [0, -0.25, 0.02], uv: [1, 1] },
  ]);

  /* ---------------- rivets ---------------- */
  const rivet = new THREE.SphereGeometry(0.028, rivetSeg, Math.max(4, rivetSeg - 4));
  const up = new THREE.Vector3(0, 1, 0);
  const bodyRivets: THREE.Matrix4[] = [];
  const lidRivets: THREE.Matrix4[] = [];

  // lid straps: four per strap, symmetric front/back
  const lidThetas = [0.3, 0.82, Math.PI - 0.82, Math.PI - 0.3];
  const allLidX = [...endBandX, ...strapX];
  for (const x of allLidX) {
    const isEnd = endBandX.includes(x);
    for (const th of lidThetas) {
      const rr = R + (isEnd ? 0.02 : 0.019);
      const y = Math.sin(th) * rr + lidY;
      const z = Math.cos(th) * rr + lidZ;
      const n = new THREE.Vector3(0, Math.sin(th), Math.cos(th)).normalize();
      lidRivets.push(rivetMatrix(x, y, z, n, isEnd ? 1.05 : 0.9));
    }
  }

  // body rails
  for (const y of [H - 0.085, 0.1]) {
    for (const x of [-0.86, -0.24, 0.24, 0.86]) {
      for (const sz of [1, -1]) {
        bodyRivets.push(
          rivetMatrix(x, y, sz * (D / 2 + 0.024), new THREE.Vector3(0, 0, sz), 0.85),
        );
      }
    }
  }
  // vertical straps, top and bottom
  for (const x of strapX) {
    for (const y of [H - 0.235, 0.25]) {
      for (const sz of [1, -1]) {
        bodyRivets.push(
          rivetMatrix(x, y, sz * (D / 2 + 0.023), new THREE.Vector3(0, 0, sz), 0.8),
        );
      }
    }
  }
  // corner brackets
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const y of [H - 0.3, 0.3]) {
        bodyRivets.push(
          rivetMatrix(sx * (W / 2 - 0.065), y, sz * (D / 2 + 0.023), new THREE.Vector3(0, 0, sz), 0.8),
        );
        bodyRivets.push(
          rivetMatrix(sx * (W / 2 + 0.023), y, sz * (D / 2 - 0.065), new THREE.Vector3(sx, 0, 0), 0.8),
        );
      }
    }
  }
  // a few on the brass lip so the opening edge catches light
  for (const x of [-0.7, 0, 0.7]) {
    bodyRivets.push(rivetMatrix(x, H + 0.03, D / 2 - T / 2, up, 0.6));
  }

  const set: ChestGeometrySet = {
    bodyWood,
    bodyLining,
    bodyBrass,
    bodyDark,
    lidWood,
    lidLining,
    lidBrass,
    hasp,
    bodyRivets,
    lidRivets,
    rivet,
    dispose: () => {
      [
        bodyWood,
        bodyLining,
        bodyBrass,
        bodyDark,
        lidWood,
        lidLining,
        lidBrass,
        hasp,
        rivet,
      ].forEach((g) => g.dispose());
    },
  };
  return set;
}
