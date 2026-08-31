import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { Delaunay } from "d3-delaunay";
import { preparePrintSolid } from "./print-solid.ts";
import { triggerDownload } from "./stl-download.ts";
import { hullLid, hullTray } from "./preview-hulls.ts";

export {
  FASTENERS,
  LID,
  LATTICE_MAX_EDGES,
  LLOYD_ITERS,
  PI_ZERO,
  PRINT,
  PRINT_FIT_DEFAULT,
  PRINT_FITS,
  HDMI_PLUG_DEFAULT,
  HDMI_PLUGS,
  USB_PLUG_DEFAULT,
  USB_PLUGS,
  KEYRING_DEFAULT,
  KEYRINGS,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  STEP_PRESETS,
  TRAY_RIM,
  formatScale,
  portMmLine,
  printFitSpec,
  printSheet,
  printPairZipName,
  sleeveSpec,
  southPortBand,
  southPortWidth,
} from "./case-params.ts";
export type { Fastener, PrintFit, StepSize, HdmiPlug, UsbPlug, Keyring } from "./case-params.ts";

import {
  LID,
  LLOYD_ITERS,
  PI_ZERO,
  PRINT_FIT_DEFAULT,
  HDMI_PLUG_DEFAULT,
  USB_PLUG_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  printFitSpec,
  southPortBand,
  southPortWidth,
  type PrintFit,
  type HdmiPlug,
  type UsbPlug,
} from "./case-params.ts";

export const TRAY_RELIEF = 0.42;
export type MeshQuality = "draft" | "preview" | "print";
type Pt = [number, number];
type Box = { xmin: number; xmax: number; ymin: number; ymax: number };
export type VoronoiPt = Pt;
export type LatticeEdge = { x: number; y: number; rotZ: number; len: number };

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function dist2(a: Pt, b: Pt) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

export function boardOrigin(): Pt {
  return [-LID.length / 2 + LID.wall + LID.boardClear, -LID.width / 2 + LID.wall + LID.boardClear];
}

export function padCenters(): Pt[] {
  const [bx, by] = boardOrigin();
  const out: Pt[] = [];
  for (const dx of [0, PI_ZERO.holeSx]) {
    for (const dy of [0, PI_ZERO.holeSy]) out.push([bx + PI_ZERO.holeOx + dx, by + PI_ZERO.holeOy + dy]);
  }
  return out;
}

export function soffitIslandR() {
  return LID.socketR + 0.675 + 0.9;
}

export function uniformSoffit() {
  const r = soffitIslandR();
  const hw = LID.length / 2;
  const hh = LID.width / 2;
  let t = Infinity;
  for (const [x, y] of padCenters()) {
    t = Math.min(t, hw + x + r, hw - x + r, hh + y + r, hh - y + r);
  }
  return t;
}

export function outerRim() {
  return Math.max(2.4, uniformSoffit() - 2 * soffitIslandR());
}

export function latticeBounds() {
  const t = uniformSoffit();
  const rim = outerRim();
  return {
    xmin: -LID.length / 2 + t,
    xmax: LID.length / 2 - t,
    ymin: -LID.width / 2 + rim,
    ymax: LID.width / 2 - rim,
  };
}

export function portWindows(hdmi: HdmiPlug = HDMI_PLUG_DEFAULT, usb: UsbPlug = USB_PLUG_DEFAULT) {
  const [bx] = boardOrigin();
  const hdmiW = southPortWidth("hdmi", hdmi);
  const usbW = southPortWidth("usb", usb);
  const hdmiZ = southPortBand(hdmi, PI_ZERO.hdmiJackH, 0.5);
  const usbZ = southPortBand(usb, PI_ZERO.usbJackH, 0.4);
  const mk = (id: string, cx: number, w: number, z: { z0: number; z1: number }) => ({
    id,
    x0: cx - w / 2,
    x1: cx + w / 2,
    z0: z.z0,
    z1: z.z1,
  });
  return [
    mk("hdmi", bx + PI_ZERO.hdmi, hdmiW, hdmiZ),
    mk("usbPower", bx + PI_ZERO.usbPower, usbW, usbZ),
    mk("usbOtg", bx + PI_ZERO.usbOtg, usbW, usbZ),
  ];
}

export function sideWindows() {
  const [, by] = boardOrigin();
  const pcbTop = LID.floor + LID.standoff + PI_ZERO.pcb;
  const z0 = pcbTop - 0.25;
  const z1 = 7;
  const sdC = by + PI_ZERO.sdFromSouth;
  const sdH = 13.6;
  const csiC = (-8.5 + 9.6) / 2;
  const csiH = 18.1;
  return [
    { id: "sd", y0: sdC - sdH / 2, y1: sdC + sdH / 2, z0, z1, xFace: -LID.length / 2 },
    { id: "csi", y0: csiC - csiH / 2, y1: csiC + csiH / 2, z0, z1, xFace: LID.length / 2 },
  ];
}

export function caseDims() {
  const [bx, by] = boardOrigin();
  return {
    length: LID.length,
    width: LID.width,
    trayH: LID.trayH,
    floor: LID.floor,
    pegH: LID.pegH,
    boardOrigin: [bx, by] as Pt,
    southPorts: portWindows(),
    sidePorts: sideWindows(),
    holes: padCenters(),
  };
}

export function screwKeepoutR(holeR: number = LID.screwClearR) {
  return holeR + LID.lattice / 2 + 0.2;
}

function closeRing(pts: Pt[]): Pt[] {
  if (pts.length < 2) return pts.slice();
  const a = pts[0];
  const b = pts[pts.length - 1];
  if (Math.abs(a[0] - b[0]) < 1e-8 && Math.abs(a[1] - b[1]) < 1e-8) return pts.slice(0, -1);
  return pts.slice();
}

function signedArea(ring: Pt[]) {
  let a = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a * 0.5;
}

function cellArea(cell: Pt[]) {
  return Math.abs(signedArea(closeRing(cell)));
}

function polyCentroid(ring0: Pt[]): Pt {
  const ring = closeRing(ring0);
  let a = 0;
  let x = 0;
  let y = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % n];
    const c = p[0] * q[1] - q[0] * p[1];
    a += c;
    x += (p[0] + q[0]) * c;
    y += (p[1] + q[1]) * c;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-8) {
    let sx = 0;
    let sy = 0;
    for (const p of ring) {
      sx += p[0];
      sy += p[1];
    }
    return [sx / n, sy / n];
  }
  return [x / (6 * a), y / (6 * a)];
}

function poissonDisk(rng: () => number, sample: () => Pt, radius: number, attempts: number): Pt[] {
  const r2 = radius * radius;
  const cell = radius / Math.SQRT2;
  const grid = new Map<string, Pt>();
  const pts: Pt[] = [];
  const occupied = (p: Pt) => {
    const gx = Math.floor(p[0] / cell);
    const gy = Math.floor(p[1] / cell);
    for (let i = gx - 2; i <= gx + 2; i++) {
      for (let j = gy - 2; j <= gy + 2; j++) {
        const q = grid.get(`${i},${j}`);
        if (q && dist2(p, q) < r2) return true;
      }
    }
    return false;
  };
  for (let i = 0; i < attempts; i++) {
    const p = sample();
    if (occupied(p)) continue;
    pts.push(p);
    grid.set(`${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`, p);
  }
  let miss = 0;
  while (miss < 800) {
    const p = sample();
    if (occupied(p)) {
      miss++;
      continue;
    }
    miss = 0;
    pts.push(p);
    grid.set(`${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`, p);
  }
  return pts;
}

