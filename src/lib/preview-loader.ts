import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import type { BufferGeometry, Mesh, Object3D } from "three";
import { HDMI_PLUG_DEFAULT, KEYRING_DEFAULT, USB_PLUG_DEFAULT, LID, PRINT_FIT_DEFAULT, SCALE_DEFAULT, type HdmiPlug, type Keyring, type PrintFit, type UsbPlug } from "./case-params.ts";
import { NORTH_LABEL_DEFAULT } from "./north-type.ts";

/** Bump when baked GLBs change (chamfer, lattice default, etc.). */
export const BAKE_VERSION = `c${Math.round(LID.chamfer * 100)}w${Math.round(LID.lattice * 100)}h${Math.round(LID.chamfer * 100)}v47`;

export const LID_GLB = `/models/preview_lid.glb?v=${BAKE_VERSION}`;
export const TRAY_GLB = `/models/preview_tray.glb?v=${BAKE_VERSION}`;
export const ASSEMBLED_GLB = `/models/preview_assembled.glb?v=${BAKE_VERSION}`;
export const LID_STL = `/models/pi_zero_case_lid.stl?v=${BAKE_VERSION}`;
export const TRAY_STL = `/models/pi_zero_case_bottom.stl?v=${BAKE_VERSION}`;

export function matchesBake(
  scale: number,
  screw: boolean,
  fit: PrintFit,
  label: string,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  return (
    !screw &&
    fit === PRINT_FIT_DEFAULT &&
    label === NORTH_LABEL_DEFAULT &&
    hdmi === HDMI_PLUG_DEFAULT &&
    keyring === KEYRING_DEFAULT &&
    usb === USB_PLUG_DEFAULT &&
    Math.abs(scale - SCALE_DEFAULT) < 0.001
  );
}

function firstGeom(scene: Object3D): BufferGeometry | null {
  const meshes: Mesh[] = [];
  scene.traverse((obj) => {
    const mesh = obj as Mesh;
    if (mesh.isMesh && mesh.geometry) meshes.push(mesh);
  });
  const geom = meshes[0]?.geometry ?? null;
  if (geom && !geom.getAttribute("normal")) geom.computeVertexNormals();
  return geom;
}

/** First-paint lid + tray. Assembled is composed in the viewer. Shared so warmup + canvas decode once. */
let pairInflight: Promise<{ lid: BufferGeometry; tray: BufferGeometry }> | null = null;

async function decodeBakedPair(): Promise<{ lid: BufferGeometry; tray: BufferGeometry }> {
  const gltf = new GLTFLoader();
  try {
    const [lidFile, trayFile] = await Promise.all([gltf.loadAsync(LID_GLB), gltf.loadAsync(TRAY_GLB)]);
    const lid = firstGeom(lidFile.scene);
    const tray = firstGeom(trayFile.scene);
    if (!lid || !tray) throw new Error("empty glb");
    return { lid, tray };
  } catch (err) {
    console.warn("baked GLB failed, STL fallback", err);
    const stl = new STLLoader();
    const [lid, tray] = await Promise.all([stl.loadAsync(LID_STL), stl.loadAsync(TRAY_STL)]);
    lid.computeVertexNormals();
    tray.computeVertexNormals();
    return { lid, tray };
  }
}

export async function loadBakedPair(): Promise<{ lid: BufferGeometry; tray: BufferGeometry }> {
  pairInflight ??= decodeBakedPair();
  const next = await pairInflight;
  return { lid: next.lid.clone(), tray: next.tray.clone() };
}
