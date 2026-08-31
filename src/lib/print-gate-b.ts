/** CAD dry-fit for launch batch B. Plastic column stays open until a pair is printed. */

import {
  HDMI_PLUG_DEFAULT,
  KEYRING_DEFAULT,
  LID,
  PI_ZERO,
  PRINT_FIT_DEFAULT,
  SCALE_DEFAULT,
  USB_PLUG_DEFAULT,
  portMmLine,
  printPairZipName,
  sleeveSpec,
} from "./case-params.ts";
import { LUG, lugCenter } from "./keyring.ts";
import { boardOrigin, padCenters, portWindows, sideWindows } from "./voronoi-lid.ts";

export type GateStatus = "pass" | "fail" | "unknown";

export type GateRow = {
  id: string;
  name: string;
  cad: GateStatus;
  mm: string;
};

export const B_PRINT = {
  material: "PLA (or PETG)",
  nozzle: "0.4 mm",
  layer: "0.20 mm",
  walls: "3 walls",
  infill: "20%",
  supports: "none",
  trayPose: "tray floor-down",
  lidPose: "lid lip-down",
  scale: SCALE_DEFAULT,
  fastener: "snap" as const,
  fit: PRINT_FIT_DEFAULT,
  hdmi: HDMI_PLUG_DEFAULT,
  usb: USB_PLUG_DEFAULT,
  keyring: KEYRING_DEFAULT,
  zip: printPairZipName({
    scale: SCALE_DEFAULT,
    fastener: "snap",
    hdmi: HDMI_PLUG_DEFAULT,
    usb: USB_PLUG_DEFAULT,
    keyring: KEYRING_DEFAULT,
  }),
};

export function printGateB(): GateRow[] {
  const sleeve = sleeveSpec("standard");
  const [bx, by] = boardOrigin();
  const pads = padCenters();
  const ports = portWindows("fat", "fat");
  const hdmi = ports[0];
  const usb1 = ports[1];
  const usb2 = ports[2];
  const sd = sideWindows().find((p) => p.id === "sd")!;
  const csi = sideWindows().find((p) => p.id === "csi")!;
  const pcbTop = LID.floor + LID.standoff + PI_ZERO.pcb;
  const { hx, hy } = lugCenter();
  const holeId = LUG.holeR * 2;
  const usbWall = usb2.x0 - usb1.x1;
  const hdmiUsbWall = usb1.x0 - hdmi.x1;
  const pegRadial = PI_ZERO.holeDia / 2 - LID.pegR;
  const socketIntoLid = LID.pegH - LID.trayH;
  const sdOverhang = LID.wall - LID.boardClear;
  const csiAboveLug = csi.z0 - LUG.height;
  const sdWest = hx < 0;
  const lipAboveBoard = LID.trayH - LID.lipDepth > LID.floor + LID.standoff + PI_ZERO.pcb + 0.2;

  const b1 =
    pads.length === 4 &&
    pegRadial >= 0.25 &&
    socketIntoLid >= 1.2 &&
    lipAboveBoard &&
    Math.abs((hdmi.x0 + hdmi.x1) / 2 - (bx + PI_ZERO.hdmi)) < 0.05;

  const b2 =
    sd.y1 - sd.y0 >= 12 &&
    Math.abs((sd.y0 + sd.y1) / 2 - (by + PI_ZERO.sdFromSouth)) < 0.05 &&
    sd.z0 <= pcbTop &&
    sdOverhang >= 1.2;

  const b3 = hdmi.x1 - hdmi.x0 >= 16.1 && hdmi.z1 - hdmi.z0 >= 6.8;

  const b4 =
    usb1.x1 - usb1.x0 >= 10.7 &&
    usb2.x1 - usb2.x0 >= 10.7 &&
    usbWall >= 1.5 &&
    hdmiUsbWall >= 1.6;

  const b5 = LID.snapNubR >= 0.4 && LID.snapNubR <= 0.5 && sleeve.diametral >= 0.3 && LID.lipClear === 0.22;

  const b6 = holeId >= 6.9 && holeId <= 7.2 && !sdWest && hx > 0 && hy > 0 && LUG.height >= 2.2;

  const b7 = csi.y1 - csi.y0 >= 16 && csi.z0 === sd.z0 && csiAboveLug >= 0.5;

  return [
    {
      id: "b1",
      name: "Board on four pegs, no scrape on south I/O",
      cad: b1 ? "pass" : "fail",
      mm: `peg Ø${(LID.pegR * 2).toFixed(2)} through Ø${PI_ZERO.holeDia} (${pegRadial.toFixed(2)} mm radial). ${socketIntoLid.toFixed(2)} mm into lid. HDMI centre ${((hdmi.x0 + hdmi.x1) / 2 - bx).toFixed(1)} vs drawing 12.4. Lip above PCB: ${lipAboveBoard}.`,
    },
    {
      id: "b2",
      name: "SD inserts/ejects without opening the case",
      cad: b2 ? "pass" : "fail",
      mm: `west window ${(sd.y1 - sd.y0).toFixed(2)} × ${(sd.z1 - sd.z0).toFixed(2)} mm, centre ${(by + PI_ZERO.sdFromSouth - by).toFixed(1)} from south. Card can stand ~${sdOverhang.toFixed(1)} mm past the wall. Lid is top-only.`,
    },
    {
      id: "b3",
      name: "Fat mini-HDMI seats",
      cad: b3 ? "pass" : "fail",
      mm: `${portMmLine("fat", "fat")}. HDMI window ${(hdmi.x1 - hdmi.x0).toFixed(1)} × ${(hdmi.z1 - hdmi.z0).toFixed(1)}. Not plug-tested.`,
    },
    {
      id: "b4",
      name: "Both micro-USB seat",
      cad: b4 ? "pass" : "fail",
      mm: `each ${(usb1.x1 - usb1.x0).toFixed(1)} × ${(usb1.z1 - usb1.z0).toFixed(1)}. Wall HDMI–USB ${hdmiUsbWall.toFixed(2)}, USB–USB ${usbWall.toFixed(2)}. 8.5 mm USB-IF overmold height will not fit.`,
    },
    {
      id: "b5",
      name: "Lid snaps, lifts straight off, 10 cycles",
      cad: b5 ? "pass" : "fail",
      mm: `nubs Ø${(LID.snapNubR * 2).toFixed(2)}, socket Ø${sleeve.sleeveDia.toFixed(2)}, peg clear ${sleeve.diametral.toFixed(2)}, lipClear ${LID.lipClear}. 10 cycles = plastic only.`,
    },
    {
      id: "b6",
      name: "Keyring takes a 25 mm split ring, no crack at the neck",
      cad: b6 ? "pass" : "fail",
      mm: `NE paddle, hole Ø${holeId.toFixed(1)}, plate T ${LUG.height.toFixed(1)}, bulb Ø${(LUG.bulbR * 2).toFixed(1)}, not on SD. Neck crack = plastic only.`,
    },
    {
      id: "b7",
      name: "CSI ribbon can exit east",
      cad: b7 ? "pass" : "fail",
      mm: `east window ${(csi.y1 - csi.y0).toFixed(2)} × ${(csi.z1 - csi.z0).toFixed(2)}, sill z ${csi.z0.toFixed(2)}. Lug plate T ${LUG.height.toFixed(1)} so ribbon runs ${csiAboveLug.toFixed(2)} mm above the paddle. Not a camera housing.`,
    },
  ];
}

export function cadGateClosed() {
  return printGateB().every((row) => row.cad !== "fail");
}
