import { useEffect, useState } from "react";
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  MeshLambertMaterial,
  Path,
  Shape,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { LID, PI_ZERO } from "@/lib/case-params";

/** RP-008365 SW origin, millimetres. */
function boardOrigin(): [number, number] {
  return [-LID.length / 2 + LID.wall + LID.boardClear, -LID.width / 2 + LID.wall + LID.boardClear];
}

const REF_STL = "/models/pi_zero_ref.stl";
const noopRaycast = () => {};
const PITCH = 2.54;

const pcbMat = new MeshLambertMaterial({
  color: "#3d6b4a",
  emissive: "#1a3322",
  emissiveIntensity: 0.28,
  toneMapped: false,
  flatShading: true,
});
const copperMat = new MeshLambertMaterial({
  color: "#d4a84b",
  emissive: "#6a4e18",
  emissiveIntensity: 0.22,
  toneMapped: false,
});
const metalMat = new MeshLambertMaterial({
  color: "#c8cdd2",
  emissive: "#3a3e42",
  emissiveIntensity: 0.2,
  toneMapped: false,
});
const plasticMat = new MeshLambertMaterial({
  color: "#1a1b1d",
  emissive: "#090909",
  emissiveIntensity: 0.15,
  toneMapped: false,
});
const socMat = new MeshLambertMaterial({
  color: "#2c3036",
  emissive: "#111318",
  emissiveIntensity: 0.2,
  toneMapped: false,
});
const shieldMat = new MeshLambertMaterial({
  color: "#9aa3aa",
  emissive: "#2c3236",
  emissiveIntensity: 0.18,
  toneMapped: false,
});
const ledGreen = new MeshLambertMaterial({
  color: "#3ee86a",
  emissive: "#3ee86a",
  emissiveIntensity: 0.7,
  toneMapped: false,
});
const ledAct = new MeshLambertMaterial({
  color: "#ff5a2a",
  emissive: "#ff5a2a",
  emissiveIntensity: 0.65,
  toneMapped: false,
});

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function cyl(r: number, h: number, x: number, y: number, z: number, seg = 12) {
  const g = new CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return g;
}

