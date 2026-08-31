/** UI + print constants. No three.js — keeps the control panel from loading WebGL. */

export const PI_ZERO = {
  length: 65,
  width: 30,
  pcb: 1.4,
  holeDia: 2.75,
  holeOx: 3.5,
  holeOy: 3.5,
  holeSx: 58,
  holeSy: 23,
  corner: 3,
  hdmi: 12.4,
  hdmiW: 11.2,
  usbPower: 41.4,
  usbOtg: 54,
  usbW: 8,
  /** 0.4 mm nozzle. 0.6 CAD pad → ~0.4 after hole shrink. Tighter is a dare. */
  slimPad: 0.6,
  /** Mini HDMI Type C metal 10.42 × 2.42. Receptacle shell ~11.2 × 3.2. */
  hdmiJackH: 3.2,
  /** Micro-B metal 6.85 × 1.80. Receptacle shell ~8.0 × 2.5. */
  usbJackH: 2.5,
  portClear: 1.4,
  fatPlugHdmi: 1.1,
  fatPlugUsb: 0.12,
  fatPlugZ: 1.35,
  portZ0: 2.5,
  portZ1: 6.7,
  sd: 12,
  /** RP-008365: 16.9 mm from the HDMI/south edge to the SD centre (west). */
  sdFromSouth: 16.9,
  sdFromNorth: 13.1,
  csiFromRight: 12.6,
  csiW: 16.5,
  gpioFromRight: 3.5,
  gpioH: 4.73,
  sdBelow: 1.25,
  drawing:
    "https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf",
} as const;

export const LID = {
  length: 70,
  width: 37.7,
  thick: 2.15,
  trayH: 9.98,
  wall: 1.6,
  corner: 3.2,
  /** Slim printable rim. Pegs are local lattice islands, not a fat soffit. */
  frame: 2.8,
  frameNorth: 2.8,
  frameSouth: 2.8,
  lattice: 1.5,
  chamfer: 0.8,
  lipClear: 0.22,
  lipDepth: 1.5,
  lipThick: 0.85,
  socketSkin: 0.6,
  padR: 4.4,
  screwClearR: 1.5,
  screwPilotR: 1.15,
  insertR: 1.85,
  pegR: 1.08,
  socketR: 1.28,
  pegH: 11.53,
  boardClear: 0.4,
  floor: 1.5,
  standoff: 1.25,
  ringR: 4.5,
  tubeR: 1.85,
  ventL: 10,
  ventW: 2.0,
  ventR: 0.9,
  portFlare: 0.35,
  bossR: 1.8,
  screwBossR: 3.5,
  /** Friction nubs on the tray inner rim. Catch the lid lip. R0.45 → ~0.23 mm overlap at Standard. */
  snapNubR: 0.45,
  snapNubIn: 0,
  ledW: 2.8,
  ledH: 1.6,
  holeOx: PI_ZERO.holeOx,
  holeOy: PI_ZERO.holeOy,
  holeSx: PI_ZERO.holeSx,
  holeSy: PI_ZERO.holeSy,
} as const;

export const TRAY_RIM = 1.2;

export const SCALE_MIN = 1.5;
export const SCALE_MAX = 2;
export const SCALE_STEP = 0.05;
export const SCALE_DEFAULT = 2;
/** Relaxed Voronoi: 2 Lloyd steps. More than that collapses to honeycomb (the CVT minimizer). */
export const LLOYD_ITERS = 2;
export const LATTICE_MAX_EDGES = 2048;

export const STEP_PRESETS = [
  { id: "fine", label: "Fine", value: 0.01 },
  { id: "print", label: "Print", value: 0.02 },
  { id: "standard", label: "Std", value: 0.05 },
  { id: "coarse", label: "Coarse", value: 0.1 },
  { id: "jump", label: "Jump", value: 0.25 },
] as const;

export type StepSize = (typeof STEP_PRESETS)[number]["value"];
export type Fastener = "snap" | "screw";
export const FASTENERS: { id: Fastener; label: string }[] = [
  { id: "snap", label: "No screws" },
  { id: "screw", label: "M2.5 screws" },
];

