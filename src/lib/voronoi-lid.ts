import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { Delaunay } from "d3-delaunay";

export const LID = {
  length: 70,
  width: 34.8,
  thick: 2.15,
  wall: 1.6,
  corner: 3.2,
  frame: 2.7,
  lattice: 1.15,
  lipClear: 0.22,
  lipDepth: 1.35,
  lipThick: 1.15,
  padR: 2.95,
  boardClear: 0.4,
  holeOx: 3.5,
  holeOy: 3.5,
  holeSx: 58,
  holeSy: 23,
} as const;

export const SCALE_MIN = 0.55;
export const SCALE_MAX = 1.85;
export const SCALE_STEP = 0.05;
export const SCALE_DEFAULT = 1;

export const STEP_PRESETS = [
  { id: "fine", label: "Fine", value: 0.01 },
  { id: "print", label: "Print", value: 0.02 },
  { id: "standard", label: "Std", value: 0.05 },
  { id: "coarse", label: "Coarse", value: 0.1 },
  { id: "jump", label: "Jump", value: 0.25 },
] as const;

export type StepSize = (typeof STEP_PRESETS)[number]["value"];



type Pt = [number, number];

export type LatticeEdge = {
  x: number;
  y: number;
  rotZ: number;
  len: number;
};

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

function seedPoints(scale: number): Pt[] {
  const rng = mulberry32(11);
  const insetX = LID.length / 2 - LID.frame - 1.4;
  const insetY = LID.width / 2 - LID.frame - 1.1;
  const radius = 2.72 * scale;
  const r2 = radius * radius;
  const pts: Pt[] = [];
  for (let i = 0; i < 1600; i++) {
    const p: Pt = [(rng() * 2 - 1) * insetX, (rng() * 2 - 1) * insetY];
    if (pts.every((q) => dist2(p, q) >= r2)) pts.push(p);
  }
  return pts;
}

function closeRing(pts: Pt[]): Pt[] {
  if (pts.length < 2) return pts;
  const a = pts[0];
  const b = pts[pts.length - 1];
  if (Math.abs(a[0] - b[0]) < 1e-8 && Math.abs(a[1] - b[1]) < 1e-8) return pts.slice(0, -1);
  return pts;
}

function roundedRectPath(shape: Shape | Path, w: number, h: number, r: number, ccw: boolean) {
  const x = -w / 2;
  const y = -h / 2;
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

function padCenters(): Pt[] {
  const x0 = -LID.length / 2 + LID.wall + LID.boardClear;
  const y0 = -LID.width / 2 + LID.wall + LID.boardClear;
  const out: Pt[] = [];
  for (const dx of [0, LID.holeSx]) {
    for (const dy of [0, LID.holeSy]) out.push([x0 + LID.holeOx + dx, y0 + LID.holeOy + dy]);
  }
  return out;
}

function finish(geom: BufferGeometry) {
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

function uniqueEdges(cells: Pt[][], xmin: number, ymin: number, xmax: number, ymax: number): LatticeEdge[] {
  const seen = new Set<string>();
  const edges: LatticeEdge[] = [];
  const inside = (p: Pt, pad = 0.12) =>
    p[0] >= xmin - pad && p[0] <= xmax + pad && p[1] >= ymin - pad && p[1] <= ymax + pad;

  for (const cell of cells) {
    const ring = closeRing(cell);
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % n];
      if (!inside(a) || !inside(b)) continue;
      const k1 = `${a[0].toFixed(2)},${a[1].toFixed(2)}`;
      const k2 = `${b[0].toFixed(2)},${b[1].toFixed(2)}`;
      const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      if (len < 0.55 || len > 11.5) continue;
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const half = (len + LID.lattice) / 2;
      const c = Math.abs(dx) / len;
      const s = Math.abs(dy) / len;
      if (Math.abs(mx) + half * c > LID.length / 2 - 0.35) continue;
      if (Math.abs(my) + half * s > LID.width / 2 - 0.35) continue;
      edges.push({
        x: (a[0] + b[0]) / 2,
        y: (a[1] + b[1]) / 2,
        rotZ: Math.atan2(dy, dx),
        len,
      });
    }
  }
  return edges;
}

