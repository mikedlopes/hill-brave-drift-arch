import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { B_PRINT, cadGateClosed, printGateB } from "./print-gate-b.ts";

describe("B print gate (CAD)", () => {
  it("default pair is the first-print zip", () => {
    assert.equal(B_PRINT.scale, 2);
    assert.equal(B_PRINT.fastener, "snap");
    assert.equal(B_PRINT.fit, "standard");
    assert.equal(B_PRINT.hdmi, "fat");
    assert.equal(B_PRINT.usb, "fat");
    assert.equal(B_PRINT.keyring, "on");
    assert.equal(B_PRINT.zip, "pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug.zip");
    assert.match(B_PRINT.lidPose, /lip-down/);
    assert.match(B_PRINT.trayPose, /floor-down/);
  });

  it("CAD dry-fit does not fail any of the seven tests", () => {
    const rows = printGateB();
    assert.equal(rows.length, 7);
    assert.equal(rows.map((r) => r.id).join(","), "b1,b2,b3,b4,b5,b6,b7");
    for (const row of rows) {
      assert.notEqual(row.cad, "fail", `${row.id} ${row.name}: ${row.mm}`);
    }
    assert.equal(cadGateClosed(), true);
  });
});