export type PrintFit = "tight" | "standard" | "loose";
export const PRINT_FITS: {
  id: PrintFit;
  label: string;
  lipClear: number;
  screwClearR: number;
  socketR: number;
  blurb: string;
}[] = [
  {
    id: "tight",
    label: "Snug",
    lipClear: 0.12,
    screwClearR: 1.4,
    socketR: 1.2,
    blurb: "0.24 mm peg clearance. Only if Standard rattles on a calibrated printer.",
  },
  {
    id: "standard",
    label: "Standard",
    lipClear: 0.22,
    screwClearR: 1.5,
    socketR: 1.28,
    blurb: "Use this. Most 0.4 mm FDM printers. Holes shrink ~0.2 mm.",
  },
  {
    id: "loose",
    label: "Loose",
    lipClear: 0.34,
    screwClearR: 1.7,
    socketR: 1.4,
    blurb: "0.64 mm peg clearance. Unknown printer, or a hot nozzle.",
  },
];
export const PRINT_FIT_DEFAULT: PrintFit = "standard";

export type PlugFit = "normal" | "fat";
export type HdmiPlug = PlugFit;
export type UsbPlug = PlugFit;
export const HDMI_PLUG_DEFAULT: HdmiPlug = "fat";
export const USB_PLUG_DEFAULT: UsbPlug = "fat";
export const HDMI_PLUGS: { id: HdmiPlug; label: string; blurb: string }[] = [
  {
    id: "normal",
    label: "Slim plug",
    blurb: "12.4 × 4.0 mm. Type C metal is 10.42 × 2.42. Jack + 0.6 mm/side. Thin shells only.",
  },
  {
    id: "fat",
    label: "Thick plug",
    blurb: "16.2 × 6.9 mm, floor to rim. Chunky overmolds. Default — still unplug-tested.",
  },
];
export const USB_PLUGS: { id: UsbPlug; label: string; blurb: string }[] = [
  {
    id: "normal",
    label: "Slim plug",
    blurb: "9.2 × 3.2 mm. Micro-B metal is 6.85 × 1.80. Jack + 0.6 mm/side.",
  },
  {
    id: "fat",
    label: "Thick plug",
    blurb: "11.0 × 6.9 mm. USB-IF overmold max 10.6 × 8.5 — 8.5 mm height will not fit this wall. Width capped: USB centres are 12.6 mm apart.",
  },
];

export function isHdmiPlug(value: unknown): value is HdmiPlug {
  return value === "normal" || value === "fat";
}

export function isUsbPlug(value: unknown): value is UsbPlug {
  return value === "normal" || value === "fat";
}

export type Keyring = "on" | "off";
export const KEYRING_DEFAULT: Keyring = "on";
export const KEYRINGS: { id: Keyring; label: string; blurb: string }[] = [
  {
    id: "on",
    label: "On",
    blurb: "NE teardrop on the tray — the current model. Split ring through Ø7. Recommended.",
  },
  {
    id: "off",
    label: "Off",
    blurb: "Flush rectangle. No lug, no hole. Same ports, pegs, and lid.",
  },
];

export function isKeyring(value: unknown): value is Keyring {
  return value === "on" || value === "off";
}

export function printFitSpec(id: PrintFit = PRINT_FIT_DEFAULT) {
  return PRINT_FITS.find((item) => item.id === id) ?? PRINT_FITS[1];
}

/** Peg stays Ø2.16. Sleeve bore follows printer fit. Mouth is a short lead-in. */
export function sleeveSpec(id: PrintFit = PRINT_FIT_DEFAULT) {
  const spec = printFitSpec(id);
  const innerR = spec.socketR;
  return {
    innerR,
    mouthR: innerR + 0.18,
    mouthDepth: 0.45,
    outerWall: 1.15,
    pegR: LID.pegR,
    pegDia: Number((2 * LID.pegR).toFixed(2)),
    sleeveDia: Number((2 * innerR).toFixed(2)),
    diametral: Number((2 * (innerR - LID.pegR)).toFixed(2)),
  };
}

export function formatScale(scale: number) {
  return `${scale.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}×`;
}

export function southPortPad(kind: "hdmi" | "usb", plug: PlugFit) {
  if (kind === "hdmi") return plug === "fat" ? PI_ZERO.portClear + PI_ZERO.fatPlugHdmi : PI_ZERO.slimPad;
  return plug === "fat" ? PI_ZERO.portClear + PI_ZERO.fatPlugUsb : PI_ZERO.slimPad;
}

export function southPortWidth(kind: "hdmi" | "usb", plug: PlugFit) {
  const jack = kind === "hdmi" ? PI_ZERO.hdmiW : PI_ZERO.usbW;
  return jack + 2 * southPortPad(kind, plug);
}

