import { ExtrudeGeometry, Matrix4, Shape, type BufferGeometry } from "three";
import { ROBOTO } from "./roboto-glyphs.ts";

export const NORTH_LABEL_DEFAULT = "ERGO";
export const TYPE_CAP = 6;
/** Roboto Bold stem at 6 mm caps — keep for print notes. */
export const TYPE_STROKE = 1.2;
export const TYPE_TRACK = 0.28;
export const TYPE_RAISE = 0.7;
export const PLAQUE_RECESS = 0.4;
export const PLAQUE_PAD = 2;
export const TYPE_FACE = "Roboto Bold";

export const MAX_LEN = 12;
/** West keep-out (corner). */
const USABLE_U0 = -29;
/** East keep-out — 16 mm keyring neck + margin. */
const USABLE_U1 = 16.4;
const SCALE = TYPE_CAP / ROBOTO.cap;

type Cmd = readonly (string | number)[];
type Glyph = { readonly adv: number; readonly contours: readonly (readonly Cmd[])[] };

export function sanitizeNorthLabel(raw: string) {
  const s = raw
    .toUpperCase()
    .replace(/[^A-Z0-9 \-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LEN);
  return s || NORTH_LABEL_DEFAULT;
}

function glyph(ch: string): Glyph {
  return (ROBOTO.glyphs as Record<string, Glyph>)[ch] ?? ROBOTO.glyphs["-"];
}

function letterWidth(ch: string, s = SCALE) {
  return glyph(ch).adv * s;
}

function measure(text: string, track: number, s = SCALE) {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    if (i) w += track;
    w += letterWidth(text[i]!, s);
  }
  return w;
}

export function layoutNorthLabel(raw: string) {
  const exact = sanitizeNorthLabel(raw);
  const field = USABLE_U1 - USABLE_U0;
  const text = exact;
  let s = SCALE;
  let track = TYPE_TRACK;
  let w = measure(text, track, s);
  if (w > field) {
    track = 0.1;
    w = measure(text, track, s);
  }
  while (w > field && s > SCALE * 0.68) {
    s *= 0.94;
    track = Math.max(0.08, track * 0.94);
    w = measure(text, track, s);
  }
  const cap = TYPE_CAP * (s / SCALE);
  let u0 = -w / 2;
  let u1 = w / 2;
  if (u1 > USABLE_U1) {
    u1 = USABLE_U1;
    u0 = u1 - w;
  }
  if (u0 < USABLE_U0) {
    u0 = USABLE_U0;
    u1 = u0 + w;
  }
  const uMid = (u0 + u1) / 2;
  const zMid = 4.9;
  return {
    text,
    exact,
    safe: Math.abs(s - SCALE) > 0.0001,
    cap,
    track,
    glyphScale: s,
    width: w,
    u0,
    u1,
    z0: zMid - cap / 2,
    z1: zMid + cap / 2,
    plaque: {
      u0: u0 - PLAQUE_PAD,
      u1: u1 + PLAQUE_PAD,
      z0: zMid - cap / 2 - 1.4,
      z1: zMid + cap / 2 + 1.4,
    },
  };
}

function contourArea(cmds: readonly Cmd[]) {
  const pts: [number, number][] = [];
  for (const c of cmds) {
    const n = c.length;
    const x = Number(c[n - 2]);
    const y = Number(c[n - 1]);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push([x, y]);
  }
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[(i + 1) % pts.length]!;
    a += x0 * y1 - x1 * y0;
  }
  return a;
}

function applyCmd(shape: Shape, c: Cmd, reverse: boolean, s = SCALE) {
  const t = c[0];
  if (t === "M") {
    shape.moveTo(Number(c[1]) * s, Number(c[2]) * s);
    return;
  }
  if (t === "L") {
    shape.lineTo(Number(c[1]) * s, Number(c[2]) * s);
    return;
  }
  if (t === "Q") {
    if (reverse) shape.quadraticCurveTo(Number(c[1]) * s, Number(c[2]) * s, Number(c[3]) * s, Number(c[4]) * s);
    else shape.quadraticCurveTo(Number(c[1]) * s, Number(c[2]) * s, Number(c[3]) * s, Number(c[4]) * s);
    return;
  }
  if (t === "C") {
    shape.bezierCurveTo(
      Number(c[1]) * s,
      Number(c[2]) * s,
      Number(c[3]) * s,
      Number(c[4]) * s,
      Number(c[5]) * s,
      Number(c[6]) * s,
    );
  }
}

function reverseContour(cmds: readonly Cmd[]): Cmd[] {
  if (cmds.length < 2) return [...cmds];
  const pts: { x: number; y: number; inX?: number; inY?: number; kind: string }[] = [];
  for (const c of cmds) {
    if (c[0] === "M" || c[0] === "L") pts.push({ kind: String(c[0]), x: Number(c[1]), y: Number(c[2]) });
    else if (c[0] === "Q") pts.push({ kind: "Q", inX: Number(c[1]), inY: Number(c[2]), x: Number(c[3]), y: Number(c[4]) });
    else if (c[0] === "C")
      pts.push({
        kind: "C",
        inX: Number(c[1]),
        inY: Number(c[2]),
        x: Number(c[5]),
        y: Number(c[6]),
      });
  }
  const out: Cmd[] = [["M", pts[pts.length - 1]!.x, pts[pts.length - 1]!.y]];
  for (let i = pts.length - 1; i > 0; i--) {
    const cur = pts[i]!;
    const prev = pts[i - 1]!;
    if (cur.kind === "Q") out.push(["Q", cur.inX!, cur.inY!, prev.x, prev.y]);
    else out.push(["L", prev.x, prev.y]);
  }
  return out;
}

