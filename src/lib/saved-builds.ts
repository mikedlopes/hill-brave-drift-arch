import {
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  STEP_PRESETS,
  type Fastener,
  type PrintFit,
  type StepSize,
  type HdmiPlug,
  type UsbPlug,
  type Keyring,
  PRINT_FIT_DEFAULT,
  HDMI_PLUG_DEFAULT,
  USB_PLUG_DEFAULT,
  KEYRING_DEFAULT,
  isHdmiPlug,
  isUsbPlug,
  isKeyring,
} from "@/lib/case-params";
import { NORTH_LABEL_DEFAULT } from "@/lib/north-type";

export type SavedBuild = {
  id: string;
  name: string;
  scale: number;
  step: StepSize;
  fastener: Fastener;
  fit: PrintFit;
  hdmi: HdmiPlug;
  usb: UsbPlug;
  keyring: Keyring;
  label: string;
  createdAt: number;
};

const BUILDS_KEY = "pizero.voronoi.builds.v4";
const SESSION_KEY = "pizero.voronoi.session.v6";
const MAX_BUILDS = 8;

function shippingSnapshot(id: string, name: string, createdAt: number): SavedBuild {
  return {
    id,
    name,
    scale: SCALE_DEFAULT,
    step: SCALE_STEP,
    fastener: "snap",
    fit: PRINT_FIT_DEFAULT,
    hdmi: HDMI_PLUG_DEFAULT,
    usb: USB_PLUG_DEFAULT,
    keyring: KEYRING_DEFAULT,
    label: NORTH_LABEL_DEFAULT,
    createdAt,
  };
}

/** Original lock. Same millimetre defaults; hole rims were still sharp. */
export const BUILD_VERSION_1: SavedBuild = shippingSnapshot("build-version-1", "Build Version 1", 1);

/** Current lock. Truncated-CVT Voronoi, hole rims R0.80 echoing the outer 0.80×45° chamfer. */
export const BUILD_VERSION_2: SavedBuild = shippingSnapshot("build-version-2", "Build Version 2", 2);

export const SHIPPING_BUILD = BUILD_VERSION_2;

const LOCKED = [BUILD_VERSION_2, BUILD_VERSION_1];

function isStepSize(value: number): value is StepSize {
  return STEP_PRESETS.some((p) => p.value === value);
}

function isFastener(value: unknown): value is Fastener {
  return value === "snap" || value === "screw";
}

function isPrintFit(value: unknown): value is PrintFit {
  return value === "tight" || value === "standard" || value === "loose";
}

function clampScale(value: number) {
  if (!Number.isFinite(value)) return SCALE_DEFAULT;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(value.toFixed(2))));
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadSession(): {
  scale: number;
  step: StepSize;
  fastener: Fastener;
  fit: PrintFit;
  hdmi: HdmiPlug;
  usb: UsbPlug;
  keyring: Keyring;
} | null {
  const data = readJson(SESSION_KEY);
  if (!data || typeof data !== "object") return null;
  const rec = data as {
    scale?: unknown;
    step?: unknown;
    fastener?: unknown;
    fit?: unknown;
    hdmi?: unknown;
    usb?: unknown;
    keyring?: unknown;
  };
  const scale = typeof rec.scale === "number" ? clampScale(rec.scale) : null;
  const step = typeof rec.step === "number" && isStepSize(rec.step) ? rec.step : null;
  const fastener = isFastener(rec.fastener) ? rec.fastener : "snap";
  const fit = isPrintFit(rec.fit) ? rec.fit : PRINT_FIT_DEFAULT;
  const hdmi = isHdmiPlug(rec.hdmi) ? rec.hdmi : HDMI_PLUG_DEFAULT;
  const usb = isUsbPlug(rec.usb) ? rec.usb : USB_PLUG_DEFAULT;
  const keyring = isKeyring(rec.keyring) ? rec.keyring : KEYRING_DEFAULT;
  if (scale == null || step == null) return null;
  return { scale, step, fastener, fit, hdmi, usb, keyring };
}

export function saveSession(
  scale: number,
  step: StepSize,
  fastener: Fastener,
  fit: PrintFit,
  hdmi: HdmiPlug = HDMI_PLUG_DEFAULT,
  keyring: Keyring = KEYRING_DEFAULT,
  usb: UsbPlug = USB_PLUG_DEFAULT,
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ scale, step, fastener, fit, hdmi, usb, keyring }));
  } catch {
    /* quota or private mode — keep working in memory */
  }
}

