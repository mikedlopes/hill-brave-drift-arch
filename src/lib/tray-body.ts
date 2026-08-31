import {
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
  SphereGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { preparePrintSolid } from "./print-solid.ts";
import { triggerDownload } from "./stl-download.ts";
import {
  addVoronoiHoles,
  boardOrigin,
  LID,
  outerEdgeChamfer,
  filletBand,
  padCenters,
  portWindows,
  roundedRectAt,
  SCALE_DEFAULT,
  sideWindows,
  TRAY_RELIEF,
  type MeshQuality,
  type HdmiPlug,
} from "./voronoi-lid.ts";
import { HDMI_PLUG_DEFAULT, KEYRING_DEFAULT, USB_PLUG_DEFAULT, type Keyring, type UsbPlug } from "./case-params.ts";
import {
  NORTH_LABEL_DEFAULT,
  buildNorthType,
} from "./north-type.ts";
import { buildKeyring, lugCenter, lugFloorKeepout, LUG } from "./keyring.ts";

function finishGeom(geom: BufferGeometry) {
  geom.deleteAttribute("uv");
  geom.deleteAttribute("normal");
  geom.computeVertexNormals();
  geom.computeBoundingBox();
  geom.computeBoundingSphere();
  return geom;
}

function extrude(shape: Shape, depth: number, curve = 6) {
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: curve,
    steps: 1,
  });
  return g;
}