function shapeFromGlyph(g: Glyph, s = SCALE): Shape | null {
  if (!g.contours.length) return null;
  const ranked = g.contours.map((c, i) => ({ i, a: contourArea(c) }));
  ranked.sort((x, y) => Math.abs(y.a) - Math.abs(x.a));
  const outerIdx = ranked[0]!.i;
  const outerNeedCcw = ranked[0]!.a < 0;
  const shape = new Shape();
  const outer = outerNeedCcw ? reverseContour(g.contours[outerIdx]!) : [...g.contours[outerIdx]!];
  for (const c of outer) applyCmd(shape, c, false, s);
  shape.closePath();
  for (const item of ranked.slice(1)) {
    const hole = new Shape();
    const needCw = item.a > 0;
    const cmds = needCw ? reverseContour(g.contours[item.i]!) : [...g.contours[item.i]!];
    for (const c of cmds) applyCmd(hole, c, false, s);
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

function stadium(shape: Shape, cx: number, cy: number, w: number, h: number) {
  const r = Math.min(w, h) / 2 - 0.02;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const k = Math.max(0.2, r);
  shape.moveTo(x + k, y);
  shape.lineTo(x + w - k, y);
  shape.absarc(x + w - k, y + k, k, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - k);
  shape.absarc(x + w - k, y + h - k, k, 0, Math.PI / 2, false);
  shape.lineTo(x + k, y + h);
  shape.absarc(x + k, y + h - k, k, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + k);
  shape.absarc(x + k, y + k, k, Math.PI, Math.PI * 1.5, false);
  shape.closePath();
}

function extrudeLetter(shape: Shape, raise: number, curve: number) {
  return new ExtrudeGeometry(shape, {
    depth: raise,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 1,
    curveSegments: curve,
    steps: 1,
  });
}

function placeNorthOut(g: BufferGeometry, y0: number) {
  g.applyMatrix4(
    new Matrix4().set(
      1, 0, 0, 0,
      0, 0, 1, y0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ),
  );
  return g;
}

/** Mirror in wall-U so type reads left-to-right from outside the north face. */
function mirrorU(g: BufferGeometry, mid: number) {
  const pos = g.getAttribute("position");
  if (!pos) return g;
  const arr = pos.array as Float32Array;
  for (let i = 0; i < pos.count; i++) arr[i * 3] = 2 * mid - arr[i * 3];
  const idx = g.getIndex();
  if (idx) {
    const id = idx.array;
    for (let i = 0; i < idx.count; i += 3) {
      const a = id[i + 1];
      id[i + 1] = id[i + 2];
      id[i + 2] = a;
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      const o1 = (i + 1) * 3;
      const o2 = (i + 2) * 3;
      for (let k = 0; k < 3; k++) {
        const t = arr[o1 + k];
        arr[o1 + k] = arr[o2 + k];
        arr[o2 + k] = t;
      }
    }
  }
  pos.needsUpdate = true;
  return g;
}

export function plaqueKeepout(u: number, v: number, label = NORTH_LABEL_DEFAULT) {
  const { plaque } = layoutNorthLabel(label);
  return u > plaque.u0 - 0.8 && u < plaque.u1 + 0.8 && v > plaque.z0 - 0.6 && v < plaque.z1 + 0.6;
}

export function buildNorthType(label: string, yFace: number, curve = 8): BufferGeometry[] {
  const layout = layoutNorthLabel(label);
  const mid = (layout.u0 + layout.u1) / 2;
  const parts: BufferGeometry[] = [];
  const plaque = new Shape();
  stadium(
    plaque,
    (layout.plaque.u0 + layout.plaque.u1) / 2,
    (layout.plaque.z0 + layout.plaque.z1) / 2,
    layout.plaque.u1 - layout.plaque.u0,
    layout.plaque.z1 - layout.plaque.z0,
  );
  const pad = extrudeLetter(plaque, 0.12, curve);
  parts.push(placeNorthOut(pad, yFace - PLAQUE_RECESS));
  let u = layout.u0;
  for (const ch of layout.text) {
    const g = glyph(ch);
    const sh = shapeFromGlyph(g, layout.glyphScale);
    if (sh) {
      const geom = extrudeLetter(sh, TYPE_RAISE, curve);
      geom.translate(u, layout.z0, 0);
      mirrorU(geom, mid);
      parts.push(placeNorthOut(geom, yFace - PLAQUE_RECESS + 0.12));
    }
    u += letterWidth(ch, layout.glyphScale) + layout.track;
  }
  return parts;
}
