import { BufferGeometry, ExtrudeGeometry, Path, Shape } from "three";
import { outlineChamferBand, ringChamferBand } from "./hex-lattice.ts";
import { LID } from "./case-params.ts";

type Pt = [number, number];

/**
 * Floor-level teardrop pad-eye on the CSI + GPIO corner.
 * 16 mm necks into east + north. Voronoi-style tapered through-lines
 * run parallel to each neck; the eye collar stays solid.
 */
export const LUG = {
  bulbR: 7.0,
  holeR: 3.5,
  height: 3.0,
  chamfer: 0.4,
  outerChamfer: 0.35,
  out: 2.0,
  neck: 16,
  blend: 4.2,
  collar: 2.2,
  slotChamfer: 0.22,
} as const;

export function lugCenter() {
  return {
    hx: LID.length / 2 + LUG.out,
    hy: LID.width / 2 + LUG.out,
  };
}

export function lugKeepout(u: number, v: number, face: "east" | "north") {
  if (v > LUG.height + 1.4) return false;
  if (face === "east") return u > LID.width / 2 - LUG.neck - 1.2;
  if (face === "north") return u > LID.length / 2 - LUG.neck - 1.2;
  return false;
}

export function lugFloorKeepout(x: number, y: number) {
  const { hx, hy } = lugCenter();
  if (Math.hypot(x - hx, y - hy) < LUG.bulbR + 1.8) return true;
  const L2 = LID.length / 2;
  const W2 = LID.width / 2;
  for (const [px, py] of padCentersLocal()) {
    if (Math.hypot(x - px, y - py) < LID.screwBossR + 1.2) return false;
  }
  const onEast = x > L2 - 3.2 && y > W2 - LUG.neck - 1.2 && y < W2 + 1.2;
  const onNorth = y > W2 - 3.2 && x > L2 - LUG.neck - 1.2 && x < L2 + 1.2;
  return onEast || onNorth;
}

function tangentPair(px: number, py: number, cx: number, cy: number, r: number): [Pt, Pt] {
  const dx = px - cx;
  const dy = py - cy;
  const d2 = Math.max(dx * dx + dy * dy, r * r + 0.36);
  const a = (r * r) / d2;
  const h = (r * Math.sqrt(Math.max(1e-6, d2 - r * r))) / d2;
  return [
    [cx + a * dx - h * dy, cy + a * dy + h * dx],
    [cx + a * dx + h * dy, cy + a * dy - h * dx],
  ];
}

function pick(a: Pt, b: Pt, score: (p: Pt) => number) {
  return score(a) >= score(b) ? a : b;
}

function quad(a: Pt, c: Pt, b: Pt, n: number) {
  const pts: Pt[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ]);
  }
  return pts;
}

function unwrap(start: number, end: number, through: number) {
  let e = end;
  while (e < start) e += Math.PI * 2;
  let t = through;
  while (t < start) t += Math.PI * 2;
  if (t <= e) return e;
  return e + Math.PI * 2;
}

export function teardropCorner(segs: number): Pt[] {
  const L2 = LID.length / 2;
  const W2 = LID.width / 2;
  const { hx, hy } = lugCenter();
  const R = LUG.bulbR;
  const neck = LUG.neck;
  const eastRoot: Pt = [L2, W2 - neck];
  const northRoot: Pt = [L2 - neck, W2];
  const eT = pick(...tangentPair(eastRoot[0], eastRoot[1], hx, hy, R), (p) => p[0] + 0.35 * p[1]);
  const nT = pick(...tangentPair(northRoot[0], northRoot[1], hx, hy, R), (p) => p[1] + 0.35 * p[0]);
  let aE = Math.atan2(eT[1] - hy, eT[0] - hx);
  let aN = Math.atan2(nT[1] - hy, nT[0] - hx);
  aN = unwrap(aE, aN, Math.PI / 4);
  const ring: Pt[] = [eastRoot];
  ring.push(
    ...quad(eastRoot, [L2 + LUG.blend * 0.15, W2 - neck * 0.38], eT, Math.max(4, Math.floor(segs / 4))),
  );
  ring.push(eT);
  for (let i = 1; i < segs; i++) {
    const a = aE + ((aN - aE) * i) / segs;
    ring.push([hx + Math.cos(a) * R, hy + Math.sin(a) * R]);
  }
  ring.push(nT);
  ring.push(
    ...quad(nT, [L2 - neck * 0.38, W2 + LUG.blend * 0.15], northRoot, Math.max(4, Math.floor(segs / 4))),
  );
  ring.push(northRoot);
  ring.push(
    ...quad(northRoot, [L2 - 2.4, W2 - 2.4], eastRoot, Math.max(4, Math.floor(segs / 4))),
  );
  return ring;
}

function padCentersLocal(): Pt[] {
  const x0 = -LID.length / 2 + LID.wall + LID.boardClear + LID.holeOx;
  const y0 = -LID.width / 2 + LID.wall + LID.boardClear + LID.holeOy;
  return [
    [x0, y0],
    [x0 + LID.holeSx, y0],
    [x0, y0 + LID.holeSy],
    [x0 + LID.holeSx, y0 + LID.holeSy],
  ];
}

function pointInRing(ring: Pt[], x: number, y: number) {
  let w = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i]![1];
    const yj = ring[j]![1];
    const xi = ring[i]![0];
    const xj = ring[j]![0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) w = !w;
  }
  return w;
}

function nearest(ring: Pt[], p: Pt) {
  let best = 0;
  let d = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const dd = Math.hypot(ring[i][0] - p[0], ring[i][1] - p[1]);
    if (dd < d) {
      d = dd;
      best = i;
    }
  }
  return best;
}