function stadiumLoop(cx: number, cy: number, w: number, h: number, segs: number): [number, number][] {
  const rx = w / 2;
  const ry = h / 2;
  const r = Math.min(rx, ry) * 0.96;
  const pts: [number, number][] = [];
  const cap = Math.max(6, segs);
  if (w >= h) {
    const ox = Math.max(0, rx - r);
    for (let i = 0; i <= cap; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / cap;
      pts.push([cx + ox + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    for (let i = 0; i <= cap; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / cap;
      pts.push([cx - ox + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  } else {
    const oy = Math.max(0, ry - r);
    for (let i = 0; i <= cap; i++) {
      const a = (Math.PI * i) / cap;
      pts.push([cx + Math.cos(a) * r, cy + oy + Math.sin(a) * r]);
    }
    for (let i = 0; i <= cap; i++) {
      const a = Math.PI + (Math.PI * i) / cap;
      pts.push([cx + Math.cos(a) * r, cy - oy + Math.sin(a) * r]);
    }
  }
  return pts;
}

function portChamferBand(cx: number, cy: number, w: number, h: number, c: number, segs: number, zFace = 0, zBore?: number) {
  const outer = stadiumLoop(cx, cy, w + 2 * c, h + 2 * c, segs);
  const inner = stadiumLoop(cx, cy, w, h, segs);
  return filletBand(outer, inner, zFace, zBore ?? c, 1);
}

function addPortChamfers(
  face: "south" | "west" | "east",
  place: (g: BufferGeometry, d0: number) => BufferGeometry,
  c: number,
  segs: number,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const flare = LID.portFlare;
  const wall = LID.wall;
  const r = Math.min(c, wall * 0.34);
  const out: BufferGeometry[] = [];
  const bands = (cx: number, cy: number, w: number, h: number) => {
    out.push(place(portChamferBand(cx, cy, w, h, r, segs, 0, r), -0.04));
    out.push(place(portChamferBand(cx, cy, w, h, r, segs, 0, -r), wall + 0.04));
  };
  if (face === "south") {
    for (const p of portWindows(hdmi, usb)) {
      const w = p.x1 - p.x0 + 2 * flare;
      const h = p.z1 - p.z0 + 2 * flare;
      bands((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, w, h);
    }
    return out;
  }
  for (const p of sideWindows()) {
    if (face === "west" && p.id !== "sd") continue;
    if (face === "east" && p.id !== "csi") continue;
    const w = p.y1 - p.y0 + 2 * flare;
    const h = p.z1 - p.z0 + 2 * flare;
    bands((p.y0 + p.y1) / 2, (p.z0 + p.z1) / 2, w, h);
  }
  return out;
}

function stadiumHole(x0: number, y0: number, x1: number, y1: number, flare = 0) {
  const w = Math.max(0.8, x1 - x0 + 2 * flare);
  const h = Math.max(0.8, y1 - y0 + 2 * flare);
  const path = new Path();
  roundedRectAt(path, (x0 + x1) / 2, (y0 + y1) / 2, w, h, Math.min(w, h) * 0.48, false);
  return path;
}

function addPortHoles(
  shape: Shape,
  face: "south" | "west" | "east",
  flare = 0,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  if (face === "south") {
    for (const p of portWindows(hdmi, usb)) shape.holes.push(stadiumHole(p.x0, p.z0, p.x1, p.z1, flare));
    return;
  }
  for (const p of sideWindows()) {
    if (face === "west" && p.id !== "sd") continue;
    if (face === "east" && p.id !== "csi") continue;
    shape.holes.push(stadiumHole(p.y0, p.z0, p.y1, p.z1, flare));
  }
}

function wallRect(u0: number, u1: number, z0: number, z1: number) {
  const shape = new Shape();
  roundedRectAt(shape, (u0 + u1) / 2, (z0 + z1) / 2, u1 - u0, z1 - z0, 0.15, true);
  return shape;
}

function placeSouth(g: BufferGeometry, inward = 0) {
  g.applyMatrix4(
    new Matrix4().set(
      1, 0, 0, 0,
      0, 0, 1, -LID.width / 2,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ),
  );
  if (inward) g.translate(0, inward, 0);
  return g;
}

function placeNorth(g: BufferGeometry, inward = 0) {
  g.applyMatrix4(
    new Matrix4().set(
      1, 0, 0, 0,
      0, 0, -1, LID.width / 2,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ),
  );
  if (inward) g.translate(0, -inward, 0);
  return g;
}

function placeWest(g: BufferGeometry, inward = 0) {
  g.applyMatrix4(
    new Matrix4().set(
      0, 0, 1, -LID.length / 2,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ),
  );
  if (inward) g.translate(inward, 0, 0);
  return g;
}

function placeEast(g: BufferGeometry, inward = 0) {
  g.applyMatrix4(
    new Matrix4().set(
      0, 0, -1, LID.length / 2,
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 0, 1,
    ),
  );
  if (inward) g.translate(-inward, 0, 0);
  return g;
}

function cornerAnnulus(start: number) {
  const shape = new Shape();
  const ro = LID.corner;
  const ri = Math.max(0.55, LID.corner - LID.wall);
  shape.absarc(0, 0, ro, start, start + Math.PI / 2, false);
  shape.absarc(0, 0, ri, start + Math.PI / 2, start, true);
  return shape;
}

function floorVentHoles() {
  return [
    { cx: -8, cy: -5.4 },
    { cx: 6, cy: -5.4 },
    { cx: -8, cy: -1.2 },
    { cx: 6, cy: -1.2 },
  ];
}

function punchFloorVents(shape: Shape) {
  for (const v of floorVentHoles()) {
    const hole = new Path();
    roundedRectAt(hole, v.cx, v.cy, LID.ventL, LID.ventW, LID.ventW / 2, false);
    shape.holes.push(hole);
  }
}

function punchLugHole(shape: Shape) {
  const { hx, hy } = lugCenter();
  const hole = new Path();
  hole.absarc(hx, hy, LUG.holeR, 0, Math.PI * 2, true);
  shape.holes.push(hole);
}

function ventKeepout(cx: number, cy: number) {
  return floorVentHoles().some(
    (v) => Math.abs(cx - v.cx) < LID.ventL / 2 + 2.4 && Math.abs(cy - v.cy) < LID.ventW / 2 + 2.0,
  );
}

export type TrayBuild = { solid: BufferGeometry; holesCut: number };

export function createTrayBuilder(
  scale: number,
  screw = false,
  quality: MeshQuality = "preview",
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const draft = quality === "draft";
  const preview = quality !== "print";
  const curve = draft ? 4 : preview ? 5 : 10;
  const relief = TRAY_RELIEF;
  const corner = LID.corner;
  const L = LID.length;
  const W = LID.width;
  const H = LID.trayH;
  const wall = LID.wall;
  const floor = LID.floor;
  const parts: BufferGeometry[] = [];
  let holesCut = 0;
  const pads = padCenters();

  const u0x = -L / 2 + corner;
  const u1x = L / 2 - corner;
  const u0y = -W / 2 + corner;
  const u1y = W / 2 - corner;
  const z0 = LID.chamfer;
  const z1 = H;
  const R = LID.chamfer;

  function addFloor() {
    const floorShape = new Shape();
    roundedRectAt(floorShape, 0, 0, L, W, corner, true);
    punchFloorVents(floorShape);
    if (keyring === "on") punchLugHole(floorShape);
    if (screw) {
      for (const [hx, hy] of pads) {
        const hole = new Path();
        hole.absarc(hx, hy, LID.insertR, 0, Math.PI * 2, true);
        floorShape.holes.push(hole);
      }
    }
    if (draft) {
      const insetFloor = new Shape();
      roundedRectAt(insetFloor, 0, 0, L - 2 * R, W - 2 * R, Math.max(0.4, corner - R), true);
      punchFloorVents(insetFloor);
      if (keyring === "on") punchLugHole(insetFloor);
      parts.push(extrude(insetFloor, R, curve));
      const core = extrude(floorShape, Math.max(0.4, floor - R), curve);
      core.translate(0, 0, R);
      parts.push(core);
      parts.push(outerEdgeChamfer(L, W, corner, R, 0, R, Math.max(8, curve)));
      return;
    }
    const insetSkin = new Shape();
    roundedRectAt(insetSkin, 0, 0, L - 2 * R, W - 2 * R, Math.max(0.4, corner - R), true);
    punchFloorVents(insetSkin);
    if (keyring === "on") punchLugHole(insetSkin);
    if (screw) {
      for (const [hx, hy] of pads) {
        const hole = new Path();
        hole.absarc(hx, hy, LID.insertR, 0, Math.PI * 2, true);
        insetSkin.holes.push(hole);
      }
    }
    holesCut += addVoronoiHoles(
      insetSkin,
      { xmin: -L / 2 + corner, ymin: -W / 2 + corner, xmax: L / 2 - corner, ymax: W / 2 - corner },
      scale,
      21,
      preview,
      (cx, cy) =>
        ventKeepout(cx, cy) ||
        (keyring === "on" && lugFloorKeepout(cx, cy)) ||
        pads.some((p) => Math.hypot(cx - p[0], cy - p[1]) < 3.2),
      undefined,
      (ring) => !ring.some(([x, y]) => ventKeepout(x, y)),
    );
    parts.push(extrude(insetSkin, relief, curve));
    const insetFill = extrude(insetSkin, Math.max(0.2, R - relief), curve);
    insetFill.translate(0, 0, relief);
    parts.push(insetFill);
    const floorCore = extrude(floorShape, Math.max(0.4, floor - R), curve);
    floorCore.translate(0, 0, R);
    parts.push(floorCore);
    parts.push(outerEdgeChamfer(L, W, corner, R, 0, R, Math.max(8, curve)));
  }

  function addWalls() {
    const faces: {
      id: "south" | "north" | "west" | "east";
      u0: number;
      u1: number;
      place: (g: BufferGeometry, d0: number) => BufferGeometry;
      ports?: "south" | "west" | "east";
    }[] = [
      { id: "south", u0: u0x, u1: u1x, place: placeSouth, ports: "south" },
      { id: "north", u0: u0x, u1: u1x, place: placeNorth },
      { id: "west", u0: u0y, u1: u1y, place: placeWest, ports: "west" },
      { id: "east", u0: u0y, u1: u1y, place: placeEast, ports: "east" },
    ];

    for (const face of faces) {
      const wallShape = wallRect(face.u0, face.u1, z0, z1);
      if (face.ports) addPortHoles(wallShape, face.ports, LID.portFlare, hdmi, usb);
      parts.push(face.place(extrude(wallShape, wall, curve), 0));
      if (face.ports) parts.push(...addPortChamfers(face.ports, face.place, LID.chamfer, preview ? 8 : 12, hdmi, usb));
    }

    const corners: [number, number, number][] = [
      [-L / 2 + corner, -W / 2 + corner, Math.PI],
      [L / 2 - corner, -W / 2 + corner, -Math.PI / 2],
      [L / 2 - corner, W / 2 - corner, 0],
      [-L / 2 + corner, W / 2 - corner, Math.PI / 2],
    ];
    for (const [x, y, a0] of corners) {
      const g = extrude(cornerAnnulus(a0), H - R, 10);
      g.translate(x, y, R);
      parts.push(g);
    }
    if (!draft) {
      for (const g of buildNorthType(label, W / 2, curve)) parts.push(g);
    }
  }

  function addHardware() {
    const bossH = floor + LID.standoff;
    for (const [px, py] of pads) {
      const boss = new Shape();
      boss.absarc(0, 0, screw ? LID.screwBossR : LID.bossR, 0, Math.PI * 2, false);
      if (screw) {
        const hole = new Path();
        hole.absarc(0, 0, LID.insertR, 0, Math.PI * 2, true);
        boss.holes.push(hole);
      }
      const bossGeom = extrude(boss, bossH, 12);
      bossGeom.translate(px, py, 0);
      parts.push(bossGeom);
      if (!screw) {
        const peg = new CylinderGeometry(LID.pegR, LID.pegR, LID.pegH - 1.2, preview ? 10 : 16);
        peg.rotateX(Math.PI / 2);
        peg.translate(px, py, (LID.pegH - 1.2) / 2);
        parts.push(peg);
        const tip = new CylinderGeometry(LID.pegR - 0.18, LID.pegR, 1.2, preview ? 8 : 14);
        tip.rotateX(Math.PI / 2);
        tip.translate(px, py, LID.pegH - 0.6);
        parts.push(tip);
        const ridge = new CylinderGeometry(LID.pegR + 0.24, LID.pegR + 0.08, 0.9, preview ? 10 : 14);
        ridge.rotateX(Math.PI / 2);
        ridge.translate(px, py, H + 0.5);
        parts.push(ridge);
      }
    }

    if (keyring === "on") {
      for (const g of buildKeyring(preview, draft)) parts.push(g);
    }

    const nubR = LID.snapNubR;
    const innerN = W / 2 - wall - LID.snapNubIn;
    const innerS = -W / 2 + wall + LID.snapNubIn;
    const innerE = L / 2 - wall - LID.snapNubIn;
    const innerW = -L / 2 + wall + LID.snapNubIn;
    const nubZ = H - 0.85;
    const nubs: [number, number][] = [
      [0, innerN],
      [0, innerS],
      [innerE, 0],
      [innerW, 0],
    ];
    for (const [nx, ny] of nubs) {
      const nub = new SphereGeometry(nubR, preview ? 8 : 12, preview ? 6 : 8);
      nub.translate(nx, ny, nubZ);
      parts.push(nub);
    }
  }

  function finish(): TrayBuild {
    const prepared = parts.map((g) => {
      g.deleteAttribute("uv");
      g.deleteAttribute("normal");
      return g;
    });
    const sameIndex = prepared.every((g) => Boolean(g.index)) || prepared.every((g) => !g.index);
    const ready = sameIndex
      ? prepared
      : prepared.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(ready, false);
    const solid = finishGeom(merged ?? ready[0]);
    for (const g of parts) g.dispose();
    for (const g of ready) {
      if (g !== solid) g.dispose();
    }
    return { solid, holesCut };
  }

  return { addFloor, addWalls, addHardware, finish };
}

export function buildTrayGeometry(
  scale: number,
  screw = false,
  quality: MeshQuality = "preview",
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
): TrayBuild {
  const b = createTrayBuilder(scale, screw, quality, label, hdmi, keyring, usb);
  b.addFloor();
  b.addWalls();
  b.addHardware();
  return b.finish();
}

const draftCache = new Map<string, TrayBuild>();
const trayCache = new Map<string, TrayBuild>();
let lastGoodTray: TrayBuild | null = null;

export function getDraftTray(
  screw = false,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const key = `${screw ? "s" : "n"}:${label}:c${LID.chamfer}:${hdmi}:${keyring}:${usb}`;
  const hit = draftCache.get(key);
  if (hit && live(hit)) return hit;
  const built = buildTrayGeometry(SCALE_DEFAULT, screw, "draft", label, hdmi, keyring, usb);
  draftCache.set(key, built);
  if (!lastGoodTray) lastGoodTray = built;
  return built;
}

function live(parts: TrayBuild) {
  return Boolean(parts.solid?.getAttribute("position"));
}

export function peekPreviewTray() {
  return lastGoodTray && live(lastGoodTray) ? lastGoodTray : null;
}

export function cachePreviewTray(
  scale: number,
  screw: boolean,
  built: TrayBuild,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const key = `${scale.toFixed(2)}:${screw ? "s" : "n"}:${label}:c${LID.chamfer}:${hdmi}:${keyring}:${usb}`;
  trayCache.set(key, built);
  lastGoodTray = built;
  if (trayCache.size > 6) {
    for (const [oldKey, geom] of trayCache) {
      if (oldKey === key) continue;
      if (geom === lastGoodTray) continue;
      geom.solid.dispose();
      trayCache.delete(oldKey);
      break;
    }
  }
}

export function getCachedPreviewTray(
  scale: number,
  screw = false,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const key = `${scale.toFixed(2)}:${screw ? "s" : "n"}:${label}:c${LID.chamfer}:${hdmi}:${keyring}:${usb}`;
  const hit = trayCache.get(key);
  return hit && live(hit) ? hit : null;
}

export function getPreviewTray(
  scale: number,
  screw = false,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  try {
    const hit = getCachedPreviewTray(scale, screw, label, hdmi, keyring, usb);
    if (hit) {
      lastGoodTray = hit;
      return hit;
    }
    const built = buildTrayGeometry(scale, screw, "preview", label, hdmi, keyring, usb);
    cachePreviewTray(scale, screw, built, label, hdmi, keyring, usb);
    return built;
  } catch (err) {
    console.warn("tray preview failed, keeping last mesh", err);
    if (lastGoodTray && live(lastGoodTray)) return lastGoodTray;
    throw err;
  }
}

export function trayStlBuffer(
  scale: number,
  screw = false,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
): ArrayBuffer {
  const { solid } = buildTrayGeometry(scale, screw, "print", label, hdmi, keyring, usb);
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

export function trayStlFilename(
  scale: number,
  screw = false,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const tag = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 10);
  return `pi_zero_voronoi_tray_${scale.toFixed(2).replace(".", "_")}x${screw ? "_screws" : "_snap"}_${tag}_hdmi-${hdmi}_usb-${usb}_${keyring === "on" ? "lug" : "nolug"}.stl`;
}

export function downloadVoronoiTrayStl(
  scale: number,
  screw = false,
  label = NORTH_LABEL_DEFAULT,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  try {
    triggerDownload(trayStlFilename(scale, screw, label, hdmi, keyring, usb), trayStlBuffer(scale, screw, label, hdmi, keyring, usb));
    return true;
  } catch (err) {
    console.warn("tray STL download failed", err);
    return false;
  }
}
