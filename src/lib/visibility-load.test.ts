import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IO_THRESHOLDS,
  MOUNT_AT,
  shouldMount,
  shouldPrefetch,
  visibilityPct,
} from "./visibility-load.ts";

describe("IntersectionObserver thresholds", () => {
  it("uses a ladder so a pane taller than the viewport can still mount", () => {
    assert.ok(IO_THRESHOLDS[0] === 0);
    assert.ok(MOUNT_AT < 1);
    assert.ok(IO_THRESHOLDS.includes(MOUNT_AT));
    assert.equal(Math.max(...IO_THRESHOLDS), 1);
  });

  it("prefetches on first pixel, not full visibility", () => {
    assert.equal(shouldPrefetch(0, true), true);
    assert.equal(shouldPrefetch(0, false), false);
    assert.equal(shouldPrefetch(1, true), true);
  });

  it("does not wait for threshold 1 to mount WebGL", () => {
    assert.equal(shouldMount(1, true), true);
    assert.equal(shouldMount(0.08, true), true);
    assert.equal(shouldMount(0.5, true), true);
    assert.equal(shouldMount(0.07, true), false);
    assert.equal(shouldMount(0.08, false), false);
  });

  it("treats a 0-ratio intersecting sliver as mountable (zero-height layout)", () => {
    assert.equal(shouldMount(0, true), true);
  });

  it("maps visibility into the boot bar, not 100%", () => {
    assert.equal(visibilityPct(0), 8);
    assert.equal(visibilityPct(1), 40);
    assert.ok(visibilityPct(0.5) > visibilityPct(0.08));
  });
});