function leftNormal(pts: Pt[], i: number): Pt {
  const prev = pts[Math.max(0, i - 1)];
  const next = pts[Math.min(pts.length - 1, i + 1)];
  const dx = next[0] - prev[0];
  const dy = next[1] - prev[1];
  const len = Math.hypot(dx, dy) || 1;
  return [-dy / len, dx / len];
}

function offsetOpen(pts: Pt[], dist: number): Pt[] {
  return pts.map((p, i) => {
    const n = leftNormal(pts, i);
    return [p[0] + n[0] * dist, p[1] + n[1] * dist];
  });
}

function facet(pts: Pt[], n: number): Pt[] {
  if (pts.length <= n) return pts;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    out.push(pts[Math.round((i * (pts.length - 1)) / (n - 1))]!);
  }
  return out;
}

function trimCollar(path: Pt[], hx: number, hy: number, keep: number) {
  const trimmed = path.filter((p) => Math.hypot(p[0] - hx, p[1] - hy) > keep);
  if (trimmed.length < 5) return trimmed;
  return trimmed.slice(1, -1);
}

/** Tapered strip: thin at t=0, thick at t=1. Closed loop. */
function slotLoop(path: Pt[], half0: number, half1: number): Pt[] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  const last = path.length - 1;
  for (let i = 0; i <= last; i++) {
    const t = last ? i / last : 0;
    const w = half0 + (half1 - half0) * t;
    const n = leftNormal(path, i);
    const p = path[i]!;
    left.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    right.push([p[0] - n[0] * w, p[1] - n[1] * w]);
  }
  return [...left, ...right.reverse()];
}

function loopArea(ring: Pt[]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]!;
    const q = ring[(i + 1) % ring.length]!;
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a;
}

function asHole(ring: Pt[]) {
  const pts = loopArea(ring) > 0 ? [...ring].reverse() : ring;
  const hole = new Path();
  hole.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) hole.lineTo(pts[i][0], pts[i][1]);
  hole.closePath();
  return { hole, ring: pts };
}

function neckSlots(path: Pt[], hx: number, hy: number, wallFirst: boolean, facets: number) {
  const collarR = LUG.holeR + LUG.collar;
  const out: { hole: Path; ring: Pt[] }[] = [];
  for (const dist of [2.05, 4.55]) {
    const raw = offsetOpen(path, dist);
    const trimmed = trimCollar(raw, hx, hy, collarR + 0.45);
    if (trimmed.length < 5) continue;
    const line = facet(trimmed, Math.min(facets, trimmed.length));
    const loop = wallFirst ? slotLoop(line, 0.38, 0.58) : slotLoop(line, 0.58, 0.38);
    if (Math.abs(loopArea(loop)) < 1.2) continue;
    out.push(asHole(loop));
  }
  return out;
}

export function buildKeyring(preview: boolean, draft = false): BufferGeometry[] {
  const { hx, hy } = lugCenter();
  const T = LUG.height;
  const segs = draft ? 10 : preview ? 18 : 26;
  const ring = teardropCorner(segs);
  const L2 = LID.length / 2;
  const W2 = LID.width / 2;
  const eastRoot: Pt = [L2, W2 - LUG.neck];
  const northRoot: Pt = [L2 - LUG.neck, W2];
  const iE = nearest(ring, eastRoot);
  const iN = nearest(ring, northRoot);
  const eTGuess: Pt = [hx + LUG.bulbR, hy];
  const nTGuess: Pt = [hx, hy + LUG.bulbR];
  const iET = nearest(ring, eTGuess);
  const iNT = nearest(ring, nTGuess);
  const eastPath = ring.slice(Math.min(iE, iET), Math.max(iE, iET) + 1);
  const northPath = ring.slice(Math.min(iNT, iN), Math.max(iNT, iN) + 1);

  const tab = new Shape();
  tab.moveTo(ring[0][0], ring[0][1]);
  for (let i = 1; i < ring.length; i++) tab.lineTo(ring[i][0], ring[i][1]);
  tab.closePath();
  const eye = new Path();
  eye.absarc(hx, hy, LUG.holeR, 0, Math.PI * 2, true);
  tab.holes.push(eye);

  const clearR = LID.screwBossR + 0.3;
  for (const [px, py] of padCentersLocal()) {
    if (pointInRing(ring, px, py) || Math.hypot(px - hx, py - hy) < LUG.bulbR + clearR) {
      const bore = new Path();
      bore.absarc(px, py, clearR, 0, Math.PI * 2, true);
      tab.holes.push(bore);
    }
  }

  const slots = draft
    ? []
    : [
        ...neckSlots(eastPath, hx, hy, true, preview ? 7 : 9),
        ...neckSlots(northPath, hx, hy, false, preview ? 7 : 9),
      ];
  for (const s of slots) tab.holes.push(s.hole);

  const tabGeom = new ExtrudeGeometry(tab, {
    depth: T,
    bevelEnabled: false,
    curveSegments: draft ? 6 : 10,
    steps: 1,
  });
  if (draft) return [tabGeom];
  const holeSegs = preview ? 16 : 24;
  const C = LUG.chamfer;
  const Co = LUG.outerChamfer;
  const Cs = LUG.slotChamfer;
  const parts: BufferGeometry[] = [
    tabGeom,
    ringChamferBand(hx, hy, LUG.holeR + C, LUG.holeR, T, T - C, holeSegs),
    ringChamferBand(hx, hy, LUG.holeR + C, LUG.holeR, 0, C, holeSegs),
    outlineChamferBand(ring, Co, T, T - Co),
    outlineChamferBand(ring, Co, 0, Co),
  ];
  for (const s of slots) {
    parts.push(outlineChamferBand(s.ring, Cs, T, T - Cs));
    parts.push(outlineChamferBand(s.ring, Cs, 0, Cs));
  }
  return parts;
}