function parseBuild(item: unknown): SavedBuild | null {
  if (!item || typeof item !== "object") return null;
  const rec = item as Partial<SavedBuild>;
  if (typeof rec.scale !== "number" || typeof rec.createdAt !== "number") return null;
  if (typeof rec.step !== "number" || !isStepSize(rec.step)) return null;
  const name =
    typeof rec.name === "string" && rec.name.trim()
      ? rec.name.trim()
      : rec.id === BUILD_VERSION_2.id
        ? BUILD_VERSION_2.name
        : rec.id === BUILD_VERSION_1.id
          ? BUILD_VERSION_1.name
          : "Saved";
  return {
    id: typeof rec.id === "string" ? rec.id : `build-${rec.createdAt}`,
    name,
    scale: clampScale(rec.scale),
    step: rec.step,
    fastener: isFastener(rec.fastener) ? rec.fastener : "snap",
    fit: isPrintFit(rec.fit) ? rec.fit : PRINT_FIT_DEFAULT,
    hdmi: isHdmiPlug(rec.hdmi) ? rec.hdmi : HDMI_PLUG_DEFAULT,
    usb: isUsbPlug(rec.usb) ? rec.usb : USB_PLUG_DEFAULT,
    keyring: isKeyring(rec.keyring) ? rec.keyring : KEYRING_DEFAULT,
    label: typeof rec.label === "string" && rec.label.trim() ? rec.label.trim() : NORTH_LABEL_DEFAULT,
    createdAt: rec.createdAt,
  };
}

function isLocked(b: SavedBuild, lock: SavedBuild) {
  return b.id === lock.id || b.name === lock.name;
}

function withLocked(builds: SavedBuild[]): SavedBuild[] {
  const rest = builds.filter((b) => !LOCKED.some((lock) => isLocked(b, lock)));
  return [...LOCKED, ...rest].slice(0, MAX_BUILDS);
}

export function loadBuilds(): SavedBuild[] {
  const data = readJson(BUILDS_KEY);
  const parsed = Array.isArray(data) ? data.map(parseBuild).filter((b): b is SavedBuild => b != null) : [];
  const next = withLocked(parsed);
  const changed =
    next.length !== parsed.length ||
    next.some((b, i) => b.id !== parsed[i]?.id || b.name !== parsed[i]?.name);
  if (changed) writeBuilds(next);
  return next;
}

function writeBuilds(builds: SavedBuild[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BUILDS_KEY, JSON.stringify(builds.slice(0, MAX_BUILDS)));
  } catch {
    /* quota or private mode */
  }
}

function nextVersionName(existing: SavedBuild[]) {
  let max = 0;
  for (const b of existing) {
    const m = /^Build Version (\d+)$/i.exec(b.name);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `Build Version ${max + 1}`;
}

function lockedIdForName(name: string): string | null {
  const hit = LOCKED.find((b) => b.name === name);
  return hit ? hit.id : null;
}

export function saveBuild(
  scale: number,
  step: StepSize,
  fastener: Fastener,
  fit: PrintFit,
  options?: { name?: string; label?: string; hdmi?: HdmiPlug; usb?: UsbPlug; keyring?: Keyring },
): SavedBuild[] {
  const existing = loadBuilds();
  const name = options?.name?.trim() || nextVersionName(existing);
  const next: SavedBuild = {
    id: lockedIdForName(name) ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    scale: clampScale(scale),
    step: isStepSize(step) ? step : SCALE_STEP,
    fastener: isFastener(fastener) ? fastener : "snap",
    fit: isPrintFit(fit) ? fit : PRINT_FIT_DEFAULT,
    hdmi: isHdmiPlug(options?.hdmi) ? options.hdmi : HDMI_PLUG_DEFAULT,
    usb: isUsbPlug(options?.usb) ? options.usb : USB_PLUG_DEFAULT,
    keyring: isKeyring(options?.keyring) ? options.keyring : KEYRING_DEFAULT,
    label: options?.label?.trim() || NORTH_LABEL_DEFAULT,
    createdAt: Date.now(),
  };
  const rest = existing.filter((b) => b.name !== next.name && b.id !== next.id);
  const builds = [next, ...withLocked(rest).filter((b) => b.id !== next.id && b.name !== next.name)].slice(0, MAX_BUILDS);
  writeBuilds(builds);
  saveSession(next.scale, next.step, next.fastener, next.fit, next.hdmi, next.keyring, next.usb);
  return builds;
}

export function deleteBuild(id: string): SavedBuild[] {
  const remaining = loadBuilds().filter((b) => b.id !== id);
  const builds = withLocked(remaining);
  writeBuilds(builds);
  return builds;
}

export function presetLabel(step: number) {
  return STEP_PRESETS.find((p) => p.value === step)?.label ?? step.toFixed(2);
}

export function isShippingDefaults(opts: {
  scale: number;
  step: StepSize;
  fastener: Fastener;
  fit: PrintFit;
  hdmi: HdmiPlug;
  usb: UsbPlug;
  keyring: Keyring;
  label: string;
}) {
  return (
    opts.scale === SCALE_DEFAULT &&
    opts.step === SCALE_STEP &&
    opts.fastener === "snap" &&
    opts.fit === PRINT_FIT_DEFAULT &&
    opts.hdmi === HDMI_PLUG_DEFAULT &&
    opts.usb === USB_PLUG_DEFAULT &&
    opts.keyring === KEYRING_DEFAULT &&
    opts.label === NORTH_LABEL_DEFAULT
  );
}