function clipToWindow(p: Pt, box: Box, pad = 0.12): Pt {
  const r = windowCornerR();
  const ibox: Box = {
    xmin: box.xmin + pad,
    xmax: box.xmax - pad,
    ymin: box.ymin + pad,
    ymax: box.ymax - pad,
  };
  return projectToRoundedRect(p, ibox, Math.max(0.5, r - pad));
}

function cellsForSeeds(interior: Pt[], box: Box, ontoOmega = false): Pt[][] {
  const ghosts: Pt[] = [];
  for (const p of interior) {
    const lx = 2 * box.xmin - p[0];
    const rx = 2 * box.xmax - p[0];
    const by = 2 * box.ymin - p[1];
    const ty = 2 * box.ymax - p[1];
    ghosts.push([lx, p[1]], [rx, p[1]], [p[0], by], [p[0], ty]);
    ghosts.push([lx, by], [rx, by], [lx, ty], [rx, ty]);
  }
  const delaunay = Delaunay.from(interior.concat(ghosts));
  const voronoi = delaunay.voronoi([box.xmin, box.ymin, box.xmax, box.ymax]);
  const cells: Pt[][] = [];
  for (let i = 0; i < interior.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length < 4) {
      cells.push([]);
      continue;
    }
    const ring: Pt[] = cell.map((p) => [p[0], p[1]] as Pt);
    cells.push(ontoOmega ? clipCellToOmega(ring, box) : ring);
  }
  return cells;
}

const LLOYD_MEAN_EPS = 0.04;
const LLOYD_MAX_EPS = 0.12;

type LloydStats = { mean: number; max: number; energy: number; iters: number };

function lloydResidual(seeds: Pt[], cells: Pt[][], box: Box, pad: number): Omit<LloydStats, "iters"> {
  let sum = 0;
  let max = 0;
  let energy = 0;
  let k = 0;
  for (let i = 0; i < seeds.length; i++) {
    if (cells[i].length < 4) continue;
    const c = clipToWindow(polyCentroid(cells[i]), box, pad);
    const d = Math.hypot(c[0] - seeds[i][0], c[1] - seeds[i][1]);
    sum += d;
    if (d > max) max = d;
    energy += cellArea(cells[i]) * d * d;
    k++;
  }
  return { mean: k ? sum / k : 0, max, energy };
}

function lloydRelax(seeds: Pt[], box: Box, iters: number, pad: number): LloydStats {
  let stats: LloydStats = { mean: Infinity, max: Infinity, energy: Infinity, iters: 0 };
  let prevE = Infinity;
  for (let n = 0; n < iters; n++) {
    const cells = cellsForSeeds(seeds, box, true);
    const r = lloydResidual(seeds, cells, box, pad);
    stats = { ...r, iters: n };
    if (r.mean < LLOYD_MEAN_EPS && r.max < LLOYD_MAX_EPS) break;
    const relE = Math.abs(prevE - r.energy) / Math.max(prevE, 1e-9);
    if (n > 1 && relE < 1e-4 && r.mean < 0.1) break;
    for (let i = 0; i < seeds.length; i++) {
      if (cells[i].length < 4) continue;
      const c = clipToWindow(polyCentroid(cells[i]), box, pad);
      seeds[i] = [c[0], c[1]];
    }
    prevE = r.energy;
    stats.iters = n + 1;
  }
  if (stats.iters === iters) {
    const r = lloydResidual(seeds, cellsForSeeds(seeds, box, true), box, pad);
    stats = { ...r, iters };
  }
  return stats;
}

function windowCornerR() {
  return LID.corner;
}

function windowCenters(box: Box, r: number) {
  return [
    { cx: box.xmin + r, cy: box.ymin + r, a0: Math.PI, a1: Math.PI * 1.5, corner: [box.xmin, box.ymin] as Pt },
    { cx: box.xmax - r, cy: box.ymin + r, a0: -Math.PI / 2, a1: 0, corner: [box.xmax, box.ymin] as Pt },
    { cx: box.xmax - r, cy: box.ymax - r, a0: 0, a1: Math.PI / 2, corner: [box.xmax, box.ymax] as Pt },
    { cx: box.xmin + r, cy: box.ymax - r, a0: Math.PI / 2, a1: Math.PI, corner: [box.xmin, box.ymax] as Pt },
  ];
}

function projectToRoundedRect(p: Pt, box: Box, r: number): Pt {
  const x = Math.min(box.xmax, Math.max(box.xmin, p[0]));
  const y = Math.min(box.ymax, Math.max(box.ymin, p[1]));
  for (const c of windowCenters(box, r)) {
    const inX = c.cx < (box.xmin + box.xmax) / 2 ? x < c.cx : x > c.cx;
    const inY = c.cy < (box.ymin + box.ymax) / 2 ? y < c.cy : y > c.cy;
    if (!inX || !inY) continue;
    const dx = x - c.cx;
    const dy = y - c.cy;
    const d = Math.hypot(dx, dy) || 1;
    if (d > r) return [c.cx + (dx / d) * r, c.cy + (dy / d) * r];
  }
  return [x, y];
}

