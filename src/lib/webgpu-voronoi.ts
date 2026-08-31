import { LID, SCALE_MAX, SCALE_MIN } from "./case-params.ts";

type Box = { xmin: number; ymin: number; xmax: number; ymax: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampScale(scale: number) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
}

/** Poisson disk seeds as interleaved x,y. */
export function poissonSites(scale: number, box: Box, seed = 21): Float32Array {
  const rng = mulberry32(seed);
  const s = clampScale(scale);
  const radius = 2.72 * s;
  const r2 = radius * radius;
  const w = box.xmax - box.xmin;
  const h = box.ymax - box.ymin;
  const attempts = Math.min(900, Math.round(560 / (s * s)));
  const pts: number[] = [];
  for (let i = 0; i < attempts; i++) {
    const x = box.xmin + rng() * w;
    const y = box.ymin + rng() * h;
    let ok = true;
    for (let p = 0; p < pts.length; p += 2) {
      const dx = pts[p] - x;
      const dy = pts[p + 1] - y;
      if (dx * dx + dy * dy < r2) {
        ok = false;
        break;
      }
    }
    if (ok) {
      pts.push(x, y);
    }
  }
  return new Float32Array(pts);
}

function siteColor(id: number): [number, number, number] {
  const t = (id * 0.61803398875) % 1;
  const shade = 0.42 + t * 0.5;
  return [shade, shade * 0.38, shade * 0.18];
}

export function nearestSiteColors(pos: Float32Array, sites: Float32Array): Float32Array {
  const n = pos.length / 3;
  const out = new Float32Array(n * 3);
  const sc = sites.length / 2;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3];
    const y = pos[i * 3 + 1];
    let best = 0;
    let bestD = Infinity;
    for (let s = 0; s < sc; s++) {
      const dx = sites[s * 2] - x;
      const dy = sites[s * 2 + 1] - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    const c = siteColor(best);
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  return out;
}

function seedGrid(sites: Float32Array, box: Box, w: number, h: number): Float32Array {
  const grid = new Float32Array(w * h * 4);
  for (let i = 3; i < grid.length; i += 4) grid[i] = -1;
  const n = sites.length / 2;
  const sx = (w - 1) / (box.xmax - box.xmin || 1);
  const sy = (h - 1) / (box.ymax - box.ymin || 1);
  for (let s = 0; s < n; s++) {
    const x = sites[s * 2];
    const y = sites[s * 2 + 1];
    const i = Math.round((x - box.xmin) * sx);
    const j = Math.round((y - box.ymin) * sy);
    if (i < 0 || j < 0 || i >= w || j >= h) continue;
    const p = (j * w + i) * 4;
    grid[p] = x;
    grid[p + 1] = y;
    grid[p + 2] = 0;
    grid[p + 3] = s;
  }
  return grid;
}

function jfaPass(src: Float32Array, w: number, h: number, box: Box, k: number): Float32Array {
  const dst = new Float32Array(src);
  const dx = (box.xmax - box.xmin) / (w - 1 || 1);
  const dy = (box.ymax - box.ymin) / (h - 1 || 1);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const p = (j * w + i) * 4;
      let bestD = Infinity;
      let bx = src[p];
      let by = src[p + 1];
      let id = src[p + 3];
      const px = box.xmin + i * dx;
      const py = box.ymin + j * dy;
      if (id >= 0) {
        const ddx = bx - px;
        const ddy = by - py;
        bestD = ddx * ddx + ddy * ddy;
      }
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (ox === 0 && oy === 0) continue;
          const ni = i + ox * k;
          const nj = j + oy * k;
          if (ni < 0 || nj < 0 || ni >= w || nj >= h) continue;
          const q = (nj * w + ni) * 4;
          const sid = src[q + 3];
          if (sid < 0) continue;
          const sx = src[q];
          const sy = src[q + 1];
          const ddx = sx - px;
          const ddy = sy - py;
          const d = ddx * ddx + ddy * ddy;
          if (d < bestD) {
            bestD = d;
            bx = sx;
            by = sy;
            id = sid;
          }
        }
      }
      dst[p] = bx;
      dst[p + 1] = by;
      dst[p + 2] = bestD === Infinity ? -1 : Math.sqrt(bestD);
      dst[p + 3] = id;
    }
  }
  return dst;
}

export function jumpFloodCpu(sites: Float32Array, box: Box, w: number, h: number, plus = false): Float32Array {
  let grid = seedGrid(sites, box, w, h);
  const steps: number[] = [];
  if (plus) steps.push(1);
  for (let k = Math.max(w, h); k >= 1; k = k >> 1) steps.push(k);
  if (plus) steps.push(1);
  for (const k of steps) grid = jfaPass(grid, w, h, box, k);
  return grid;
}

export function bruteNearestField(sites: Float32Array, box: Box, w: number, h: number): Float32Array {
  const grid = new Float32Array(w * h * 4);
  const n = sites.length / 2;
  const dx = (box.xmax - box.xmin) / (w - 1 || 1);
  const dy = (box.ymax - box.ymin) / (h - 1 || 1);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const px = box.xmin + i * dx;
      const py = box.ymin + j * dy;
      let best = 0;
      let bestD = Infinity;
      for (let s = 0; s < n; s++) {
        const sx = sites[s * 2];
        const sy = sites[s * 2 + 1];
        const d = (sx - px) ** 2 + (sy - py) ** 2;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      const p = (j * w + i) * 4;
      grid[p] = sites[best * 2];
      grid[p + 1] = sites[best * 2 + 1];
      grid[p + 2] = Math.sqrt(bestD);
      grid[p + 3] = best;
    }
  }
  return grid;
}

export function jfaAgreement(a: Float32Array, b: Float32Array): number {
  let hit = 0;
  let n = 0;
  for (let i = 3; i < a.length; i += 4) {
    n++;
    if (a[i] === b[i]) hit++;
  }
  return n === 0 ? 1 : hit / n;
}

export function colorizeTraySync(pos: Float32Array, scale: number): Float32Array {
  const box = {
    xmin: -LID.length / 2,
    xmax: LID.length / 2,
    ymin: -LID.width / 2,
    ymax: LID.width / 2,
  };
  const sites = poissonSites(scale, box);
  return nearestSiteColors(pos, sites);
}
