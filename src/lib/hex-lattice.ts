import { BufferGeometry, Float32BufferAttribute, Path, Shape } from "three";
import { SCALE_MAX, SCALE_MIN } from "./case-params.ts";

export type Pt = [number, number];

/** Regular honeycomb. Scale 1.5 → 6.0 mm flat, 2.0 → 7.0. */
export function hexFlat(scale: number) {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  return 6 + ((s - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 1;
}

export const HEX_WEB = 1.5;
export const HEX_CHAMFER = 0.7;
export const HEX_WMIN = 1.2;

export function hexRadius(flat: number) {
  return flat / Math.sqrt(3);
}

export function hexInnerRadius(flat: number, chamfer = HEX_CHAMFER) {
  const R = hexRadius(flat);
  return Math.max(R * 0.35, R - chamfer / Math.cos(Math.PI / 6));
}

export function hexVerts(cx: number, cy: number, R: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  return pts;
}

export type HexCell = { cx: number; cy: number; outer: Pt[]; inner: Pt[] };

export function hexCells(
  box: { xmin: number; ymin: number; xmax: number; ymax: number },
  scale: number,
  skip?: (x: number, y: number) => boolean,
  flatOverride?: number,
): HexCell[] {
  const flat = flatOverride ?? hexFlat(scale);
  const dx = flat + HEX_WEB;
  const dy = dx * (Math.sqrt(3) / 2);
  const R = hexRadius(flat);
  const rIn = hexInnerRadius(flat);
  const cells: HexCell[] = [];
  let row = 0;
  for (let y = box.ymin + dy * 0.55; y <= box.ymax - dy * 0.55; y += dy, row++) {
    const xOff = row % 2 === 0 ? 0 : dx / 2;
    for (let x = box.xmin + dx * 0.55 + xOff; x <= box.xmax - dx * 0.55; x += dx) {
      if (skip?.(x, y)) continue;
      const outer = hexVerts(x, y, R);
      let inside = true;
      for (const p of outer) {
        if (p[0] < box.xmin || p[0] > box.xmax || p[1] < box.ymin || p[1] > box.ymax) {
          inside = false;
          break;
        }
      }
      if (!inside) continue;
      cells.push({ cx: x, cy: y, outer, inner: hexVerts(x, y, rIn) });
    }
  }
  return cells;
}

function pushTri(pos: number[], a: Pt, za: number, b: Pt, zb: number, c: Pt, zc: number) {
  pos.push(a[0], a[1], za, b[0], b[1], zb, c[0], c[1], zc);
}

/** Circular frustum band: outer@zOuter → inner@zInner, 1 planar segment. */
export function ringChamferBand(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  zOuter: number,
  zInner: number,
  segs = 16,
): BufferGeometry {
  const pos: number[] = [];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const o0: Pt = [cx + Math.cos(a0) * rOuter, cy + Math.sin(a0) * rOuter];
    const o1: Pt = [cx + Math.cos(a1) * rOuter, cy + Math.sin(a1) * rOuter];
    const n0: Pt = [cx + Math.cos(a0) * rInner, cy + Math.sin(a0) * rInner];
    const n1: Pt = [cx + Math.cos(a1) * rInner, cy + Math.sin(a1) * rInner];
    pushTri(pos, o0, zOuter, o1, zOuter, n1, zInner);
    pushTri(pos, o0, zOuter, n1, zInner, n0, zInner);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  return g;
}

function insetRing(ring: Pt[], dist: number): Pt[] {
  const n = ring.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = ring[(i + n - 1) % n];
    const cur = ring[i];
    const next = ring[(i + 1) % n];
    const e1x = cur[0] - prev[0];
    const e1y = cur[1] - prev[1];
    const e2x = next[0] - cur[0];
    const e2y = next[1] - cur[1];
    const l1 = Math.hypot(e1x, e1y) || 1;
    const l2 = Math.hypot(e2x, e2y) || 1;
    const in1x = -e1y / l1;
    const in1y = e1x / l1;
    const in2x = -e2y / l2;
    const in2y = e2x / l2;
    let nx = in1x + in2x;
    let ny = in1y + in2y;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const dot = Math.max(0.35, nx * in2x + ny * in2y);
    out.push([cur[0] + (nx * dist) / dot, cur[1] + (ny * dist) / dot]);
  }
  return out;
}

/** Positive dist = outward for a CCW ring. */
export function offsetRing(ring: Pt[], dist: number): Pt[] {
  return insetRing(ring, -dist);
}

/** Planar chamfer around a convex outline. segments = 1. */
export function outlineChamferBand(ring: Pt[], inset: number, zOuter: number, zInner: number): BufferGeometry {
  const inner = insetRing(ring, inset);
  const pos: number[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    pushTri(pos, ring[i], zOuter, ring[j], zOuter, inner[j], zInner);
    pushTri(pos, ring[i], zOuter, inner[j], zInner, inner[i], zInner);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  return g;
}
export function hexChamferBand(cells: HexCell[], zTop: number, chamfer = HEX_CHAMFER): BufferGeometry {
  const zIn = zTop - chamfer;
  const pos: number[] = [];
  for (const cell of cells) {
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      const o0 = cell.outer[i];
      const o1 = cell.outer[j];
      const n0 = cell.inner[i];
      const n1 = cell.inner[j];
      pushTri(pos, o0, zTop, o1, zTop, n1, zIn);
      pushTri(pos, o0, zTop, n1, zIn, n0, zIn);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  return g;
}

export function hexPath(ring: Pt[]) {
  const p = new Path();
  p.moveTo(ring[0][0], ring[0][1]);
  for (let i = 1; i < ring.length; i++) p.lineTo(ring[i][0], ring[i][1]);
  p.closePath();
  return p;
}

export function addHexHoles(
  plate: Shape,
  box: { xmin: number; ymin: number; xmax: number; ymax: number },
  scale: number,
  skip?: (x: number, y: number) => boolean,
  aperture: "inner" | "outer" = "inner",
  flatOverride?: number,
): number {
  const cells = hexCells(box, scale, skip, flatOverride);
  for (const cell of cells) plate.holes.push(hexPath(aperture === "outer" ? cell.outer : cell.inner));
  return cells.length;
}