function closestOnWindow(p: Pt, box: Box, r: number): Pt {
  const yStraight = Math.min(box.ymax - r, Math.max(box.ymin + r, p[1]));
  const xStraight = Math.min(box.xmax - r, Math.max(box.xmin + r, p[0]));
  const candidates: Pt[] = [
    [box.xmin, yStraight],
    [box.xmax, yStraight],
    [xStraight, box.ymin],
    [xStraight, box.ymax],
  ];
  for (const c of windowCenters(box, r)) {
    const dx = p[0] - c.cx;
    const dy = p[1] - c.cy;
    const d = Math.hypot(dx, dy) || 1;
    candidates.push([c.cx + (dx / d) * r, c.cy + (dy / d) * r]);
  }
  let best = candidates[0];
  let bd = Infinity;
  for (const q of candidates) {
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  return best;
}

function onWindowOutline(p: Pt, box: Box, r: number, eps = 0.22) {
  const q = closestOnWindow(p, box, r);
  return Math.hypot(p[0] - q[0], p[1] - q[1]) < eps;
}

function ptKey(p: Pt) {
  return `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
}

function perimeter(ring0: Pt[]) {
  const ring = closeRing(ring0);
  let p = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    p += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return p;
}

function inradius(cell: Pt[]) {
  const a = cellArea(cell);
  const s = perimeter(cell) / 2;
  return s > 1e-6 ? a / s : 0;
}

function touchesWindow(cell: Pt[], box: Box, r: number) {
  for (const p of cell) if (onWindowOutline(p, box, r, 0.35)) return true;
  return false;
}

function dedupRing(ring: Pt[], eps = 0.06): Pt[] {
  const out: Pt[] = [];
  for (const p of ring) {
    const q = out[out.length - 1];
    if (q && Math.hypot(p[0] - q[0], p[1] - q[1]) < eps) continue;
    out.push(p);
  }
  if (out.length >= 2) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < eps) out.pop();
  }
  return out;
}

function flattenSkinnyBoundaryCells(cells: Pt[][], box: Box, r: number, minR: number): Pt[][] {
  const snap = new Set<string>();
  for (const cell of cells) {
    if (cell.length < 3) continue;
    if (inradius(cell) >= minR) continue;
    if (!touchesWindow(cell, box, r)) continue;
    for (const p of cell) {
      if (onWindowOutline(p, box, r, 0.35)) continue;
      const q = closestOnWindow(p, box, r);
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 2.4) snap.add(ptKey(p));
    }
  }
  if (snap.size === 0) return cells;
  return cells.map((cell) => {
    const next = cell.map((p) => (snap.has(ptKey(p)) ? closestOnWindow(p, box, r) : p));
    return dedupRing(next, 0.08);
  });
}

function filletWindowCorners(ring: Pt[], box: Box, r: number, segs: number): Pt[] {
  const src = closeRing(ring);
  const out: Pt[] = [];
  const eps = 0.08;
  for (const curr of src) {
    const hit = windowCenters(box, r).find((c) => Math.hypot(curr[0] - c.corner[0], curr[1] - c.corner[1]) < eps);
    if (hit) {
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const a = hit.a0 + (hit.a1 - hit.a0) * t;
        out.push([hit.cx + Math.cos(a) * r, hit.cy + Math.sin(a) * r]);
      }
      continue;
    }
    out.push(projectToRoundedRect(curr, box, r));
  }
  const dedup = dedupRing(out, 0.05);
  return dedup.length >= 3 ? dedup : src;
}

function clipCellToOmega(ring: Pt[], box: Box): Pt[] {
  const r = windowCornerR();
  const filleted = filletWindowCorners(insertBoxCorners(ring, box), box, r, 8);
  const projected = filleted.map((p) => projectToRoundedRect(p, box, r));
  const clipped = dedupRing(projected, 0.06);
  return clipped.length >= 4 ? clipped : ring;
}

function offsetConvex(poly: Pt[], dist: number, edgeDist?: (a: Pt, b: Pt) => number): Pt[] | null {
  const ring = closeRing(poly);
  if (ring.length < 3) return null;
  if (signedArea(ring) < 0) ring.reverse();
  const n0 = ring.length;
  const nx: number[] = [];
  const ny: number[] = [];
  const ds: number[] = [];
  const verts: Pt[] = [];
  for (let i = 0; i < n0; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % n0];
    const lx = b[0] - a[0];
    const ly = b[1] - a[1];
    const len = Math.hypot(lx, ly);
    if (len < 0.04) continue;
    nx.push(-ly / len);
    ny.push(lx / len);
    ds.push(edgeDist ? edgeDist(a, b) : dist);
    verts.push(a);
  }
  const m = nx.length;
  if (m < 3) return null;
  const out: Pt[] = [];
  for (let i = 0; i < m; i++) {
    const i0 = (i + m - 1) % m;
    const d0 = ds[i0];
    const d1 = ds[i];
    const det = nx[i0] * ny[i] - ny[i0] * nx[i];
    const orig = verts[i];
    if (Math.abs(det) < 1e-8) {
      out.push([orig[0] + nx[i] * d1, orig[1] + ny[i] * d1]);
      continue;
    }
    const c0 = nx[i0] * orig[0] + ny[i0] * orig[1] + d0;
    const c1 = nx[i] * orig[0] + ny[i] * orig[1] + d1;
    out.push([(c0 * ny[i] - c1 * ny[i0]) / det, (nx[i0] * c1 - nx[i] * c0) / det]);
  }
  const clean = dedupRing(out, 0.04);
  if (clean.length < 3 || cellArea(clean) < 0.2) return null;
  if (signedArea(clean) < 0) clean.reverse();
  return clean;
}

function scaleTowardCentroid(poly: Pt[], dist: number): Pt[] | null {
  const ring = closeRing(poly);
  if (ring.length < 3) return null;
  const c = polyCentroid(ring);
  const out: Pt[] = [];
  for (const p of ring) {
    const dx = p[0] - c[0];
    const dy = p[1] - c[1];
    const len = Math.hypot(dx, dy) || 1;
    const s = Math.max(0.2, 1 - dist / len);
    out.push([c[0] + dx * s, c[1] + dy * s]);
  }
  const clean = dedupRing(out, 0.04);
  return clean.length >= 3 && cellArea(clean) >= 0.4 ? clean : null;
}

function roundConvex(ring0: Pt[], r: number, segs: number, box?: Box): Pt[] {
  if (r < 0.05 || segs < 1) return closeRing(ring0);
  const ring = closeRing(ring0);
  if (ring.length < 3) return ring;
  if (signedArea(ring) < 0) ring.reverse();
  const n = ring.length;
  const out: Pt[] = [];
  const wr = windowCornerR();
  for (let i = 0; i < n; i++) {
    const a = ring[(i + n - 1) % n];
    const b = ring[i];
    const c = ring[(i + 1) % n];
    if (box && onWindowOutline(b, box, wr, 0.35)) {
      out.push(b);
      continue;
    }
    const v1x = a[0] - b[0];
    const v1y = a[1] - b[1];
    const v2x = c[0] - b[0];
    const v2y = c[1] - b[1];
    const l1 = Math.hypot(v1x, v1y) || 1;
    const l2 = Math.hypot(v2x, v2y) || 1;
    const cut = Math.min(r, l1 * 0.42, l2 * 0.42);
    if (cut < 0.04) {
      out.push(b);
      continue;
    }
    const p0: Pt = [b[0] + (v1x / l1) * cut, b[1] + (v1y / l1) * cut];
    const p1: Pt = [b[0] + (v2x / l2) * cut, b[1] + (v2y / l2) * cut];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const mt = 1 - t;
      out.push([
        mt * mt * p0[0] + 2 * mt * t * b[0] + t * t * p1[0],
        mt * mt * p0[1] + 2 * mt * t * b[1] + t * t * p1[1],
      ]);
    }
  }
  const clean = dedupRing(out, 0.04);
  return clean.length >= 3 ? clean : ring;
}

function pathFromRing(ring: Pt[], hole: boolean): Path {
  const src = closeRing(ring);
  const p = new Path();
  if (src.length < 3) return p;
  const ccw = signedArea(src) > 0;
  const pts = hole === ccw ? src.slice().reverse() : src;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  p.closePath();
  return p;
}

function roundedRectPath(shape: Shape | Path, w: number, h: number, r: number, ccw: boolean) {
  roundedRectAt(shape, 0, 0, w, h, r, ccw);
}

export function roundedRectAt(shape: Shape | Path, cx: number, cy: number, w: number, h: number, r: number, ccw: boolean) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const k = Math.min(r, w / 2 - 0.05, h / 2 - 0.05);
  if (ccw) {
    shape.moveTo(x + k, y);
    shape.lineTo(x + w - k, y);
    shape.absarc(x + w - k, y + k, k, -Math.PI / 2, 0, false);
    shape.lineTo(x + w, y + h - k);
    shape.absarc(x + w - k, y + h - k, k, 0, Math.PI / 2, false);
    shape.lineTo(x + k, y + h);
    shape.absarc(x + k, y + h - k, k, Math.PI / 2, Math.PI, false);
    shape.lineTo(x, y + k);
    shape.absarc(x + k, y + k, k, Math.PI, Math.PI * 1.5, false);
  } else {
    shape.moveTo(x + k, y);
    shape.absarc(x + k, y + k, k, -Math.PI / 2, -Math.PI, true);
    shape.lineTo(x, y + h - k);
    shape.absarc(x + k, y + h - k, k, Math.PI, Math.PI / 2, true);
    shape.lineTo(x + w - k, y + h);
    shape.absarc(x + w - k, y + h - k, k, Math.PI / 2, 0, true);
    shape.lineTo(x + w, y + k);
    shape.absarc(x + w - k, y + k, k, 0, -Math.PI / 2, true);
  }
  shape.closePath();
}

function roundedRectLoop(w: number, h: number, r: number, segs = 8): Pt[] {
  const x = -w / 2;
  const y = -h / 2;
  const k = Math.min(r, w / 2 - 0.05, h / 2 - 0.05);
  const corners: [number, number, number, number][] = [
    [x + k, y + k, Math.PI, Math.PI * 1.5],
    [x + w - k, y + k, -Math.PI / 2, 0],
    [x + w - k, y + h - k, 0, Math.PI / 2],
    [x + k, y + h - k, Math.PI / 2, Math.PI],
  ];
  const pts: Pt[] = [];
  for (const [cx, cy, a0, a1raw] of corners) {
    const a1 = a1raw < a0 ? a1raw + Math.PI * 2 : a1raw;
    for (let i = 0; i < segs; i++) {
      const t = a0 + ((a1 - a0) * i) / segs;
      pts.push([cx + Math.cos(t) * k, cy + Math.sin(t) * k]);
    }
  }
  return pts;
}

export function outerEdgeChamfer(w: number, h: number, r: number, c: number, zFace: number, zWall: number, segs = 8) {
  const face = roundedRectLoop(w - 2 * c, h - 2 * c, Math.max(0.2, r - c), segs);
  const wall = roundedRectLoop(w, h, r, segs);
  return filletBand(face, wall, zFace, zWall, 1);
}

/** Quarter-round strip: outer@z0 (face) → inner@z1 (bore / wall). */
export function filletBand(outer: Pt[], inner: Pt[], z0: number, z1: number, arcSegs = 4) {
  const n = Math.min(outer.length, inner.length);
  const pos: number[] = [];
  const push = (x: number, y: number, z: number) => pos.push(x, y, z);
  const at = (i: number, s: number): [number, number, number] => {
    const φ = (s / arcSegs) * (Math.PI / 2);
    const co = Math.cos(φ);
    const sn = Math.sin(φ);
    const o = outer[i]!;
    const q = inner[i]!;
    return [q[0] + (o[0] - q[0]) * co, q[1] + (o[1] - q[1]) * co, z0 + (z1 - z0) * sn];
  };
  for (let s = 0; s < arcSegs; s++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = at(i, s);
      const b = at(j, s);
      const c = at(j, s + 1);
      const d = at(i, s + 1);
      push(a[0], a[1], a[2]);
      push(b[0], b[1], b[2]);
      push(c[0], c[1], c[2]);
      push(a[0], a[1], a[2]);
      push(c[0], c[1], c[2]);
      push(d[0], d[1], d[2]);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  return g;
}

function insertBoxCorners(ring: Pt[], box: Box, eps = 0.18): Pt[] {
  const onW = (p: Pt) => Math.abs(p[0] - box.xmin) < eps;
  const onE = (p: Pt) => Math.abs(p[0] - box.xmax) < eps;
  const onS = (p: Pt) => Math.abs(p[1] - box.ymin) < eps;
  const onN = (p: Pt) => Math.abs(p[1] - box.ymax) < eps;
  const src = closeRing(ring);
  const out: Pt[] = [];
  for (let i = 0; i < src.length; i++) {
    const a = src[i];
    const b = src[(i + 1) % src.length];
    out.push(a);
    if (onW(a) && onS(b) && !onS(a)) out.push([box.xmin, box.ymin]);
    else if (onS(a) && onE(b) && !onE(a)) out.push([box.xmax, box.ymin]);
    else if (onE(a) && onN(b) && !onN(a)) out.push([box.xmax, box.ymax]);
    else if (onN(a) && onW(b) && !onW(a)) out.push([box.xmin, box.ymax]);
    else if (onS(a) && onW(b) && !onW(a)) out.push([box.xmin, box.ymin]);
    else if (onE(a) && onS(b) && !onS(a)) out.push([box.xmax, box.ymin]);
    else if (onN(a) && onE(b) && !onE(a)) out.push([box.xmax, box.ymax]);
    else if (onW(a) && onN(b) && !onN(a)) out.push([box.xmin, box.ymax]);
  }
  return dedupRing(out, 0.08);
}

function seedPoints(scale: number): Pt[] {
  const rng = mulberry32(11);
  const box = latticeBounds();
  const r = windowCornerR();
  const spacing = 3.05 * scale;
  const minD = spacing * 0.78;
  const pts: Pt[] = [];
  const ok = (p: Pt) => {
    const q = projectToRoundedRect(p, box, r);
    return Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.05;
  };
  const accept = (p: Pt) => {
    const q = clipToWindow(p, box, 0.2);
    if (!ok(q) && Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.4) return false;
    if (pts.every((s) => dist2(s, q) > minD * minD)) {
      pts.push(q);
      return true;
    }
    return false;
  };
  for (const c of windowCenters(box, r)) accept([c.cx, c.cy]);
  const sides: { a: Pt; b: Pt; nx: number; ny: number }[] = [
    { a: [box.xmin + r, box.ymin], b: [box.xmax - r, box.ymin], nx: 0, ny: 1 },
    { a: [box.xmax, box.ymin + r], b: [box.xmax, box.ymax - r], nx: -1, ny: 0 },
    { a: [box.xmax - r, box.ymax], b: [box.xmin + r, box.ymax], nx: 0, ny: -1 },
    { a: [box.xmin, box.ymax - r], b: [box.xmin, box.ymin + r], nx: 1, ny: 0 },
  ];
  const inset = spacing * 0.4;
  for (const s of sides) {
    const dx = s.b[0] - s.a[0];
    const dy = s.b[1] - s.a[1];
    const len = Math.hypot(dx, dy) || 1;
    let t = (0.28 + rng() * 0.35) * spacing;
    while (t < len - 0.22 * spacing) {
      const u = t / len;
      accept([s.a[0] + dx * u + s.nx * inset, s.a[1] + dy * u + s.ny * inset]);
      t += (0.78 + rng() * 0.4) * spacing;
    }
  }
  const filled = poissonDisk(
    rng,
    () => {
      const p: Pt = [box.xmin + rng() * (box.xmax - box.xmin), box.ymin + rng() * (box.ymax - box.ymin)];
      return ok(p) ? p : clipToWindow(p, box, 0.25);
    },
    minD,
    Math.min(8000, Math.round(4000 / (scale * scale))),
  );
  for (const p of filled) accept(p);
  return pts;
}

function mergeCloseVertices(ring: Pt[], minLen: number, box: Box): Pt[] {
  const wr = windowCornerR();
  const src = closeRing(ring);
  const out: Pt[] = [];
  for (const p of src) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= minLen) {
      out.push(p);
      continue;
    }
    const pOn = onWindowOutline(p, box, wr, 0.3);
    const qOn = onWindowOutline(q, box, wr, 0.3);
    if (pOn && qOn) {
      out.push(p);
      continue;
    }
    if (pOn) out[out.length - 1] = p;
    else if (!qOn) out[out.length - 1] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  }
  if (out.length >= 2) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < minLen) {
      const aOn = onWindowOutline(a, box, wr, 0.3);
      const bOn = onWindowOutline(b, box, wr, 0.3);
      if (!(aOn && bOn)) {
        if (aOn) out.pop();
        else if (bOn) out.shift();
        else {
          out[0] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          out.pop();
        }
      }
    }
  }
  return dedupRing(out, Math.min(0.08, minLen * 0.35));
}

function aabbFill(cell: Pt[]) {
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;
  for (const p of cell) {
    if (p[0] < xmin) xmin = p[0];
    if (p[0] > xmax) xmax = p[0];
    if (p[1] < ymin) ymin = p[1];
    if (p[1] > ymax) ymax = p[1];
  }
  const boxA = (xmax - xmin) * (ymax - ymin);
  return boxA < 1e-6 ? 1 : cellArea(cell) / boxA;
}

function axisAlignedEdges(cell: Pt[]) {
  const ring = closeRing(cell);
  let n = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 0.25) continue;
    if (Math.abs(b[0] - a[0]) / len < 0.22 || Math.abs(b[1] - a[1]) / len < 0.22) n++;
  }
  return n;
}

function isRectangularStar(c: Pt, pts: Pt[]) {
  if (pts.length !== 4) return false;
  const ang = pts
    .map((p) => ({ p, a: Math.atan2(p[1] - c[1], p[0] - c[0]) }))
    .sort((a, b) => a.a - b.a);
  const lens: number[] = [];
  let ortho = 0;
  for (let i = 0; i < 4; i++) {
    const a = ang[i].p;
    const b = ang[(i + 1) % 4].p;
    const vax = a[0] - c[0];
    const vay = a[1] - c[1];
    const vbx = b[0] - c[0];
    const vby = b[1] - c[1];
    const la = Math.hypot(vax, vay) || 1;
    const lb = Math.hypot(vbx, vby) || 1;
    lens.push(la);
    const dot = (vax * vbx + vay * vby) / (la * lb);
    if (Math.abs(dot) < 0.38) ortho++;
  }
  const mean = (lens[0] + lens[1] + lens[2] + lens[3]) / 4;
  const even = lens.every((l) => Math.abs(l - mean) / mean < 0.5);
  return even && ortho >= 3;
}

function breakDelaunayRectangles(seeds: Pt[], box: Box, rng: () => number, spacing: number) {
  const d = Delaunay.from(seeds);
  const minD2 = (spacing * 0.22) ** 2;
  const extras: Pt[] = [];
  for (let i = 0; i < seeds.length; i++) {
    const nbrs: Pt[] = [];
    for (const j of d.neighbors(i)) {
      if (j >= 0 && j < seeds.length) nbrs.push(seeds[j]);
    }
    if (nbrs.length !== 4 || !isRectangularStar(seeds[i], nbrs)) continue;
    const far = nbrs.reduce((a, p) => (dist2(p, seeds[i]) > dist2(a, seeds[i]) ? p : a), nbrs[0]);
    const t = 0.28 + rng() * 0.18;
    const px = seeds[i][0] + t * (far[0] - seeds[i][0]) + (rng() - 0.5) * spacing * 0.16;
    const py = seeds[i][1] + t * (far[1] - seeds[i][1]) + (rng() - 0.5) * spacing * 0.16;
    extras.push(clipToWindow([px, py], box, 0.2));
  }
  for (const p of extras) {
    if (seeds.every((q) => dist2(p, q) > minD2)) seeds.push(p);
  }
}

function isBoxy(cell: Pt[]) {
  const n = closeRing(cell).length;
  if (n <= 4) return true;
  if (n > 8) return false;
  const fill = aabbFill(cell);
  const aa = axisAlignedEdges(cell);
  if (n <= 6 && aa >= 3 && fill > 0.78) return true;
  if (n === 5 && fill > 0.84) return true;
  return false;
}

function organicize(seeds: Pt[], box: Box, rng: () => number, spacing: number) {
  for (let i = 0; i < seeds.length; i++) {
    const a = rng() * Math.PI * 2;
    const d = (0.06 + rng() * 0.1) * spacing;
    seeds[i] = clipToWindow([seeds[i][0] + Math.cos(a) * d, seeds[i][1] + Math.sin(a) * d], box, 0.18);
  }
  breakDelaunayRectangles(seeds, box, rng, spacing);
}

type VoronoiField = { cells: Pt[][]; xmin: number; xmax: number; ymin: number; ymax: number };
const fieldCache = new Map<string, VoronoiField>();

export function debugVoronoiField(scale: number) {
  return voronoiField(scale);
}

export function debugLloydResidual(scale: number): LloydStats {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  const box = latticeBounds();
  const seeds = seedPoints(s);
  return lloydRelax(seeds, box, LLOYD_ITERS, 0.18);
}

function circumcircle(a: Pt, b: Pt, c: Pt): { c: Pt; r: number } | null {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  if (Math.abs(d) < 1e-8) return null;
  const a2 = a[0] * a[0] + a[1] * a[1];
  const b2 = b[0] * b[0] + b[1] * b[1];
  const c2 = c[0] * c[0] + c[1] * c[1];
  const ux = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
  const uy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
  return { c: [ux, uy], r: Math.hypot(ux - a[0], uy - a[1]) };
}

function inOmega(p: Pt, box: Box, pad = 0.2) {
  const q = projectToRoundedRect(p, box, windowCornerR());
  return Math.hypot(q[0] - p[0], q[1] - p[1]) < pad;
}

function insertEmptyCircumcenters(seeds: Pt[], box: Box, spacing: number) {
  const rMax = spacing * 0.78;
  const minD2 = (spacing * 0.48) ** 2;
  for (let pass = 0; pass < 2; pass++) {
    const d = Delaunay.from(seeds);
    const t = d.triangles;
    const extras: Pt[] = [];
    for (let i = 0; i < t.length; i += 3) {
      const cc = circumcircle(seeds[t[i]], seeds[t[i + 1]], seeds[t[i + 2]]);
      if (!cc || cc.r < rMax || !inOmega(cc.c, box)) continue;
      const p = clipToWindow(cc.c, box, 0.18);
      if (seeds.every((q) => dist2(p, q) > minD2) && extras.every((q) => dist2(p, q) > minD2)) extras.push(p);
    }
    if (!extras.length) break;
    for (const p of extras) seeds.push(p);
  }
}

function pointInRing(p: Pt, ring0: Pt[]) {
  const ring = closeRing(ring0);
  let n = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const crosses = a[1] > p[1] !== b[1] > p[1];
    if (!crosses) continue;
    const x = ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1] || 1e-12) + a[0];
    if (p[0] < x) n++;
  }
  return n % 2 === 1;
}

function uncoveredSamples(cells: Pt[][], box: Box): Pt[] {
  const step = 0.7;
  const misses: Pt[] = [];
  for (let x = box.xmin + 1; x < box.xmax - 1; x += step) {
    for (let y = box.ymin + 1; y < box.ymax - 1; y += step) {
      const p: Pt = [x, y];
      if (!inOmega(p, box, 0.25)) continue;
      let hit = false;
      for (const c of cells) {
        if (c.length >= 4 && pointInRing(p, c)) {
          hit = true;
          break;
        }
      }
      if (!hit) misses.push(p);
    }
  }
  return misses;
}

function rebuildCells(seeds: Pt[], box: Box): Pt[][] {
  return cellsForSeeds(seeds, box, true).map((c) => {
    if (c.length < 4) return c;
    const m = mergeCloseVertices(c, 0.4, box);
    return m.length >= 4 ? m : c;
  });
}

function cullSliverSeeds(seeds: Pt[], box: Box) {
  const minArea = 9;
  const minIR = 1.32;
  for (let pass = 0; pass < 5; pass++) {
    const cells = rebuildCells(seeds, box);
    const drop = new Set<number>();
    for (let i = 0; i < seeds.length; i++) {
      const cell = cells[i];
      if (!cell || cell.length < 4 || cellArea(cell) < minArea || inradius(cell) < minIR) drop.add(i);
    }
    if (drop.size === 0) return;
    const keep = seeds.filter((_, i) => !drop.has(i));
    if (keep.length < 12) return;
    seeds.length = 0;
    seeds.push(...keep);
  }
}

function insertCoverageSteiner(seeds: Pt[], box: Box, spacing: number) {
  const minD2 = (spacing * 0.5) ** 2;
  for (let pass = 0; pass < 2; pass++) {
    const cells = rebuildCells(seeds, box).filter((c) => c.length >= 4);
    const misses = uncoveredSamples(cells, box);
    if (misses.length < 4) break;
    let best: Pt | null = null;
    let bestD = minD2;
    for (const p of misses) {
      let d = Infinity;
      for (const s of seeds) d = Math.min(d, dist2(p, s));
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) break;
    seeds.push(clipToWindow(best, box, 0.18));
  }
}

function voronoiField(scale: number): VoronoiField {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  const box = latticeBounds();
  const key = `v40clean:${s.toFixed(2)}`;
  const hit = fieldCache.get(key);
  if (hit) return hit;
  const seeds = seedPoints(s);
  const spacing = 3.05 * s;
  lloydRelax(seeds, box, LLOYD_ITERS, 0.18);
  organicize(seeds, box, mulberry32(27 + Math.round(s * 100)), spacing);
  insertEmptyCircumcenters(seeds, box, spacing);
  cullSliverSeeds(seeds, box);
  insertEmptyCircumcenters(seeds, box, spacing);
  cullSliverSeeds(seeds, box);
  insertCoverageSteiner(seeds, box, spacing);
  cullSliverSeeds(seeds, box);
  const cells = rebuildCells(seeds, box).filter((c) => c.length >= 4 && cellArea(c) >= 4);
  const field = { cells, xmin: box.xmin, xmax: box.xmax, ymin: box.ymin, ymax: box.ymax };
  fieldCache.set(key, field);
  return field;
}

function uniqueEdges(cells: Pt[][], xmin: number, ymin: number, xmax: number, ymax: number): LatticeEdge[] {
  const seen = new Set<string>();
  const edges: LatticeEdge[] = [];
  const inside = (p: Pt, pad = 0.12) => p[0] >= xmin - pad && p[0] <= xmax + pad && p[1] >= ymin - pad && p[1] <= ymax + pad;
  for (const cell of cells) {
    const ring = closeRing(cell);
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (!inside(a) || !inside(b)) continue;
      const k1 = `${a[0].toFixed(2)},${a[1].toFixed(2)}`;
      const k2 = `${b[0].toFixed(2)},${b[1].toFixed(2)}`;
      const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      if (len < 0.2 || len > 14) continue;
      edges.push({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, rotZ: Math.atan2(dy, dx), len });
    }
  }
  return edges;
}

function onlyPos(geom: BufferGeometry) {
  const pos = geom.getAttribute("position");
  const g = new BufferGeometry();
  if (pos) g.setAttribute("position", pos);
  return g;
}

function finishGeom(geom: BufferGeometry) {
  geom.deleteAttribute("uv");
  geom.deleteAttribute("normal");
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

function distPointToSeg(p: Pt, a: Pt, b: Pt) {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const den = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / den));
  return Math.hypot(p[0] - (a[0] + t * abx), p[1] - (a[1] + t * aby));
}

function ringClearance(a: Pt[], b: Pt[], ignore?: (p: Pt) => boolean) {
  let m = Infinity;
  const ra = closeRing(a);
  const rb = closeRing(b);
  const skip = (p: Pt) => (ignore ? ignore(p) : false);
  const skipEdge = (u: Pt, v: Pt) => skip(u) && skip(v);
  for (const p of ra) {
    if (skip(p)) continue;
    for (let i = 0; i < rb.length; i++) {
      const u = rb[i];
      const v = rb[(i + 1) % rb.length];
      if (skipEdge(u, v)) continue;
      m = Math.min(m, distPointToSeg(p, u, v));
    }
  }
  for (const p of rb) {
    if (skip(p)) continue;
    for (let i = 0; i < ra.length; i++) {
      const u = ra[i];
      const v = ra[(i + 1) % ra.length];
      if (skipEdge(u, v)) continue;
      m = Math.min(m, distPointToSeg(p, u, v));
    }
  }
  return m;
}

function punchLattice(shape: Shape, cells: Pt[][], box: Box, inset: number, fillet: number, filletSegs: number) {
  const wr = windowCornerR();
  const minWeb = LID.lattice * 0.74;
  const onWindow = (a: Pt, b: Pt) => {
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return onWindowOutline(a, box, wr, 0.22) && onWindowOutline(b, box, wr, 0.22) && onWindowOutline(m, box, wr, 0.28);
  };
  const onFramePt = (p: Pt) => onWindowOutline(p, box, wr, 0.35);
  type Cand = { cell: Pt[]; rounded: Pt[]; area: number; onFrame: boolean; c: Pt; inset: number };
  const insetRing = (cell: Pt[], d: number): Pt[] | null => {
    const inner = offsetConvex(cell, d, (a, b) => (onWindow(a, b) ? 0 : d));
    if (inner && cellArea(inner) >= 0.8 && inradius(inner) >= 0.35) return inner;
    return null;
  };
  const make = (cell: Pt[], d: number): Cand | null => {
    const inner = insetRing(cell, d);
    if (!inner || cellArea(inner) < 0.4) return null;
    let onFrame = false;
    for (const a of inner) if (onFramePt(a)) onFrame = true;
    const usedFillet = Math.min(fillet, Math.max(0.18, d * 0.55));
    const rounded = roundConvex(inner, usedFillet, filletSegs, box);
    if (rounded.length < 4) return null;
    return { cell, rounded, area: cellArea(rounded), onFrame, c: polyCentroid(rounded), inset: d };
  };
  const gapOf = (ci: Cand, cj: Cand) => {
    if (pointInRing(ci.c, cj.rounded) || pointInRing(cj.c, ci.rounded)) return 0;
    return ringClearance(ci.rounded, cj.rounded, ci.onFrame && cj.onFrame ? onFramePt : undefined);
  };
  const cands: (Cand | null)[] = [];
  for (const cell of cells) {
    if (cellArea(cell) < 4) continue;
    cands.push(make(cell, inset));
  }
  const live = () => cands.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
  for (let pass = 0; pass < 8; pass++) {
    const idx = live();
    const conflicts: { i: number; j: number; gap: number }[] = [];
    for (let a = 0; a < idx.length; a++) {
      const i = idx[a];
      const ci = cands[i]!;
      for (let b = a + 1; b < idx.length; b++) {
        const j = idx[b];
        const cj = cands[j]!;
        if (Math.hypot(ci.c[0] - cj.c[0], ci.c[1] - cj.c[1]) > 14) continue;
        const gap = gapOf(ci, cj);
        if (gap < minWeb) conflicts.push({ i, j, gap });
      }
    }
    if (conflicts.length === 0) break;
    for (const { i, j, gap } of conflicts) {
      const ci = cands[i];
      const cj = cands[j];
      if (!ci || !cj) continue;
      const extra = Math.min(0.4, Math.max(0.06, minWeb - gap + 0.06));
      const shrinkBoth = gap < 0.25 || (!ci.onFrame && !cj.onFrame);
      const targets = shrinkBoth ? [i, j] : [ci.onFrame ? j : cj.onFrame ? i : ci.area <= cj.area ? i : j];
      for (const k of targets) {
        const src = cands[k];
        if (!src) continue;
        const nextD = Math.min(1.35, src.inset + extra);
        if (nextD <= src.inset + 0.02) continue;
        const next = make(src.cell, nextD);
        if (next && next.area >= 1.2) cands[k] = next;
      }
    }
  }
  const stillLive = live();
  for (let a = 0; a < stillLive.length; a++) {
    const i = stillLive[a];
    const ci = cands[i];
    if (!ci) continue;
    for (let b = a + 1; b < stillLive.length; b++) {
      const j = stillLive[b];
      const cj = cands[j];
      if (!cj) continue;
      if (Math.hypot(ci.c[0] - cj.c[0], ci.c[1] - cj.c[1]) > 14) continue;
      if (gapOf(ci, cj) >= 0.25) continue;
      const drop = ci.area <= cj.area ? i : j;
      cands[drop] = null;
    }
  }
  let holesCut = 0;
  let borderFlush = 0;
  const kept: Cand[] = [];
  for (const c of cands) {
    if (!c) continue;
    shape.holes.push(pathFromRing(c.rounded, true));
    holesCut++;
    if (c.onFrame) borderFlush++;
    kept.push(c);
  }
  let webMin = Infinity;
  for (let i = 0; i < kept.length; i++) {
    for (let j = i + 1; j < kept.length; j++) {
      if (Math.hypot(kept[i].c[0] - kept[j].c[0], kept[i].c[1] - kept[j].c[1]) > 14) continue;
      webMin = Math.min(webMin, gapOf(kept[i], kept[j]));
    }
  }
  if (!Number.isFinite(webMin)) webMin = LID.lattice;
  return { holesCut, borderFlush, webMin };
}

export function buildVoronoiLidParts(
  scale: number,
  quality: boolean | MeshQuality = "print",
  screw = false,
  fit: PrintFit = PRINT_FIT_DEFAULT,
) {
  const preview = quality === true || quality === "preview";
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  const fitSpec = printFitSpec(fit);
  const pads = padCenters();
  const { cells, xmin, xmax, ymin, ymax } = voronoiField(s);
  const curve = preview ? 4 : 10;
  const filletSegs = preview ? 5 : 8;
  const fillet = LID.chamfer;
  const inset = LID.lattice / 2;
  const box = { xmin, xmax, ymin, ymax };

  const plate = new Shape();
  roundedRectPath(plate, LID.length, LID.width, LID.corner, true);
  const punched = punchLattice(plate, cells, box, inset, fillet, filletSegs);

  const top = new Shape();
  top.copy(plate);
  top.holes = plate.holes.map((h) => {
    const p = new Path();
    p.copy(h);
    return p;
  });
  const bottom = new Shape();
  bottom.copy(plate);
  bottom.holes = plate.holes.map((h) => {
    const p = new Path();
    p.copy(h);
    return p;
  });
  const boreR = screw ? fitSpec.screwClearR : fitSpec.socketR;
  for (const [hx, hy] of pads) {
    const bore = new Path();
    bore.absarc(hx, hy, boreR, 0, Math.PI * 2, true);
    if (screw) top.holes.push(bore);
    bottom.holes.push(bore);
  }

  function extrudePlate(shape: Shape, depth: number) {
    const g = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: curve,
      steps: 1,
    });
    g.deleteAttribute("uv");
    g.deleteAttribute("normal");
    return g;
  }

  const R = LID.chamfer;
  const bodyH = Math.max(0.4, LID.thick - R);
  const bottomGeom = extrudePlate(bottom, bodyH);

  const cap = new Shape();
  roundedRectPath(cap, LID.length - 2 * R, LID.width - 2 * R, Math.max(0.45, LID.corner - R), true);
  cap.holes = top.holes.map((h) => {
    const p = new Path();
    p.copy(h);
    return p;
  });
  const topGeom = extrudePlate(cap, R);
  topGeom.translate(0, 0, bodyH);

  const lip = new Shape();
  const lipL = LID.length - 2 * LID.wall - 2 * fitSpec.lipClear;
  const lipW = LID.width - 2 * LID.wall - 2 * fitSpec.lipClear;
  roundedRectPath(lip, lipL, lipW, Math.max(1.2, LID.corner - LID.wall), true);
  const lipHole = new Path();
  roundedRectPath(lipHole, lipL - 2 * LID.lipThick, lipW - 2 * LID.lipThick, Math.max(0.8, LID.corner - LID.wall - LID.lipThick), false);
  lip.holes.push(lipHole);
  const lipGeom = extrudePlate(lip, LID.lipDepth);
  lipGeom.translate(0, 0, -LID.lipDepth);

  const parts: BufferGeometry[] = [
    bottomGeom,
    topGeom,
    lipGeom,
    outerEdgeChamfer(LID.length, LID.width, LID.corner, R, LID.thick, bodyH, Math.max(8, curve)),
  ];

  let padsGeom = new BufferGeometry();
  if (screw) {
    const padGeoms: BufferGeometry[] = [];
    for (const [hx, hy] of pads) {
      const host = cells.find((c) => {
        const q = polyCentroid(c);
        return Math.hypot(q[0] - hx, q[1] - hy) < 8;
      });
      const pad = new Shape();
      if (host && host.length >= 4) {
        const ring = offsetConvex(host, 0.35) ?? host;
        pad.moveTo(ring[0][0], ring[0][1]);
        for (let i = 1; i < ring.length; i++) pad.lineTo(ring[i][0], ring[i][1]);
        pad.closePath();
      } else {
        pad.absarc(hx, hy, LID.padR, 0, Math.PI * 2, false);
      }
      const hole = new Path();
      hole.absarc(hx, hy, fitSpec.screwClearR, 0, Math.PI * 2, true);
      pad.holes.push(hole);
      padGeoms.push(extrudePlate(pad, LID.thick));
    }
    padsGeom = onlyPos(mergeGeometries(padGeoms.map(onlyPos), false) ?? padGeoms[0]);
    parts.push(padsGeom);
  }

  const merged = mergeGeometries(parts.map(onlyPos), false);
  if (!merged) throw new Error("lid merge failed");
  const solid = finishGeom(merged);
  const frame = finishGeom(onlyPos(bottomGeom.clone()));
  const edges = uniqueEdges(cells, xmin, ymin, xmax, ymax);

  return {
    frame,
    lip: lipGeom,
    pads: padsGeom,
    solid,
    edges,
    wallW: LID.lattice,
    padCenters: pads,
    bakedLattice: true,
    holesCut: punched.holesCut,
    borderFlush: punched.borderFlush,
    webMin: punched.webMin,
    holeCornerR: fillet,
  };
}

type LidParts = ReturnType<typeof buildVoronoiLidParts>;
const lidPartsCache = new Map<string, LidParts>();
let lastLidParts: LidParts | null = null;

function lidCacheKey(scale: number, quality: boolean | MeshQuality, screw: boolean, fit: PrintFit) {
  const q = quality === true || quality === "preview" ? "preview" : quality === "draft" ? "draft" : "print";
  return `v18chamfer:${scale.toFixed(2)}:${q}:${screw ? 1 : 0}:${fit}`;
}

export function peekPreviewLidParts() {
  return lastLidParts;
}

export function previewLidFast(scale: number, screw = false, fit: PrintFit = PRINT_FIT_DEFAULT) {
  const key = lidCacheKey(scale, "preview", screw, fit);
  const hit = lidPartsCache.get(key);
  if (hit?.solid.getAttribute("position")) {
    lastLidParts = hit;
    return hit.solid;
  }
  const parts = buildVoronoiLidParts(scale, "preview", screw, fit);
  lidPartsCache.set(key, parts);
  lastLidParts = parts;
  return parts.solid;
}

export function previewLidHull() {
  return hullLid;
}

export function previewTrayHull() {
  return hullTray;
}

const latticeCache = new Map<string, BufferGeometry>();
export function previewLidLattice(scale: number): BufferGeometry {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  const key = `lat:${s.toFixed(2)}`;
  const hit = latticeCache.get(key);
  if (hit?.getAttribute("position")) return hit;
  const { cells, xmin, xmax, ymin, ymax } = voronoiField(s);
  const edges = uniqueEdges(cells, xmin, ymin, xmax, ymax);
  const pos: number[] = [];
  const z0 = LID.thick;
  const z1 = LID.thick + 0.12;
  const hw = LID.lattice * 0.28;
  for (const e of edges) {
    const hx = Math.cos(e.rotZ) * (e.len / 2);
    const hy = Math.sin(e.rotZ) * (e.len / 2);
    const nx = -Math.sin(e.rotZ) * hw;
    const ny = Math.cos(e.rotZ) * hw;
    const ax = e.x - hx + nx;
    const ay = e.y - hy + ny;
    const bx = e.x + hx + nx;
    const by = e.y + hy + ny;
    const cx = e.x + hx - nx;
    const cy = e.y + hy - ny;
    const dx = e.x - hx - nx;
    const dy = e.y - hy - ny;
    pos.push(ax, ay, z0, bx, by, z0, cx, cy, z0, ax, ay, z0, cx, cy, z0, dx, dy, z0);
    pos.push(ax, ay, z1, cx, cy, z1, bx, by, z1, ax, ay, z1, dx, dy, z1, cx, cy, z1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  latticeCache.set(key, g);
  return g;
}

function stlBufferFromSolid(solid: BufferGeometry): ArrayBuffer {
  const print = preparePrintSolid(solid);
  if (print !== solid) solid.dispose();
  const mat = new MeshStandardMaterial();
  const group = new Group();
  group.add(new Mesh(print, mat));
  const exporter = new STLExporter();
  const result = exporter.parse(group, { binary: true });
  print.dispose();
  mat.dispose();
  if (result instanceof DataView) {
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
  }
  if (typeof result === "string") {
    return new TextEncoder().encode(result).buffer;
  }
  return result;
}

export function lidStlBuffer(scale: number, screw = false, fit: PrintFit = PRINT_FIT_DEFAULT): ArrayBuffer {
  const { solid } = buildVoronoiLidParts(scale, "print", screw, fit);
  return stlBufferFromSolid(solid);
}

export function lidStlFilename(scale: number, screw = false, fit: PrintFit = PRINT_FIT_DEFAULT) {
  return `pi_zero_case_lid_${scale.toFixed(2).replace(".", "_")}x${screw ? "_screws" : "_snap"}_${fit}.stl`;
}

export function downloadVoronoiLidStl(scale: number, screw = false, fit: PrintFit = PRINT_FIT_DEFAULT) {
  try {
    triggerDownload(lidStlFilename(scale, screw, fit), lidStlBuffer(scale, screw, fit));
    return true;
  } catch (err) {
    console.warn("lid STL download failed", err);
    return false;
  }
}

export function addVoronoiHoles(
  shape: Shape,
  box: Box,
  scale: number,
  seed: number,
  preview: boolean,
  skip?: (cx: number, cy: number) => boolean,
  _unused?: unknown,
  keepCell?: (ring: Pt[]) => boolean,
): number {
  const rng = mulberry32(seed >>> 0);
  const spacing = 3.05 * Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  const minD = spacing * 0.82;
  const w = Math.max(1, box.xmax - box.xmin);
  const h = Math.max(1, box.ymax - box.ymin);
  const attempts = Math.min(4000, Math.round((w * h * 8) / (minD * minD)));
  const filled = poissonDisk(rng, () => [box.xmin + rng() * w, box.ymin + rng() * h] as Pt, minD, attempts);
  const pts: Pt[] = [];
  for (const p of filled) {
    if (skip?.(p[0], p[1])) continue;
    pts.push(p);
  }
  if (pts.length < 3) return 0;
  const ghosts: Pt[] = [];
  for (const p of pts) {
    ghosts.push([2 * box.xmin - p[0], p[1]], [2 * box.xmax - p[0], p[1]], [p[0], 2 * box.ymin - p[1]], [p[0], 2 * box.ymax - p[1]]);
  }
  const delaunay = Delaunay.from(pts.concat(ghosts));
  const voronoi = delaunay.voronoi([box.xmin, box.ymin, box.xmax, box.ymax]);
  const inset = Math.min(0.55, LID.lattice / 2);
  const fillet = preview ? 0.35 : LID.chamfer * 0.5;
  const filletSegs = preview ? 3 : 6;
  let holes = 0;
  for (let i = 0; i < pts.length; i++) {
    const poly = voronoi.cellPolygon(i);
    if (!poly || poly.length < 4) continue;
    const ring: Pt[] = poly.map((p) => [p[0], p[1]] as Pt);
    if (cellArea(ring) < 3.2) continue;
    const c = polyCentroid(ring);
    if (skip?.(c[0], c[1])) continue;
    if (keepCell && !keepCell(ring)) continue;
    const inner = offsetConvex(ring, inset) ?? scaleTowardCentroid(ring, inset);
    if (!inner || cellArea(inner) < 0.6) continue;
    const rounded = roundConvex(inner, fillet, filletSegs);
    if (rounded.length < 4) continue;
    shape.holes.push(pathFromRing(rounded, true));
    holes++;
  }
  return holes;
}
