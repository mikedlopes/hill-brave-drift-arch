/** Frozen product format. Future devices / patterns / styles plug into this shape.
 *  Do not import three.js here — the harness must run without WebGL. */

import {
  HDMI_PLUG_DEFAULT,
  KEYRING_DEFAULT,
  LID,
  LLOYD_ITERS,
  PI_ZERO,
  PRINT,
  PRINT_FIT_DEFAULT,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  USB_PLUG_DEFAULT,
  printPairZipName,
} from "./case-params.ts";

export const FORMAT_VERSION = 2;
export const FORMAT_FAMILY = "pizero-case";

export type SlotStatus = "shipping" | "same-envelope" | "planned" | "forbidden";

export type FormatSlot = {
  id: string;
  status: SlotStatus;
  note: string;
};

export type CaseFormatSnapshot = {
  family: typeof FORMAT_FAMILY;
  version: typeof FORMAT_VERSION;
  device: {
    id: "pi-zero";
    name: "Raspberry Pi Zero";
    drawing: string;
    pcb: { length: number; width: number; thick: number; corner: number };
    holes: { dia: number; ox: number; oy: number; sx: number; sy: number };
    ports: { hdmi: number; usbPower: number; usbOtg: number; sdFromSouth: number };
  };
  envelope: {
    length: number;
    width: number;
    trayH: number;
    lidThick: number;
    assembled: number;
    wall: number;
    corner: number;
    chamfer: number;
  };
  pattern: {
    id: "truncated-cvt-voronoi";
    lloydIters: number;
    boundarySeeds: "ghosts";
    web: number;
    holeCornerR: number;
    scaleMin: number;
    scaleMax: number;
    scaleDefault: number;
    scaleStep: number;
    punch: "offset-convex";
    jitterMinPct: number;
    jitterMaxPct: number;
    sliverMinArea: number;
    sliverMinInradius: number;
    fieldAt2x: number;
    webMinAt2x: number;
  };
  style: {
    id: "keychain-cover";
    gpio: "covered";
    hat: false;
    camera: "ribbon-window";
    filament: "#e24a1c";
    chrome: "#FF5E18";
  };
  mods: {
    fastener: ["snap", "screw"];
    fit: ["tight", "standard", "loose"];
    hdmi: ["normal", "fat"];
    usb: ["normal", "fat"];
    keyring: ["on", "off"];
    labelDefault: string;
  };
  defaults: {
    fastener: "snap";
    fit: typeof PRINT_FIT_DEFAULT;
    hdmi: typeof HDMI_PLUG_DEFAULT;
    usb: typeof USB_PLUG_DEFAULT;
    keyring: typeof KEYRING_DEFAULT;
    scale: number;
    label: string;
    zip: string;
  };
  lug: { bulbR: number; holeR: number; height: number; out: number };
  finish: {
    lidWindow: "through-cut";
    lidFrame: "solid";
    trayFloor: "deboss";
    trayFloorDepth: number;
    trayWalls: "smooth";
    outerChamfer: number;
    outerChamferDeg: 45;
    portChamfer: number;
    snapNubR: number;
    cacheLid: string;
    bake: string;
  };
  print: {
    layer: string;
    walls: string;
    infill: string;
    supports: string;
    lidPose: string;
    trayPose: string;
    firstArticle: string;
  };
};

export const DEVICE_SLOTS: FormatSlot[] = [
  { id: "pi-zero", status: "shipping", note: "RP-008365. Only shipping board." },
  { id: "pi-zero-w", status: "same-envelope", note: "Same 65×30. Add antenna keepout on south-west. Do not retarget this case." },
  { id: "pi-zero-2w", status: "same-envelope", note: "Same holes. SoC heat — vents, not a Faraday lattice. Separate family after a printed Zero pair." },
  { id: "pi-pico", status: "planned", note: "Different board. New millimetre table. Never scale this envelope." },
  { id: "pi-3", status: "forbidden", note: "Do not scale a Zero case up. New family." },
  { id: "pi-4", status: "forbidden", note: "Do not scale a Zero case up. New family." },
  { id: "pi-5", status: "forbidden", note: "Do not scale a Zero case up. New family." },
];

export const PATTERN_SLOTS: FormatSlot[] = [
  { id: "truncated-cvt-voronoi", status: "shipping", note: "Relaxed Voronoi: Poisson min-distance = spacing, 2 Lloyd, jitter 6–16%, Chew voids, cull slivers (area < 9 or inradius < 1.32), offset-only punches. Clip to Ω. Hole rims R0.80. Through-cut on the lid window only. Tray floor 0.42 mm deboss. Lid frame + tray walls smooth. 1.5×–2×. 2× field 52 cells, web ≥ 1.4 mm." },
  { id: "hex-honeycomb", status: "planned", note: "hex-lattice.ts exists. Regular hex, stronger print, not the photo." },
  { id: "frustum-hex", status: "planned", note: "45° inward chamfer cells. Same web 1.2 mm min." },
  { id: "solid-lid", status: "planned", note: "No lattice. GPIO still covered unless a well style is chosen." },
  { id: "slot-vents", status: "planned", note: "Linear slots for Zero 2 W heat. Keep antenna window open." },
];

