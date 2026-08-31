/**
 * Pi Zero plug library (RP-008365).
 * Not Zero 2 / 2W. Catalogue millimetres until a printed pair is calipered.
 * Do not grow Slim. If Thick is tight after B, grow Thick.
 */
import { LID, southPortBand, southPortWidth } from "./case-params.ts";

export const BOARD = "Raspberry Pi Zero" as const;

export const HDMI_TYPE_C = {
  metalW: 10.42,
  metalH: 2.42,
  jackW: 11.2,
  jackH: 3.2,
} as const;

export const USB_MICRO_B = {
  metalW: 6.85,
  metalH: 1.8,
  jackW: 8.0,
  jackH: 2.5,
  /** USB-IF overmold max. Height 8.5 will not fit a 6.9 mm window. */
  ifOvermoldW: 10.6,
  ifOvermoldH: 8.5,
} as const;

export const SNAP_NUB = {
  r: LID.snapNubR,
  /** If the lid walks after 10 cycles, add this. Do not switch the default to screws. */
  grow: 0.1,
} as const;

export function plugWindows() {
  return {
    slimHdmi: { w: southPortWidth("hdmi", "normal"), h: southPortBand("normal", HDMI_TYPE_C.jackH, 0.5).h },
    thickHdmi: { w: southPortWidth("hdmi", "fat"), h: southPortBand("fat", HDMI_TYPE_C.jackH, 0.5).h },
    slimUsb: { w: southPortWidth("usb", "normal"), h: southPortBand("normal", USB_MICRO_B.jackH, 0.4).h },
    thickUsb: { w: southPortWidth("usb", "fat"), h: southPortBand("fat", USB_MICRO_B.jackH, 0.4).h },
  };
}

/** Three stand-in overmolds. Replace with calipers after B. */
export const CATALOGUE_PLUGS = [
  { id: "bare", label: "Thin strain-relief", hdmi: [11.5, 5.5] as const, usb: [8.2, 5.0] as const },
  { id: "chunky", label: "Chunky molded mini-HDMI", hdmi: [15.0, 7.5] as const, usb: [10.0, 7.0] as const },
  { id: "if-max", label: "USB-IF overmold max", hdmi: [16.0, 8.5] as const, usb: [10.6, 8.5] as const },
] as const;

export function plugFits(
  w: number,
  h: number,
  window: { w: number; h: number },
): "fits" | "width-fail" | "height-fail" {
  if (w > window.w + 0.05) return "width-fail";
  if (h > window.h + 0.05) return "height-fail";
  return "fits";
}

export function thickGrowRule() {
  return "If a measured fat mini-HDMI exceeds 16.2 × 6.9, grow Thick (+0.4 W then +0.3 H). Do not make Slim the default.";
}
