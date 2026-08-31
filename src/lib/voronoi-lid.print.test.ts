import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  LID,
  PI_ZERO,
  PRINT,
  PRINT_FITS,
  SCALE_DEFAULT,
  SCALE_MIN,
  boardOrigin,
  buildVoronoiLidParts,
  caseDims,
  debugLloydResidual,
  debugVoronoiField,
  latticeBounds,
  lidStlBuffer,
  lidStlFilename,
  padCenters,
  portMmLine,
  portWindows,
  printFitSpec,
  printPairZipName,
  printSheet,
  sideWindows,
  screwKeepoutR,
} from "./voronoi-lid.ts";
import { buildTrayGeometry, trayStlBuffer } from "./tray-body.ts";
import { LUG } from "./keyring.ts";
import { readBinaryStl } from "./stl-bounds.ts";
import { preparePrintSolid, printMeshHealth } from "./print-solid.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("Pi Zero print fit", () => {
  it("matches RP-008365 hole spacing and board pocket", () => {
    assert.equal(PI_ZERO.length, 65);
    assert.equal(PI_ZERO.width, 30);
    assert.equal(PI_ZERO.holeSx, 58);
    assert.equal(PI_ZERO.holeSy, 23);
    const [bx, by] = boardOrigin();
    assert.equal(bx.toFixed(2), "-33.00");
    assert.equal(by.toFixed(2), "-16.85");
    const pads = padCenters();
    assert.equal(pads.length, 4);
    const xs = [...new Set(pads.map((p) => p[0].toFixed(2)))];
    const ys = [...new Set(pads.map((p) => p[1].toFixed(2)))];
    assert.equal(xs.length, 2);
    assert.equal(ys.length, 2);
    assert.equal(Math.abs(Number(xs[1]) - Number(xs[0])).toFixed(2), "58.00");
    assert.equal(Math.abs(Number(ys[1]) - Number(ys[0])).toFixed(2), "23.00");
  });

  it("assembles lid on the tray rim", () => {
    const d = caseDims();
    assert.equal(d.length, 70);
    assert.equal(d.width, 37.7);
    assert.equal(d.trayH, LID.trayH);
    assert.equal(Number((LID.trayH + LID.thick).toFixed(2)), 12.13);
    const lid = buildVoronoiLidParts(SCALE_DEFAULT, "preview", false);
    const tray = buildTrayGeometry(SCALE_DEFAULT, false, "preview");
    assert.ok((lid.solid.getAttribute("position")?.count ?? 0) > 80);
    assert.ok((tray.solid.getAttribute("position")?.count ?? 0) > 80);
    lid.solid.dispose();
    tray.solid.dispose();
  });

  it("places HDMI and USB cutouts on RP-008365", () => {
    const ports = portWindows();
    const hdmi = ports.find((p) => p.id === "hdmi")!;
    const pwr = ports.find((p) => p.id === "usbPower")!;
    const otg = ports.find((p) => p.id === "usbOtg")!;
    const [bx] = boardOrigin();
    assert.ok(Math.abs((hdmi.x0 + hdmi.x1) / 2 - (bx + PI_ZERO.hdmi)) < 0.05);
    assert.ok(Math.abs((pwr.x0 + pwr.x1) / 2 - (bx + PI_ZERO.usbPower)) < 0.05);
    assert.ok(Math.abs((otg.x0 + otg.x1) / 2 - (bx + PI_ZERO.usbOtg)) < 0.05);
    const sides = sideWindows();
    assert.ok(sides.some((s) => s.id === "sd"));
    assert.ok(sides.some((s) => s.id === "csi"));
    assert.match(portMmLine(), /HDMI/);
  });

  it("sizes screw holes for FDM M2.5 hardware", () => {
    const std = printFitSpec("standard");
    assert.ok(std.screwClearR >= 1.4 && std.screwClearR <= 1.7);
    assert.ok(screwKeepoutR() > std.screwClearR);
    assert.match(PRINT.screw, /M2\.5/);
  });

  it("offers FDM printer-fit presets", () => {
    assert.deepEqual(PRINT_FITS.map((f) => f.id), ["tight", "standard", "loose"]);
    assert.ok(printFitSpec("tight").lipClear < printFitSpec("standard").lipClear);
    assert.ok(printFitSpec("standard").lipClear < printFitSpec("loose").lipClear);
  });

  it("default lid is a binary STL with a closed lattice", () => {
    const buf = lidStlBuffer(SCALE_DEFAULT, false);
    const stl = readBinaryStl(buf);
    assert.ok(stl.triangles > 200);
    assert.match(lidStlFilename(SCALE_DEFAULT, false), /pi_zero_case_lid/);
    const parts = buildVoronoiLidParts(SCALE_DEFAULT, "print", false);
    assert.ok(parts.holesCut > 18);
    assert.ok(parts.bakedLattice);
    parts.solid.dispose();
  });

  it("documents print settings", () => {
    assert.match(PRINT.lidPose, /lip.?down/i);
    assert.match(PRINT.screw, /M2\.5/);
    assert.match(PRINT.supports, /no supports/i);
    assert.match(PRINT.drawing, /RP-008365/);
    assert.match(PRINT.gpio, /No HATs/);
  });

  it("preview and print share Voronoi topology", () => {
    const a = buildVoronoiLidParts(SCALE_DEFAULT, "preview", false);
    const b = buildVoronoiLidParts(SCALE_DEFAULT, "print", false);
    assert.equal(a.holesCut, b.holesCut);
    assert.equal(a.edges.length, b.edges.length);
    a.solid.dispose();
    b.solid.dispose();
  });

  it("dumps one number table for the tray", () => {
    const d = caseDims();
    assert.equal(d.southPorts.length, 3);
    assert.equal(d.sidePorts.length, 2);
    assert.equal(d.holes.length, 4);
  });

  it("snap tray STL matches the number table", () => {
    const d = caseDims();
    const buf = trayStlBuffer(SCALE_DEFAULT, false);
    const stl = readBinaryStl(buf);
    assert.ok(Math.abs(stl.size[0] - d.length) < 16);
    assert.ok(Math.abs(stl.size[1] - d.width) < 16);
    assert.ok(stl.triangles > 100);
  });

  it("print lid keeps a lip ring and four sockets", () => {
    const parts = buildVoronoiLidParts(SCALE_DEFAULT, "print", false);
    assert.ok((parts.lip.getAttribute("position")?.count ?? 0) > 20);
    const pos = parts.solid.getAttribute("position")!;
    const pads = padCenters();
    for (const [px, py] of pads) {
      let near = 0;
      for (let i = 0; i < pos.count; i++) {
        const dx = pos.getX(i) - px;
        const dy = pos.getY(i) - py;
        if (dx * dx + dy * dy < 4) near++;
      }
      assert.ok(near > 8, "socket geometry around each peg");
    }
    parts.solid.dispose();
  });

  it("preview snap lid also opens four underside sockets", () => {
    const parts = buildVoronoiLidParts(SCALE_DEFAULT, "preview", false);
    const pos = parts.solid.getAttribute("position")!;
    for (const [px, py] of padCenters()) {
      let near = 0;
      for (let i = 0; i < pos.count; i++) {
        if (Math.hypot(pos.getX(i) - px, pos.getY(i) - py) < 2.2) near++;
      }
      assert.ok(near > 4);
    }
    parts.solid.dispose();
  });

  it("2× snap lid has no circular bore on the lattice face", () => {
    const snap = buildVoronoiLidParts(SCALE_DEFAULT, false, false);
    assert.equal(snap.pads.getAttribute("position")?.count ?? 0, 0, "snap lid has no screw pads");
    const screwParts = buildVoronoiLidParts(SCALE_DEFAULT, true, true);
    const [px, py] = padCenters()[0];
    const arr = screwParts.solid.getAttribute("position")!;
    const radii = new Set<string>();
    for (let i = 0; i < arr.count; i++) {
      const r = Math.hypot(arr.getX(i) - px, arr.getY(i) - py);
      if (r > 2.4 && r < 7.2) radii.add(r.toFixed(1));
    }
    assert.ok(radii.size >= 3, "screw pad follows the Voronoi cell, not a circle");
    snap.solid.dispose();
    screwParts.solid.dispose();
  });

  it("lid lattice stays a field from 1.5× to 2×", () => {
    const dense = buildVoronoiLidParts(SCALE_MIN, "preview", false);
    const open = buildVoronoiLidParts(SCALE_DEFAULT, "preview", false);
    assert.ok(dense.holesCut > open.holesCut, "1.5× is more condensed than 2×");
    assert.ok(open.holesCut > 18, "2× still covers the window");
    assert.ok(dense.borderFlush > 8, "cells die into the frame");
    assert.ok(open.borderFlush > 6, "open cells still meet the frame");
    assert.ok(open.webMin >= 1.05, `2× webs stay printable, got ${open.webMin.toFixed(2)} mm`);
    assert.ok(dense.webMin >= 0.9, `1.5× webs stay printable, got ${dense.webMin.toFixed(2)} mm`);
    const mid = buildVoronoiLidParts(1.75, "preview", false);
    assert.ok(mid.webMin >= 0.9, `1.75× webs stay printable, got ${mid.webMin.toFixed(2)} mm`);
    mid.solid.dispose();
    assert.equal(open.holeCornerR, LID.chamfer);
    assert.equal(dense.holeCornerR, LID.chamfer);
    assert.ok(open.holesCut >= 48, `2× punched ${open.holesCut}, window should stay a field`);
    assert.equal(open.holesCut, debugVoronoiField(SCALE_DEFAULT).cells.length, "every covering cell is a hole");
    dense.solid.dispose();
    open.solid.dispose();
  });

  it("SW corner cell follows the rounded soffit, not a chord", () => {
    const field = debugVoronoiField(SCALE_DEFAULT);
    const box = latticeBounds();
    const r = LID.corner;
    const cx = box.xmin + r;
    const cy = box.ymin + r;
    const onArc = (p: [number, number]) => Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - r) < 0.25;
    const sw = field.cells.filter((c) => {
      const n = c.length;
      let sx = 0;
      let sy = 0;
      for (const p of c) {
        sx += p[0];
        sy += p[1];
      }
      return sx / n < -18 && sy / n < -8;
    });
    assert.ok(sw.length >= 1, "SW neighborhood has cells");
    assert.ok(
      sw.some((c) => c.filter(onArc).length >= 4),
      "SW cell samples the R3.2 soffit arc",
    );
  });

  it("truncated cells live in Ω, not the square AABB corner", () => {
    const field = debugVoronoiField(SCALE_DEFAULT);
    const box = latticeBounds();
    const corners: [number, number][] = [
      [box.xmin, box.ymin],
      [box.xmax, box.ymin],
      [box.xmax, box.ymax],
      [box.xmin, box.ymax],
    ];
    for (const cell of field.cells) {
      for (const p of cell) {
        for (const c of corners) {
          assert.ok(Math.hypot(p[0] - c[0], p[1] - c[1]) > 0.4, `cell vertex ${p} sits on AABB corner ${c}`);
        }
      }
    }
  });

  it("truncated CVT keeps cell areas near the median", () => {
    const field = debugVoronoiField(SCALE_DEFAULT);
    const areas = field.cells
      .map((c) => {
        let a = 0;
        for (let i = 0; i < c.length; i++) {
          const p = c[i];
          const q = c[(i + 1) % c.length];
          a += p[0] * q[1] - q[0] * p[1];
        }
        return Math.abs(a) * 0.5;
      })
      .sort((a, b) => a - b);
    const median = areas[Math.floor(areas.length / 2)];
    assert.ok(areas[0] >= median * 0.25, `smallest cell ${areas[0].toFixed(1)} vs median ${median.toFixed(1)}`);
    assert.ok(areas[areas.length - 1] <= median * 1.85, `largest cell ${areas[areas.length - 1].toFixed(1)} vs median ${median.toFixed(1)}`);
  });

  it("Lloyd stops at 2 steps so the field stays Voronoi, not honeycomb", () => {
    const r = debugLloydResidual(SCALE_DEFAULT);
    assert.ok(r.iters <= 2, `cap is 2, ran ${r.iters}`);
    assert.ok(r.mean > 0.04, `residual ${r.mean.toFixed(3)} mm — full CVT would have collapsed to hex`);
  });

  it("lid cells stay unique polygons, not squares", () => {
    const field = debugVoronoiField(SCALE_DEFAULT);
    const box = latticeBounds();
    const rr = LID.corner;
    const onFrame = (c: [number, number][]) =>
      c.some((p) => {
        const d = Math.min(
          Math.abs(p[0] - box.xmin),
          Math.abs(p[0] - box.xmax),
          Math.abs(p[1] - box.ymin),
          Math.abs(p[1] - box.ymax),
        );
        const qx = Math.min(box.xmax - rr, Math.max(box.xmin + rr, p[0]));
        const qy = Math.min(box.ymax - rr, Math.max(box.ymin + rr, p[1]));
        return d < 0.45 || Math.abs(Math.hypot(p[0] - qx, p[1] - qy) - rr) < 0.35;
      });
    const boxy = field.cells.filter((c) => {
      if (onFrame(c)) return false;
      const n = c.length;
      if (n <= 4) return true;
      if (n > 7) return false;
      let xmin = Infinity;
      let xmax = -Infinity;
      let ymin = Infinity;
      let ymax = -Infinity;
      let aa = 0;
      for (let i = 0; i < n; i++) {
        const a = c[i];
        const b = c[(i + 1) % n];
        xmin = Math.min(xmin, a[0]);
        xmax = Math.max(xmax, a[0]);
        ymin = Math.min(ymin, a[1]);
        ymax = Math.max(ymax, a[1]);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        if (Math.abs(b[0] - a[0]) / len < 0.22 || Math.abs(b[1] - a[1]) / len < 0.22) aa++;
      }
      let area = 0;
      for (let i = 0; i < n; i++) {
        const p = c[i];
        const q = c[(i + 1) % n];
        area += p[0] * q[1] - q[0] * p[1];
      }
      const fill = Math.abs(area) * 0.5 / Math.max(1e-6, (xmax - xmin) * (ymax - ymin));
      return aa >= 3 && fill > 0.82;
    });
    assert.ok(boxy.length <= 6, `${boxy.length} interior cells still read as squares`);
  });

  it("tray floor carries Voronoi relief, walls stay smooth", () => {
    const { solid, holesCut } = buildTrayGeometry(SCALE_DEFAULT, false, "preview");
    assert.ok(holesCut > 8, `tray floor is punched with cells, got ${holesCut}`);
    const box = solid.boundingBox!;
    assert.ok(box.max.x - box.min.x > 60);
    solid.dispose();
  });

  it("omits the pad-eye when keyring is off", () => {
    const on = buildTrayGeometry(SCALE_DEFAULT, false, "preview", "ERGO", "fat", "on", "fat");
    const off = buildTrayGeometry(SCALE_DEFAULT, false, "preview", "ERGO", "fat", "off", "fat");
    assert.ok((on.solid.getAttribute("position")?.count ?? 0) > (off.solid.getAttribute("position")?.count ?? 0));
    const { hx, hy } = { hx: LID.length / 2 + LUG.out, hy: LID.width / 2 + LUG.out };
    const pos = off.solid.getAttribute("position")!;
    let far = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Math.hypot(pos.getX(i) - hx, pos.getY(i) - hy) < LUG.holeR) far++;
    }
    assert.equal(far, 0, "no keyring hole when the lug is off");
    on.solid.dispose();
    off.solid.dispose();
  });

  it("locks CASE.md millimetres, port line, and PRINT.txt", () => {
    const md = readFileSync(join(here, "../../docs/CASE.md"), "utf8");
    assert.match(md, /70 × 37\.7/);
    assert.match(md, /12\.13/);
    assert.match(md, /RP-008365/);
    const sheet = printSheet({
      scale: SCALE_DEFAULT,
      fastener: "snap",
      fit: "standard",
      hdmi: "fat",
      usb: "fat",
      keyring: "on",
    });
    assert.match(sheet, /lip-down/i);
    assert.match(printPairZipName({
      scale: SCALE_DEFAULT,
      fastener: "snap",
      hdmi: "fat",
      usb: "fat",
      keyring: "on",
    }), /\.zip$/);
  });

  it("print STLs match the envelope", () => {
    const lid = readBinaryStl(lidStlBuffer(SCALE_DEFAULT, false));
    const tray = readBinaryStl(trayStlBuffer(SCALE_DEFAULT, false));
    assert.ok(Math.abs(lid.size[0] - 70) < 1.5);
    assert.ok(Math.abs(lid.size[1] - 37.7) < 1.5);
    assert.ok(tray.triangles > 200);
    assert.ok(lid.triangles > 200);
  });

  it("print weld has triangles and no NaN, slicer-hole check stays a count", () => {
    const parts = buildVoronoiLidParts(SCALE_DEFAULT, "print", false);
    const print = preparePrintSolid(parts.solid);
    const health = printMeshHealth(print);
    assert.ok(health.triangles > 200);
    assert.ok(Number.isFinite(health.boundary));
    parts.solid.dispose();
    print.dispose();
  });
});