export const STYLE_SLOTS: FormatSlot[] = [
  { id: "keychain-cover", status: "shipping", note: "GPIO covered. No HAT. CSI is a ribbon window. NE paddle-eye." },
  { id: "gpio-well", status: "planned", note: "Open 40-pin well. New lid stack. Do not fake it by thinning this lattice." },
  { id: "camera-hood", status: "planned", note: "CSI puck is a separate STL. East window stays." },
  { id: "tpu-bumper", status: "planned", note: "Second body, not a boolean on the tray." },
];

export const MOD_SLOTS: FormatSlot[] = [
  { id: "fastener", status: "shipping", note: "snap | screw" },
  { id: "print-fit", status: "shipping", note: "tight | standard | loose. Owns lipClear + socketR. Does not scale snapNubR." },
  { id: "hdmi-plug", status: "shipping", note: "normal | fat" },
  { id: "usb-plug", status: "shipping", note: "normal | fat" },
  { id: "keyring", status: "shipping", note: "on | off. BASE only, opposite SD." },
  { id: "north-label", status: "shipping", note: "Emboss ERGO-class string on GPIO wall." },
  { id: "sd-flap", status: "planned", note: "Print-in-place only if clearance is proven." },
  { id: "led-pipe", status: "planned", note: "Activity LED on the Zero. Light pipe, not a hole through the PCB pocket." },
  { id: "feet", status: "planned", note: "Rubber-foot wells on tray floor. Separate from pegs." },
];

export function buildFormatSnapshot(): CaseFormatSnapshot {
  return {
    family: FORMAT_FAMILY,
    version: FORMAT_VERSION,
    device: {
      id: "pi-zero",
      name: "Raspberry Pi Zero",
      drawing: PI_ZERO.drawing,
      pcb: {
        length: PI_ZERO.length,
        width: PI_ZERO.width,
        thick: PI_ZERO.pcb,
        corner: PI_ZERO.corner,
      },
      holes: {
        dia: PI_ZERO.holeDia,
        ox: PI_ZERO.holeOx,
        oy: PI_ZERO.holeOy,
        sx: PI_ZERO.holeSx,
        sy: PI_ZERO.holeSy,
      },
      ports: {
        hdmi: PI_ZERO.hdmi,
        usbPower: PI_ZERO.usbPower,
        usbOtg: PI_ZERO.usbOtg,
        sdFromSouth: PI_ZERO.sdFromSouth,
      },
    },
    envelope: {
      length: LID.length,
      width: LID.width,
      trayH: LID.trayH,
      lidThick: LID.thick,
      assembled: Number((LID.trayH + LID.thick).toFixed(2)),
      wall: LID.wall,
      corner: LID.corner,
      chamfer: LID.chamfer,
    },
    pattern: {
      id: "truncated-cvt-voronoi",
      lloydIters: LLOYD_ITERS,
      boundarySeeds: "ghosts",
      web: LID.lattice,
      holeCornerR: LID.chamfer,
      scaleMin: SCALE_MIN,
      scaleMax: SCALE_MAX,
      scaleDefault: SCALE_DEFAULT,
      scaleStep: SCALE_STEP,
      punch: "offset-convex",
      jitterMinPct: 6,
      jitterMaxPct: 16,
      sliverMinArea: 9,
      sliverMinInradius: 1.32,
      fieldAt2x: 52,
      webMinAt2x: 1.4,
    },
    style: {
      id: "keychain-cover",
      gpio: "covered",
      hat: false,
      camera: "ribbon-window",
      filament: "#e24a1c",
      chrome: "#FF5E18",
    },
    mods: {
      fastener: ["snap", "screw"],
      fit: ["tight", "standard", "loose"],
      hdmi: ["normal", "fat"],
      usb: ["normal", "fat"],
      keyring: ["on", "off"],
      labelDefault: "ERGO",
    },
    defaults: {
      fastener: "snap",
      fit: PRINT_FIT_DEFAULT,
      hdmi: HDMI_PLUG_DEFAULT,
      usb: USB_PLUG_DEFAULT,
      keyring: KEYRING_DEFAULT,
      scale: SCALE_DEFAULT,
      label: "ERGO",
      zip: printPairZipName({
        scale: SCALE_DEFAULT,
        fastener: "snap",
        hdmi: HDMI_PLUG_DEFAULT,
        usb: USB_PLUG_DEFAULT,
        keyring: KEYRING_DEFAULT,
      }),
    },
    lug: {
      bulbR: 7,
      holeR: 3.5,
      height: 3,
      out: 2,
    },
    finish: {
      lidWindow: "through-cut",
      lidFrame: "solid",
      trayFloor: "deboss",
      trayFloorDepth: 0.42,
      trayWalls: "smooth",
      outerChamfer: LID.chamfer,
      outerChamferDeg: 45,
      portChamfer: Number(Math.min(LID.chamfer, LID.wall * 0.34).toFixed(2)),
      snapNubR: LID.snapNubR,
      cacheLid: "v18chamfer",
      bake: "c80w150h80v47",
    },
    print: {
      layer: PRINT.layer,
      walls: PRINT.walls,
      infill: PRINT.infill,
      supports: PRINT.supports,
      lidPose: PRINT.lidPose,
      trayPose: PRINT.trayPose,
      firstArticle: PRINT.firstArticle,
    },
  };
}

export function snapshotJson(snap: CaseFormatSnapshot = buildFormatSnapshot()) {
  return `${JSON.stringify(snap, null, 2)}\n`;
}