export function southPortBand(plug: PlugFit, jackH: number, extra: number) {
  const pcbTop = LID.floor + LID.standoff + PI_ZERO.pcb;
  const z0Thick = LID.floor + 0.22;
  const z1Max = Math.min(LID.trayH - TRAY_RIM - 0.12, pcbTop + 5.2 + PI_ZERO.fatPlugZ);
  const z0 = plug === "fat" ? z0Thick : pcbTop - 0.25;
  const z1 = plug === "fat" ? z1Max : Math.min(z1Max, pcbTop + jackH + extra);
  return { z0, z1, h: z1 - z0 };
}

export function portMmLine(hdmi: HdmiPlug = HDMI_PLUG_DEFAULT, usb: UsbPlug = USB_PLUG_DEFAULT) {
  const hdmiW = southPortWidth("hdmi", hdmi);
  const usbW = southPortWidth("usb", usb);
  const hdmiH = southPortBand(hdmi, PI_ZERO.hdmiJackH, 0.5).h;
  const usbH = southPortBand(usb, PI_ZERO.usbJackH, 0.4).h;
  const fmt = (w: number, h: number) => `${w.toFixed(1)}×${h.toFixed(1)}`;
  return `HDMI ${fmt(hdmiW, hdmiH)} · USB ${fmt(usbW, usbH)}`;
}

export function printPairTag(opts: {
  scale: number;
  fastener: Fastener;
  hdmi: HdmiPlug;
  usb: UsbPlug;
  keyring: Keyring;
}) {
  const scale = opts.scale.toFixed(2).replace(".", "_");
  return `${scale}x_${opts.fastener === "screw" ? "screws" : "snap"}_hdmi-${opts.hdmi}_usb-${opts.usb}_${opts.keyring === "on" ? "lug" : "nolug"}`;
}

export function printPairZipName(opts: {
  scale: number;
  fastener: Fastener;
  hdmi: HdmiPlug;
  usb: UsbPlug;
  keyring: Keyring;
}) {
  return `pi_zero_case_${printPairTag(opts)}.zip`;
}

export function printSheet(opts: {
  scale: number;
  fastener: Fastener;
  fit: PrintFit;
  hdmi: HdmiPlug;
  usb: UsbPlug;
  keyring: Keyring;
}) {
  return [
    "Pi Zero Case Builder (Test) — first article",
    PRINT.firstArticle,
    PRINT.board,
    PRINT.gpio,
    PRINT.csi,
    `Slice ${PRINT.layer} · ${PRINT.walls} · ${PRINT.infill} · ${PRINT.supports}. ${PRINT.trayPose}. ${PRINT.lidPose}.`,
    `This zip: ${printPairZipName(opts)} · ${opts.fit} fit · unzip two STLs, do not print the zip.`,
    PRINT.s0,
    PRINT.license,
    PRINT.nowarranty,
    PRINT.limits,
    PRINT.trademark,
  ].join("\n");
}

export const PRINT = {
  nozzle: "0.4 mm",
  layer: "0.20 mm",
  walls: "3 walls",
  infill: "20% infill",
  supports: "no supports",
  material: "PETG or PLA",
  lidPose: "Lid lip-down",
  trayPose: "Tray floor-down",
  screw: "M2.5 × 8 pan-head or M2.5 heat-set",
  firstArticle: "Nobody has printed this cut. First pair is a fit article, not a gift.",
  board: "Raspberry Pi Zero only (RP-008365). Not Zero 2 / 2W.",
  gpio: "GPIO is a cover. No HATs. Unpopulated header only.",
  csi: "East wall is a CSI ribbon window, not a camera housing.",
  drawing:
    "https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf",
  license: "License: personal, non-commercial hobby use. Remix for yourself is OK. Do not sell files or prints.",
  nowarranty: "NO WARRANTY. Untested, may be AI-assisted. Verify 65×30 mm on your board. Inspect the print. Discard if it cracks.",
  limits: "NOT for children, food, medical, mains electricity, vehicles, climbing, or any safety-critical use. Printed parts can snap along layer lines.",
  trademark: "Raspberry Pi is a trademark of Raspberry Pi Ltd. Unofficial hobby design. You agree to the site Terms and Safety Disclaimer.",
  s0: "First article: dry-fit lid/tray, board on four pegs, fat HDMI + two USB, SD hot-swap, 10 snaps, 25 mm ring in the lug. Nobody has printed this cut yet.",
} as const;

