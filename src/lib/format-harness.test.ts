import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEVICE_SLOTS,
  FORMAT_FAMILY,
  FORMAT_VERSION,
  MOD_SLOTS,
  PATTERN_SLOTS,
  STYLE_SLOTS,
  buildFormatSnapshot,
  snapshotJson,
} from "./format-harness.ts";
import { buildVoronoiLidParts } from "./voronoi-lid.ts";
import { buildTrayGeometry } from "./tray-body.ts";
import { cadGateClosed } from "./print-gate-b.ts";
import { LUG } from "./keyring.ts";
import { NORTH_LABEL_DEFAULT } from "./north-type.ts";

const goldPath = join(dirname(fileURLToPath(import.meta.url)), "../../docs/harness-snapshot.json");

describe("Case format harness", () => {
  it("shipping snapshot matches the gold file", () => {
    const live = buildFormatSnapshot();
    const gold = JSON.parse(readFileSync(goldPath, "utf8"));
    assert.equal(live.family, FORMAT_FAMILY);
    assert.equal(live.version, FORMAT_VERSION);
    assert.equal(live.pattern.holeCornerR, live.envelope.chamfer);
    assert.equal(live.pattern.holeCornerR, 0.8);
    assert.deepEqual(live, gold);
    assert.equal(snapshotJson(live), `${JSON.stringify(gold, null, 2)}\n`);
  });

  it("locks the shipping device / pattern / style", () => {
    const live = buildFormatSnapshot();
    assert.equal(live.device.id, "pi-zero");
    assert.equal(live.device.pcb.length, 65);
    assert.equal(live.device.pcb.width, 30);
    assert.equal(live.pattern.id, "truncated-cvt-voronoi");
    assert.equal(live.pattern.lloydIters, 2);
    assert.equal(live.pattern.boundarySeeds, "ghosts");
    assert.equal(live.pattern.scaleMin, 1.5);
    assert.equal(live.pattern.scaleMax, 2);
    assert.equal(live.pattern.scaleDefault, 2);
    assert.equal(live.pattern.punch, "offset-convex");
    assert.equal(live.pattern.fieldAt2x, 52);
    assert.equal(live.pattern.webMinAt2x, 1.4);
    assert.equal(live.pattern.jitterMinPct, 6);
    assert.equal(live.pattern.jitterMaxPct, 16);
    assert.equal(live.style.id, "keychain-cover");
    assert.equal(live.style.hat, false);
    assert.equal(live.style.gpio, "covered");
    assert.equal(live.defaults.zip, "pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug.zip");
    assert.equal(live.envelope.assembled, 12.13);
    assert.equal(live.lug.bulbR, LUG.bulbR);
    assert.equal(live.lug.holeR, LUG.holeR);
    assert.equal(live.lug.height, LUG.height);
    assert.equal(live.lug.out, LUG.out);
    assert.equal(live.defaults.label, NORTH_LABEL_DEFAULT);
    assert.equal(live.finish.lidWindow, "through-cut");
    assert.equal(live.finish.lidFrame, "solid");
    assert.equal(live.finish.trayFloor, "deboss");
    assert.equal(live.finish.trayWalls, "smooth");
    assert.equal(live.finish.outerChamferDeg, 45);
    assert.equal(live.finish.outerChamfer, 0.8);
    assert.equal(live.finish.snapNubR, 0.45);
    assert.equal(live.finish.cacheLid, "v18chamfer");
    assert.equal(live.finish.bake, "c80w150h80v47");
  });

  it("roadmap slots exist and do not ship forbidden boards", () => {
    const ship = (rows: typeof DEVICE_SLOTS) => rows.filter((r) => r.status === "shipping").map((r) => r.id);
    assert.deepEqual(ship(DEVICE_SLOTS), ["pi-zero"]);
    assert.deepEqual(ship(PATTERN_SLOTS), ["truncated-cvt-voronoi"]);
    assert.deepEqual(ship(STYLE_SLOTS), ["keychain-cover"]);
    assert.ok(DEVICE_SLOTS.some((r) => r.id === "pi-4" && r.status === "forbidden"));
    assert.ok(MOD_SLOTS.some((r) => r.id === "keyring" && r.status === "shipping"));
    assert.ok(MOD_SLOTS.some((r) => r.id === "sd-flap" && r.status === "planned"));
  });

  it("default generators still emit a lid and a tray", () => {
    const snap = buildFormatSnapshot();
    const lid = buildVoronoiLidParts(snap.defaults.scale, "preview", false);
    const tray = buildTrayGeometry(
      snap.defaults.scale,
      false,
      "preview",
      snap.defaults.label,
      snap.defaults.hdmi,
      snap.defaults.keyring,
      snap.defaults.usb,
    );
    assert.ok(lid.holesCut > 18, "default lattice still a field");
    assert.equal(lid.holesCut, snap.pattern.fieldAt2x, "2× field is the locked cell count");
    assert.ok(lid.webMin >= snap.pattern.webMinAt2x, `2× web ${lid.webMin.toFixed(2)} below floor ${snap.pattern.webMinAt2x}`);
    assert.ok((lid.solid.getAttribute("position")?.count ?? 0) > 200);
    assert.ok((tray.solid.getAttribute("position")?.count ?? 0) > 200);
    lid.solid.dispose();
    tray.solid.dispose();
  });

  it("B CAD gate is still closed on the shipping format", () => {
    assert.equal(cadGateClosed(), true);
  });
});
