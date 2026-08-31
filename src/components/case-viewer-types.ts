export type PartView = "lid" | "bottom" | "assembled";
export type CameraFocus = "default" | "hdmi" | "usb" | "keyring" | "looks";

export type CaseViewerProps = {
  view: PartView;
  scale: number;
  screw: boolean;
  fit?: import("@/lib/voronoi-lid").PrintFit;
  hdmi?: import("@/lib/voronoi-lid").HdmiPlug;
  usb?: import("@/lib/voronoi-lid").UsbPlug;
  keyring?: import("@/lib/voronoi-lid").Keyring;
  label?: string;
  showBoard: boolean;
  focus?: CameraFocus;
  onReady?: () => void;
};