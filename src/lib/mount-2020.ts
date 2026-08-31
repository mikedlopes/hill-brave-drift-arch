import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Path, Shape } from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { preparePrintSolid } from "./print-solid.ts";
import { triggerDownload } from "./stl-download.ts";
import { roundedRectAt } from "./voronoi-lid.ts";

/** Separate printable: 2020 T-slot plate. Does not cut the case. */
export const MOUNT_2020 = {
  length: 40,
  width: 20,
  thick: 5,
  corner: 1.2,
  m3: 1.6,
  m3Span: 20,
  tnut: 2.15,
} as const;

export function buildMount2020() {
  const plate = new Shape();
  roundedRectAt(plate, 0, 0, MOUNT_2020.length, MOUNT_2020.width, MOUNT_2020.corner, true);
  for (const x of [-MOUNT_2020.m3Span / 2, MOUNT_2020.m3Span / 2]) {
    const h = new Path();
    h.absarc(x, 0, MOUNT_2020.m3, 0, Math.PI * 2, true);
    plate.holes.push(h);
  }
  const nut = new Path();
  nut.absarc(0, 0, MOUNT_2020.tnut, 0, Math.PI * 2, true);
  plate.holes.push(nut);
  const g = new ExtrudeGeometry(plate, { depth: MOUNT_2020.thick, bevelEnabled: false, curveSegments: 10, steps: 1 });
  return preparePrintSolid(g);
}

export function mount2020StlBuffer() {
  const solid = buildMount2020();
  const mat = new MeshStandardMaterial();
  const group = new Group();
  group.add(new Mesh(solid, mat));
  const exporter = new STLExporter();
  const result = exporter.parse(group, { binary: true });
  solid.dispose();
  mat.dispose();
  if (result instanceof DataView) {
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
  }
  if (typeof result === "string") return new TextEncoder().encode(result).buffer;
  return result;
}

export function downloadMount2020Stl() {
  try {
    triggerDownload("pi_zero_case_2020_mount.stl", mount2020StlBuffer());
    return true;
  } catch (err) {
    console.warn("2020 mount STL download failed", err);
    return false;
  }
}
