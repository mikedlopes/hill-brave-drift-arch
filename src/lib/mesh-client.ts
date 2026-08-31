import { BufferGeometry, Float32BufferAttribute } from "three";
import type { HdmiPlug, Keyring, PrintFit, UsbPlug } from "./case-params.ts";
import { HDMI_PLUG_DEFAULT, KEYRING_DEFAULT, USB_PLUG_DEFAULT } from "./case-params.ts";
import { NORTH_LABEL_DEFAULT } from "./north-type.ts";
import { recordBuildMs } from "./preview-stats.ts";
import { previewLidFast } from "./voronoi-lid.ts";
import { getDraftTray, getPreviewTray } from "./tray-body.ts";

/** Copy so disposing the viewport mesh cannot kill a cached builder solid. */
function clonePositions(g: BufferGeometry) {
  const pos = g.getAttribute("position");
  if (!pos) throw new Error("mesh has no position");
  const copy = new BufferGeometry();
  copy.setAttribute("position", new Float32BufferAttribute(new Float32Array(pos.array as ArrayLike<number>), 3));
  copy.computeVertexNormals();
  return copy;
}

/** Same generator as the lid STL (`buildVoronoiLidParts`), preview tessellation. */
export function buildPreviewLid(scale: number, screw: boolean, fit: PrintFit) {
  const t0 = performance.now();
  const g = clonePositions(previewLidFast(scale, screw, fit));
  recordBuildMs(performance.now() - t0);
  return g;
}

/** Same generator as the tray STL (`buildTrayGeometry`), preview tessellation. */
export function buildPreviewTray(
  scale: number,
  screw: boolean,
  quality: "draft" | "preview",
  label: string,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  const t0 = performance.now();
  const solid =
    quality === "draft"
      ? getDraftTray(screw, label, hdmi, keyring, usb).solid
      : getPreviewTray(scale, screw, label, hdmi, keyring, usb).solid;
  const g = clonePositions(solid);
  recordBuildMs(performance.now() - t0);
  return g;
}

export function requestPreviewMesh(
  kind: "lid" | "tray",
  scale: number,
  screw: boolean,
  fit: PrintFit,
  quality: "draft" | "preview" = "preview",
  label = NORTH_LABEL_DEFAULT,
): Promise<BufferGeometry> {
  try {
    const g = kind === "lid" ? buildPreviewLid(scale, screw, fit) : buildPreviewTray(scale, screw, quality, label);
    return Promise.resolve(g);
  } catch (err) {
    return Promise.reject(err);
  }
}
