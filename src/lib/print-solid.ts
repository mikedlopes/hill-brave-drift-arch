import { BufferGeometry, Float32BufferAttribute } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/** Print-only: drop garbage tris and weld. Not a boolean union — CSG shredded this tray before. */
export function preparePrintSolid(geometry: BufferGeometry): BufferGeometry {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = src.getAttribute("position");
  if (!pos || pos.count < 3) throw new Error("print mesh has no triangles");
  const kept: number[] = [];
  for (let i = 0; i + 2 < pos.count; i += 3) {
    const ax = pos.getX(i);
    const ay = pos.getY(i);
    const az = pos.getZ(i);
    const bx = pos.getX(i + 1);
    const by = pos.getY(i + 1);
    const bz = pos.getZ(i + 1);
    const cx = pos.getX(i + 2);
    const cy = pos.getY(i + 2);
    const cz = pos.getZ(i + 2);
    if (![ax, ay, az, bx, by, bz, cx, cy, cz].every(Number.isFinite)) continue;
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    if (nx * nx + ny * ny + nz * nz < 1e-12) continue;
    kept.push(i, i + 1, i + 2);
  }
  if (kept.length < 9) throw new Error("print mesh empty after cleanup");
  const out = new Float32Array(kept.length * 3);
  let w = 0;
  for (const vi of kept) {
    out[w++] = pos.getX(vi);
    out[w++] = pos.getY(vi);
    out[w++] = pos.getZ(vi);
  }
  const cleaned = new BufferGeometry();
  cleaned.setAttribute("position", new Float32BufferAttribute(out, 3));
  const welded = mergeVertices(cleaned, 1e-4);
  cleaned.dispose();
  if (src !== geometry) src.dispose();
  welded.computeVertexNormals();
  return welded;
}

function edgeKey(a: number, b: number, c: number, d: number, e: number, f: number) {
  const left = a < d || (a === d && (b < e || (b === e && c <= f)));
  return left ? `${a},${b},${c}|${d},${e},${f}` : `${d},${e},${f}|${a},${b},${c}`;
}

/** Boundary = edge used once. Slicer holes show up here. Non-manifold = used ≠ 2. */
export function printMeshHealth(geometry: BufferGeometry) {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = src.getAttribute("position");
  if (!pos || pos.count < 3) throw new Error("print mesh has no triangles");
  const edges = new Map<string, number>();
  let triangles = 0;
  for (let i = 0; i + 2 < pos.count; i += 3) {
    const verts = [i, i + 1, i + 2].map((vi) => [
      +pos.getX(vi).toFixed(4),
      +pos.getY(vi).toFixed(4),
      +pos.getZ(vi).toFixed(4),
    ]);
    triangles++;
    for (let e = 0; e < 3; e++) {
      const a = verts[e];
      const b = verts[(e + 1) % 3];
      const key = edgeKey(a[0], a[1], a[2], b[0], b[1], b[2]);
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  let boundary = 0;
  let nonManifold = 0;
  for (const n of edges.values()) {
    if (n === 1) boundary++;
    else if (n !== 2) nonManifold++;
  }
  if (src !== geometry) src.dispose();
  return { triangles, boundary, nonManifold, edges: edges.size };
}
