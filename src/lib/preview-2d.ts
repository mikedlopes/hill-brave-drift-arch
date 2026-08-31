import { LID, PI_ZERO } from "./case-params.ts";
import type { PartView } from "../components/case-viewer-types.ts";

const FILAMENT = "#e24a1c";
const EDGE = "#9a3010";
const WELL = "#14161f";
const PCB = "#2f6d45";

function iso(x: number, y: number, z: number) {
  return {
    X: (x - y) * 0.866,
    Y: (x + y) * 0.5 - z,
  };
}

function pathRect(ctx: CanvasRenderingContext2D, corners: { X: number; Y: number }[]) {
  ctx.beginPath();
  ctx.moveTo(corners[0].X, corners[0].Y);
  for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].X, corners[i].Y);
  ctx.closePath();
}

function face(
  ctx: CanvasRenderingContext2D,
  pts: { X: number; Y: number }[],
  fill: string,
  stroke = EDGE,
) {
  pathRect(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function boxFaces(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  fill: string,
) {
  const a = iso(x0, y0, z1);
  const b = iso(x1, y0, z1);
  const c = iso(x1, y1, z1);
  const d = iso(x0, y1, z1);
  const e = iso(x0, y0, z0);
  const f = iso(x1, y0, z0);
  const g = iso(x1, y1, z0);
  face(ctx, [a, b, c, d], fill);
  face(ctx, [b, f, g, c], shade(fill, 0.72));
  face(ctx, [a, d, iso(x0, y1, z0), e], shade(fill, 0.55));
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

function portCut(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  z0: number,
  z1: number,
) {
  const a = iso(x0, y, z1);
  const b = iso(x1, y, z1);
  const c = iso(x1, y, z0);
  const d = iso(x0, y, z0);
  face(ctx, [a, b, c, d], "#1a0e08", "#3a1408");
}

/** Always-on isometric painter. No WebGL, no Voronoi kernel. */
export function paintCase2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  view: PartView,
  showBoard: boolean,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = WELL;
  ctx.fillRect(0, 0, w, h);
  if (w < 8 || h < 8) return;

  const L = LID.length;
  const Wd = LID.width;
  const trayH = LID.trayH;
  const lidT = LID.thick;
  const x0 = -L / 2;
  const x1 = L / 2;
  const y0 = -Wd / 2;
  const y1 = Wd / 2;

  const spanX = iso(x1, y0, 0).X - iso(x0, y1, 0).X;
  const spanY = iso(x1, y1, 0).Y - iso(x0, y0, trayH + lidT).Y;
  const scale = Math.min(w / (spanX + 28), h / (spanY + 28));
  ctx.translate(w / 2, h / 2 + 8);
  ctx.scale(scale, scale);

  const ox = -L / 2 + LID.wall + LID.boardClear;
  if (view !== "lid") {
    boxFaces(ctx, x0, x1, y0, y1, 0, trayH, FILAMENT);
    const south = y0;
    const hdmi0 = ox + PI_ZERO.hdmi - PI_ZERO.hdmiW / 2 - PI_ZERO.portClear;
    const hdmi1 = ox + PI_ZERO.hdmi + PI_ZERO.hdmiW / 2 + PI_ZERO.portClear;
    portCut(ctx, hdmi0, hdmi1, south, PI_ZERO.portZ0, PI_ZERO.portZ1);
    const usb = (cx: number) => {
      const a = ox + cx - PI_ZERO.usbW / 2 - PI_ZERO.portClear;
      const b = ox + cx + PI_ZERO.usbW / 2 + PI_ZERO.portClear;
      portCut(ctx, a, b, south, PI_ZERO.portZ0, PI_ZERO.portZ1);
    };
    usb(PI_ZERO.usbPower);
    usb(PI_ZERO.usbOtg);
    if (showBoard) {
      const bx0 = -PI_ZERO.length / 2;
      const bx1 = PI_ZERO.length / 2;
      const by0 = -PI_ZERO.width / 2;
      const by1 = PI_ZERO.width / 2;
      const bz = LID.floor + LID.standoff + PI_ZERO.pcb;
      boxFaces(ctx, bx0, bx1, by0, by1, LID.floor + LID.standoff, bz, PCB);
    }
  }
  if (view !== "bottom") {
    const z0 = view === "assembled" ? trayH : 0;
    boxFaces(ctx, x0, x1, y0, y1, z0, z0 + lidT, FILAMENT);
    ctx.save();
    ctx.strokeStyle = "rgba(26,14,8,0.55)";
    ctx.lineWidth = 0.45;
    const inset = 6;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const xa = x0 + inset + t * (L - 2 * inset);
      const p0 = iso(xa, y0 + inset, z0 + lidT);
      const p1 = iso(xa, y1 - inset, z0 + lidT);
      ctx.beginPath();
      ctx.moveTo(p0.X, p0.Y);
      ctx.lineTo(p1.X, p1.Y);
      ctx.stroke();
    }
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const ya = y0 + inset + t * (Wd - 2 * inset);
      const p0 = iso(x0 + inset, ya, z0 + lidT);
      const p1 = iso(x1 - inset, ya, z0 + lidT);
      ctx.beginPath();
      ctx.moveTo(p0.X, p0.Y);
      ctx.lineTo(p1.X, p1.Y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
