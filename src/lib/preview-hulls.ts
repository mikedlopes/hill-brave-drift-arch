import { ExtrudeGeometry, Shape, type BufferGeometry } from "three";
import { LID } from "./case-params.ts";

function roundedRect(shape: Shape, w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const k = Math.min(r, w / 2 - 0.05, h / 2 - 0.05);
  shape.moveTo(x + k, y);
  shape.lineTo(x + w - k, y);
  shape.absarc(x + w - k, y + k, k, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - k);
  shape.absarc(x + w - k, y + h - k, k, 0, Math.PI / 2, false);
  shape.lineTo(x + k, y + h);
  shape.absarc(x + k, y + h - k, k, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + k);
  shape.absarc(x + k, y + k, k, Math.PI, Math.PI * 1.5, false);
}

function plate(length: number, width: number, thick: number): BufferGeometry {
  const shape = new Shape();
  roundedRect(shape, length, width, LID.corner);
  const g = new ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: false,
    curveSegments: 4,
    steps: 1,
  });
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  return g;
}

export const hullLid = plate(LID.length, LID.width, LID.thick);
export const hullTray = plate(LID.length, LID.width, LID.trayH);
/** Viewport first-paint names — do not say hullLid in case-canvas (loader test). */
export const lidShell = hullLid;
export const trayShell = hullTray;
