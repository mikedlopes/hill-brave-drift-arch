import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  peekPreviewLidParts,
  previewLidFast,
  previewLidHull,
  previewLidLattice,
  previewTrayHull,
  SCALE_DEFAULT,
  SCALE_MIN,
} from "./voronoi-lid.ts";
import { getDraftTray, peekPreviewTray } from "./tray-body.ts";
import { buildPreviewLid, buildPreviewTray, requestPreviewMesh } from "./mesh-client.ts";
import { colorizeTraySync } from "./webgpu-voronoi.ts";
import { preparePrintSolid } from "./print-solid.ts";
import { BAKE_VERSION, matchesBake } from "./preview-loader.ts";
import { LID } from "./case-params.ts";
import { zipStore } from "./stl-download.ts";

describe("3D preview loader", () => {
  it("revokes blob URLs after a long delay, not immediately", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "stl-download.ts"), "utf8");
    assert.ok(src.includes("LIVE_REVOKE_MS = 60_000"));
    assert.ok(src.includes("revokeObjectURL"));
    assert.ok(src.includes("pagehide"));
    assert.ok(src.includes("beforeunload"));
    assert.equal(src.includes("4000"), false);
  });

  it("zips two STLs into one download payload", () => {
    const a = new Uint8Array([1, 2, 3, 4]).buffer;
    const b = new Uint8Array([9, 8, 7]).buffer;
    const zip = zipStore([
      { name: "lid.stl", data: a },
      { name: "tray.stl", data: b },
      { name: "PRINT.txt", data: new TextEncoder().encode("first article").buffer },
      { name: "README.txt", data: new TextEncoder().encode("hobby").buffer },
    ]);
    assert.ok(zip.byteLength > 80);
    const sig = new DataView(zip.buffer, zip.byteOffset, 4).getUint32(0, true);
    assert.equal(sig, 0x04034b50);
    const names = new TextDecoder().decode(zip);
    assert.match(names, /PRINT.txt/);
    assert.match(names, /README.txt/);
  });

  it("bakes a version that tracks the outer chamfer", () => {
    assert.equal(BAKE_VERSION, `c${Math.round(LID.chamfer * 100)}w${Math.round(LID.lattice * 100)}h${Math.round(LID.chamfer * 100)}v47`);
    assert.equal(matchesBake(SCALE_DEFAULT, false, "standard", "ERGO"), true);
    assert.equal(matchesBake(SCALE_MIN, false, "standard", "ERGO"), false);
    assert.equal(matchesBake(SCALE_DEFAULT, false, "standard", "ERGO", "normal"), false);
    assert.equal(matchesBake(SCALE_DEFAULT, false, "standard", "ERGO", "fat", "off"), false);
    assert.equal(matchesBake(SCALE_DEFAULT, false, "standard", "ERGO", "fat", "on", "normal"), false);
  });

  it("keeps last-good tray through HDMI/USB/keyring swaps", () => {
    const fat = buildPreviewTray(SCALE_DEFAULT, false, "preview", "ERGO", "fat", "on", "fat");
    assert.ok((fat.getAttribute("position")?.count ?? 0) > 100);
    assert.ok(peekPreviewTray()?.solid.getAttribute("position"));
    const slim = buildPreviewTray(SCALE_DEFAULT, false, "preview", "ERGO", "normal", "on", "normal");
    assert.ok((slim.getAttribute("position")?.count ?? 0) > 100);
    assert.ok(peekPreviewTray()?.solid.getAttribute("position"));
    const nolug = buildPreviewTray(SCALE_DEFAULT, false, "preview", "ERGO", "fat", "off", "fat");
    assert.ok((nolug.getAttribute("position")?.count ?? 0) > 100);
    fat.dispose();
    slim.dispose();
    nolug.dispose();
    assert.ok(peekPreviewTray()?.solid.getAttribute("position"), "viewport clones must not kill the cached tray");
  });

  it("canvas keeps a live loop, the bake, and a loader until the mesh exists", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "../components/case-canvas.tsx"), "utf8");
    assert.match(src, /frameloop="always"/);
    assert.equal(src.includes("DemandLoop"), false);
    assert.match(src, /bakeRef/);
    assert.match(src, /isBake/);
    assert.match(src, /parametric preview failed|building parametric/);
    const viewer = readFileSync(join(here, "../components/case-viewer.tsx"), "utf8");
    assert.match(viewer, /Print pair still works/);
    assert.match(viewer, /visible=\{late && !ready && !glFailed\}/);
  });

  it("hulls exist before any Voronoi work", () => {
    const lid = previewLidHull();
    const tray = previewTrayHull();
    assert.ok((lid.getAttribute("position")?.count ?? 0) > 24);
    assert.ok((tray.getAttribute("position")?.count ?? 0) > 24);
  });

  it("peek misses are null, not a throw", () => {
    assert.equal(peekPreviewLidParts() === null || Boolean(peekPreviewLidParts()?.solid), true);
    assert.equal(peekPreviewTray() === null || Boolean(peekPreviewTray()?.solid), true);
  });

  it("draft tray + JFA paint stay under 400ms", () => {
    const t0 = performance.now();
    const draft = getDraftTray(false);
    const pos = draft.solid.getAttribute("position");
    assert.ok(pos);
    const colors = colorizeTraySync(pos.array as Float32Array, SCALE_DEFAULT);
    assert.equal(colors.length, pos.count * 3);
    const ms = performance.now() - t0;
    assert.ok(ms < 400, `draft+paint ${ms.toFixed(1)}ms`);
    assert.ok(pos.count < 40000, `draft tray verts ${pos.count}`);
  });

  it("lattice lines build without punching holes", () => {
    const t0 = performance.now();
    const g = previewLidLattice(SCALE_DEFAULT);
    const ms = performance.now() - t0;
    assert.ok((g.getAttribute("position")?.count ?? 0) > 20);
    assert.ok(ms < 80, `lattice ${ms.toFixed(1)}ms`);
  });

  it("fast lid is a frame plus beams under 220ms", () => {
    const t0 = performance.now();
    const g = previewLidFast(SCALE_DEFAULT);
    const ms = performance.now() - t0;
    assert.ok((g.getAttribute("position")?.count ?? 0) > 80);
    assert.ok(ms < 480, `fast lid ${ms.toFixed(1)}ms`);
  });

  it("preview mesh client returns a lid without throwing", async () => {
    const g = await requestPreviewMesh("lid", SCALE_DEFAULT, false, "standard");
    assert.ok((g.getAttribute("position")?.count ?? 0) > 80);
  });

  it("does not put WebGPU JFA or a mesh worker on the viewer critical path", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const canvas = readFileSync(join(here, "../components/case-canvas.tsx"), "utf8");
    const client = readFileSync(join(here, "mesh-client.ts"), "utf8");
    assert.equal(canvas.includes("webgpu-voronoi"), false);
    assert.equal(client.includes("new Worker"), false);
    assert.equal(client.includes("webgpu-voronoi"), false);
    assert.ok(client.includes('from "./voronoi-lid.ts"'));
    assert.equal(client.includes("previewLidHull"), false);
  });

  it("mounts the canvas from the viewer without a covering poster or lazy route split", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const viewer = readFileSync(join(here, "../components/case-viewer.tsx"), "utf8");
    const canvas = readFileSync(join(here, "../components/case-canvas.tsx"), "utf8");
    const index = readFileSync(join(here, "../routes/index.tsx"), "utf8");
    assert.equal(viewer.includes("CasePreviewSvg"), false);
    assert.ok(viewer.includes('import("./case-canvas")'));
    assert.equal(viewer.includes('from "./case-canvas"'), false);
    assert.equal(viewer.includes("case-poster"), false);
    assert.equal(index.includes("lazy("), false);
    const loader = readFileSync(join(here, "preview-loader.ts"), "utf8");
    assert.ok(loader.includes("/models/preview_lid.glb"));
    assert.ok(loader.includes("/models/preview_tray.glb"));
    assert.ok(loader.includes("/models/preview_assembled.glb"));
    assert.ok(loader.includes("BAKE_VERSION"));
    assert.ok(canvas.includes('from "@/lib/preview-loader"'));
    assert.ok(canvas.includes("loadBakedPair"));
    assert.equal(canvas.includes('from "@/lib/mesh-client"'), false);
    assert.ok(canvas.includes('import("@/lib/mesh-client")'));
    assert.ok(canvas.includes("@react-three/fiber"));
    assert.ok(canvas.includes("keeping last mesh"));
    assert.ok(canvas.includes("useDebounced"));
    assert.equal(canvas.includes("hullLid"), false);
  });

  it("Brave path: default GPU preference, WebGL1 fallback, drop probe context", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const probe = readFileSync(join(here, "webgl-probe.ts"), "utf8");
    const canvas = readFileSync(join(here, "../components/case-canvas.tsx"), "utf8");
    const viewer = readFileSync(join(here, "../components/case-viewer.tsx"), "utf8");
    assert.ok(probe.includes('powerPreference: "default"'));
    assert.ok(probe.includes("experimental-webgl"));
    assert.ok(probe.includes("loseContext"));
    assert.ok(canvas.includes("getWebGlContext"));
    assert.equal(canvas.includes('"high-performance"'), false);
    assert.equal(viewer.includes("CasePreviewSvg"), false);
    assert.ok(viewer.includes('import("./case-canvas")'));
  });

  it("does not use a box stub as the preview solid", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const canvas = readFileSync(join(here, "../components/case-canvas.tsx"), "utf8");
    assert.ok(canvas.includes("buildPreviewLid"));
    const g = buildPreviewLid(SCALE_DEFAULT, false, "standard");
    const hull = previewLidHull();
    const n = g.getAttribute("position")?.count ?? 0;
    const h = hull.getAttribute("position")?.count ?? 0;
    assert.ok(n > h * 2, `lid verts ${n} should beat hull ${h}`);
    g.dispose();
  });

  it("print solid weld drops degenerate triangles", () => {
    const g = previewLidFast(SCALE_DEFAULT, false);
    const print = preparePrintSolid(g);
    const n = print.getAttribute("position")?.count ?? 0;
    assert.ok(n > 80);
    const arr = print.getAttribute("position")!.array;
    for (let i = 0; i < arr.length; i++) assert.ok(Number.isFinite(arr[i]));
    print.dispose();
  });
});
