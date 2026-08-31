import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LID } from "./case-params.ts";
import {
  BOARD,
  CATALOGUE_PLUGS,
  HDMI_TYPE_C,
  SNAP_NUB,
  USB_MICRO_B,
  plugFits,
  plugWindows,
  thickGrowRule,
} from "./plug-library.ts";

describe("Pi Zero plug library", () => {
  it("is Raspberry Pi Zero only", () => {
    assert.equal(BOARD, "Raspberry Pi Zero");
    assert.match(thickGrowRule(), /grow Thick/);
    assert.equal(SNAP_NUB.r, LID.snapNubR);
    assert.equal(SNAP_NUB.grow, 0.1);
  });

  it("locks Type C + Micro-B metal and Thick windows", () => {
    const w = plugWindows();
    assert.equal(HDMI_TYPE_C.metalW, 10.42);
    assert.equal(HDMI_TYPE_C.metalH, 2.42);
    assert.equal(USB_MICRO_B.ifOvermoldH, 8.5);
    assert.equal(w.thickHdmi.w.toFixed(1), "16.2");
    assert.equal(w.thickHdmi.h.toFixed(1), "6.9");
    assert.equal(w.thickUsb.w.toFixed(1), "11.0");
    assert.equal(w.thickUsb.h.toFixed(1), "6.9");
  });

  it("does not guess Slim: USB-IF height fails Thick; bare metal fits", () => {
    const w = plugWindows();
    assert.equal(plugFits(HDMI_TYPE_C.metalW, HDMI_TYPE_C.jackH, w.thickHdmi), "fits");
    assert.equal(plugFits(...CATALOGUE_PLUGS[0].hdmi, w.thickHdmi), "fits");
    assert.equal(plugFits(...CATALOGUE_PLUGS[1].hdmi, w.thickHdmi), "height-fail");
    assert.equal(plugFits(...CATALOGUE_PLUGS[2].usb, w.thickUsb), "height-fail");
    assert.equal(plugFits(USB_MICRO_B.ifOvermoldW, USB_MICRO_B.ifOvermoldH, w.thickUsb), "height-fail");
  });
});
