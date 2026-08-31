import type { PartView } from "./case-viewer-types";

function iso(x: number, y: number, z: number) {
  return [(x - y) * 0.866, (x + y) * 0.5 - z] as const;
}

function poly(pts: (readonly [number, number])[]) {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, fill: string) {
  const A = iso(x0, y0, z1);
  const B = iso(x1, y0, z1);
  const C = iso(x1, y1, z1);
  const D = iso(x0, y1, z1);
  const E = iso(x0, y0, z0);
  const F = iso(x1, y0, z0);
  const G = iso(x1, y1, z0);
  return (
    <g>
      <polygon points={poly([A, B, C, D])} fill={fill} stroke="#9a3010" strokeWidth="0.6" />
      <polygon points={poly([B, F, G, C])} fill="#b33812" stroke="#9a3010" strokeWidth="0.6" />
      <polygon points={poly([A, D, iso(x0, y1, z0), E])} fill="#8a280e" stroke="#9a3010" strokeWidth="0.6" />
    </g>
  );
}

/** Server-safe isometric case. Visible even if JS / WebGL never start. */
export function CasePreviewSvg({ view }: { view: PartView }) {
  const L = 70;
  const W = 37.7;
  const trayH = 9.98;
  const lidT = 2.15;
  const x0 = -L / 2;
  const x1 = L / 2;
  const y0 = -W / 2;
  const y1 = W / 2;
  return (
    <svg
      viewBox="-70 -48 140 96"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="-70" y="-48" width="140" height="96" fill="#14161f" />
      {view !== "lid" ? box(x0, x1, y0, y1, 0, trayH, "#e24a1c") : null}
      {view !== "bottom"
        ? box(x0, x1, y0, y1, view === "assembled" ? trayH : 0, (view === "assembled" ? trayH : 0) + lidT, "#e24a1c")
        : null}
    </svg>
  );
}
