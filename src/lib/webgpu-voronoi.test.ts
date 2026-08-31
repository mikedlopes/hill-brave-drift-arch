import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bruteNearestField,
  jfaAgreement,
  jumpFloodCpu,
  nearestSiteColors,
  poissonSites,
} from "./webgpu-voronoi.ts";

const BOX = { xmin: -42, ymin: -19, xmax: 35, ymax: 26 };

describe("Jump flood Voronoi", () => {
  it("CPU nearest-site paints more than one shade", () => {
    const sites = poissonSites(1.4, BOX);
    assert.ok(sites.length >= 8, "enough sites for a field");
    const pos = new Float32Array([-35, 0, 2, 0, 0, 2, 20, 10, 2, -10, 15, 8]);
    const colors = nearestSiteColors(pos, sites);
    assert.equal(colors.length, 12);
    const shades = new Set(
      [0, 1, 2, 3].map((i) => colors[i * 3].toFixed(3) + colors[i * 3 + 1].toFixed(3)),
    );
    assert.ok(shades.size >= 2, "cells do not collapse to one color");
  });

  it("fills every pixel with a site id", () => {
    const sites = poissonSites(1.4, BOX);
    const grid = jumpFloodCpu(sites, BOX, 64, 32);
    let empty = 0;
    for (let i = 3; i < grid.length; i += 4) if (grid[i] < 0) empty++;
    assert.equal(empty, 0);
  });

  it("1+JFA matches brute-force nearest seed", () => {
    const sites = poissonSites(1.4, BOX);
    const brute = bruteNearestField(sites, BOX, 64, 32);
    const plus = jumpFloodCpu(sites, BOX, 64, 32, true);
    const plusHit = jfaAgreement(plus, brute);
    assert.ok(plusHit >= 0.98, `1+JFA+1 agreement ${plusHit}`);
  });
});