function bake(parts: BufferGeometry[]) {
  const merged = mergeGeometries(parts, false) ?? parts[0];
  for (const g of parts) {
    if (g !== merged) g.dispose();
  }
  merged.deleteAttribute("uv");
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

function makePcb() {
  const w = PI_ZERO.length;
  const h = PI_ZERO.width;
  const r = PI_ZERO.corner;
  const shape = new Shape();
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
  shape.closePath();
  for (const dx of [PI_ZERO.holeOx, PI_ZERO.length - PI_ZERO.holeOx]) {
    for (const dy of [PI_ZERO.holeOy, PI_ZERO.width - PI_ZERO.holeOy]) {
      const hole = new Path();
      hole.absarc(dx - w / 2, dy - h / 2, PI_ZERO.holeDia / 2, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  const g = new ExtrudeGeometry(shape, { depth: PI_ZERO.pcb, bevelEnabled: false, curveSegments: 8, steps: 1 });
  g.computeVertexNormals();
  return g;
}

function gpioPads(ox: number, oy: number, zt: number) {
  const n = 20;
  const len = (n - 1) * PITCH;
  const x0 = ox + (PI_ZERO.length - len) / 2;
  const yN = oy + PI_ZERO.width - 1.25;
  const yS = yN - PITCH;
  const pads: BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + i * PITCH;
    pads.push(cyl(0.45, 0.16, x, yN, zt + 0.08, 8));
    pads.push(cyl(0.45, 0.16, x, yS, zt + 0.08, 8));
  }
  return pads;
}

let fallbackCache: { geometry: BufferGeometry; material: MeshLambertMaterial }[] | null = null;

function getFallbackParts() {
  if (fallbackCache) return fallbackCache;
  const [ox, oy] = boardOrigin();
  const z0 = LID.floor + LID.standoff;
  const zt = z0 + PI_ZERO.pcb;
  const cx = ox + PI_ZERO.length / 2;
  const cy = oy + PI_ZERO.width / 2;
  const south = oy;
  const north = oy + PI_ZERO.width;
  const west = ox;
  const east = ox + PI_ZERO.length;
  const hdmiX = ox + PI_ZERO.hdmi;
  const usb1X = ox + PI_ZERO.usbPower;
  const usb2X = ox + PI_ZERO.usbOtg;
  const sdY = oy + PI_ZERO.sdFromSouth;
  const csiY = oy + PI_ZERO.width - PI_ZERO.csiFromRight;
  const pcb = makePcb();
  pcb.translate(cx, cy, z0);
  const rings: BufferGeometry[] = [];
  for (const dx of [PI_ZERO.holeOx, PI_ZERO.length - PI_ZERO.holeOx]) {
    for (const dy of [PI_ZERO.holeOy, PI_ZERO.width - PI_ZERO.holeOy]) {
      rings.push(cyl(2.2, 0.12, ox + dx, oy + dy, zt + 0.06, 16));
    }
  }
  fallbackCache = [
    { geometry: pcb, material: pcbMat },
    { geometry: bake([...rings, ...gpioPads(ox, oy, zt)]), material: copperMat },
    {
      geometry: bake([
        box(PI_ZERO.hdmiW, 7.2, 3.2, hdmiX, south + 2.4, zt + 1.6),
        box(PI_ZERO.usbW, 5.6, 2.6, usb1X, south + 1.9, zt + 1.3),
        box(PI_ZERO.usbW, 5.6, 2.6, usb2X, south + 1.9, zt + 1.3),
      ]),
      material: metalMat,
    },
    {
      geometry: bake([
        box(8.0, 2.2, 2.4, hdmiX, south - 0.7, zt + 1.6),
        box(5.6, 1.8, 1.8, usb1X, south - 0.55, zt + 1.3),
        box(5.6, 1.8, 1.8, usb2X, south - 0.55, zt + 1.3),
        box(11.4, 11.4, 0.7, west + 2.2, sdY, z0 - 0.35),
        box(2.0, PI_ZERO.sd, 1.1, west - 0.85, sdY, z0 + 0.2),
        box(1.2, 11.5, 1.0, east + 0.2, csiY, zt + 0.5),
      ]),
      material: plasticMat,
    },
    {
      geometry: bake([
        box(12.0, 12.0, 1.0, ox + 22, cy + 1.0, zt + 0.5),
        box(5.5, 4.0, 0.6, ox + 38, oy + 6.2, zt + 0.3),
      ]),
      material: socMat,
    },
    { geometry: bake([box(8.0, 8.0, 1.3, ox + 48, oy + 11, zt + 0.65)]), material: shieldMat },
    { geometry: bake([box(1.1, 0.7, 0.35, west + 4.8, north - 4.4, zt + 0.18)]), material: ledGreen },
    { geometry: bake([box(1.1, 0.7, 0.35, west + 6.6, north - 4.4, zt + 0.18)]), material: ledAct },
  ];
  return fallbackCache;
}

/**
 * 1:1 Pi Zero from MisterC / RP-008365 (PCB centre, bottom face).
 * Thingiverse 6250-k4lu3l. v1.3 SketchUp dump has a 12 mm GPIO header so it is not used in-case.
 */
export function PiZeroBoard() {
  const [ref, setRef] = useState<BufferGeometry | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    const loader = new STLLoader();
    loader.load(
      REF_STL,
      (g) => {
        if (!alive) {
          g.dispose();
          return;
        }
        g.computeVertexNormals();
        g.computeBoundingSphere();
        setRef(g);
      },
      undefined,
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const [ox, oy] = boardOrigin();
  const z0 = LID.floor + LID.standoff;
  const cx = ox + PI_ZERO.length / 2;
  const cy = oy + PI_ZERO.width / 2;

  if (ref) {
    return (
      <mesh
        geometry={ref}
        material={pcbMat}
        position={[cx, cy, z0]}
        frustumCulled={false}
        raycast={noopRaycast}
      />
    );
  }
  if (!failed) return null;
  return (
    <group>
      {getFallbackParts().map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={part.material} frustumCulled raycast={noopRaycast} />
      ))}
    </group>
  );
}