export function buildVoronoiLidParts(scale: number): {
  frame: BufferGeometry;
  lip: BufferGeometry;
  pads: BufferGeometry;
  edges: LatticeEdge[];
  wallW: number;
} {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  const points = seedPoints(s);
  const xmin = -LID.length / 2 + LID.frame;
  const xmax = LID.length / 2 - LID.frame;
  const ymin = -LID.width / 2 + LID.frame;
  const ymax = LID.width / 2 - LID.frame;

  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([xmin, ymin, xmax, ymax]);
  const cells: Pt[][] = [];
  for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell || cell.length < 4) continue;
    cells.push(cell.map((p) => [p[0], p[1]] as Pt));
  }

  const frame = new Shape();
  roundedRectPath(frame, LID.length, LID.width, LID.corner, true);
  const inner = new Path();
  roundedRectPath(inner, LID.length - 2 * LID.frame, LID.width - 2 * LID.frame, 1.2, false);
  frame.holes.push(inner);
  const frameGeom = finish(
    new ExtrudeGeometry(frame, { depth: LID.thick, bevelEnabled: false, curveSegments: 12, steps: 1 }),
  );

  const lipOuterL = LID.length - 2 * LID.wall - 2 * LID.lipClear;
  const lipOuterW = LID.width - 2 * LID.wall - 2 * LID.lipClear;
  const lipInnerL = lipOuterL - 2 * LID.lipThick;
  const lipInnerW = lipOuterW - 2 * LID.lipThick;
  const lip = new Shape();
  roundedRectPath(lip, lipOuterL, lipOuterW, 2.2, true);
  const lipHole = new Path();
  roundedRectPath(lipHole, lipInnerL, lipInnerW, 1.4, false);
  lip.holes.push(lipHole);
  const lipGeom = finish(
    new ExtrudeGeometry(lip, { depth: LID.lipDepth, bevelEnabled: false, curveSegments: 10, steps: 1 }),
  );
  lipGeom.translate(0, 0, -LID.lipDepth);

  const padGeoms = padCenters().map(([px, py]) => {
    const g = new CylinderGeometry(LID.padR, LID.padR, LID.thick, 20);
    g.rotateX(Math.PI / 2);
    g.translate(px, py, LID.thick / 2);
    return g;
  });
  const pads = mergeGeometries(padGeoms, false) ?? padGeoms[0];
  padGeoms.forEach((g) => {
    if (g !== pads) g.dispose();
  });
  finish(pads);

  return {
    frame: frameGeom,
    lip: lipGeom,
    pads,
    edges: uniqueEdges(cells, xmin, ymin, xmax, ymax),
    wallW: LID.lattice,
  };
}

export function formatScale(scale: number) {
  return `${scale.toFixed(2).replace(/\.?0+$/, "") || "0"}×`;
}

export function downloadVoronoiLidStl(scale: number) {
  const { frame, lip, pads, edges, wallW } = buildVoronoiLidParts(scale);
  const mat = new MeshStandardMaterial();
  const group = new Group();
  group.add(new Mesh(frame, mat));
  group.add(new Mesh(lip, mat));
  group.add(new Mesh(pads, mat));
  const proto = new BoxGeometry(1, 1, 1);
  const matrix = new Matrix4();
  for (const e of edges) {
    const g = proto.clone();
    matrix.makeRotationZ(e.rotZ);
    matrix.setPosition(e.x, e.y, LID.thick / 2);
    g.scale(e.len + wallW, wallW, LID.thick);
    g.applyMatrix4(matrix);
    group.add(new Mesh(g, mat));
  }
  proto.dispose();
  const exporter = new STLExporter();
  const result = exporter.parse(group, { binary: true });
  frame.dispose();
  lip.dispose();
  pads.dispose();
  mat.dispose();
  const payload = result instanceof DataView ? result.buffer : (result as ArrayBuffer | string);
  const blob = new Blob([payload as BlobPart], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pi_zero_voronoi_lid_${scale.toFixed(2).replace(".", "_")}x.stl`;
  a.click();
  URL.revokeObjectURL(url);
}
