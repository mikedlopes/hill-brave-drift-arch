/// <reference lib="webworker" />

import type { BufferGeometry } from "three";
import { previewLidFast } from "./voronoi-lid.ts";
import { buildTrayGeometry, getDraftTray } from "./tray-body.ts";
import type { PrintFit } from "./case-params.ts";
import { NORTH_LABEL_DEFAULT } from "./north-type.ts";

export type MeshJob =
  | { id: number; type: "lid"; scale: number; screw: boolean; fit: PrintFit }
  | { id: number; type: "tray"; scale: number; screw: boolean; quality: "draft" | "preview"; label?: string };

function pack(g: BufferGeometry) {
  const pos = g.getAttribute("position");
  if (!pos) throw new Error("mesh has no position");
  const position = new Float32Array(pos.count * 3);
  const src = pos.array;
  for (let i = 0; i < position.length; i++) position[i] = src[i] as number;
  return { position, count: pos.count };
}

self.onmessage = (event: MessageEvent<MeshJob>) => {
  const msg = event.data;
  try {
    if (msg.type === "lid") {
      const packed = pack(previewLidFast(msg.scale, msg.screw, msg.fit));
      self.postMessage({ id: msg.id, ok: true, kind: "lid", ...packed }, [packed.position.buffer]);
      return;
    }
    const label = msg.label ?? NORTH_LABEL_DEFAULT;
    const built =
      msg.quality === "draft"
        ? getDraftTray(msg.screw, label)
        : buildTrayGeometry(msg.scale, msg.screw, "preview", label);
    const packed = pack(built.solid);
    self.postMessage({ id: msg.id, ok: true, kind: "tray", ...packed }, [packed.position.buffer]);
  } catch (err) {
    self.postMessage({ id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
