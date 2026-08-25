import { SCALE_DEFAULT, SCALE_MAX, SCALE_MIN, SCALE_STEP, STEP_PRESETS, type StepSize } from "@/lib/voronoi-lid";

export type SavedBuild = {
  id: string;
  scale: number;
  step: StepSize;
  createdAt: number;
};

const BUILDS_KEY = "pizero.voronoi.builds.v1";
const SESSION_KEY = "pizero.voronoi.session.v1";
const MAX_BUILDS = 8;

function isStepSize(value: number): value is StepSize {
  return STEP_PRESETS.some((p) => p.value === value);
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

export function loadSession(): { scale: number; step: StepSize } | null {
  const data = readJson(SESSION_KEY);
  if (!data || typeof data !== "object") return null;
  const rec = data as { scale?: unknown; step?: unknown };
  const scale = typeof rec.scale === "number" ? clampScale(rec.scale) : null;
  const step = typeof rec.step === "number" && isStepSize(rec.step) ? rec.step : null;
  if (scale == null || step == null) return null;
  return { scale, step };
}

export function saveSession(scale: number, step: StepSize) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ scale, step }));
}

export function loadBuilds(): SavedBuild[] {
  const data = readJson(BUILDS_KEY);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Partial<SavedBuild>;
      if (typeof rec.id !== "string" || typeof rec.scale !== "number" || typeof rec.createdAt !== "number") {
        return null;
      }
      if (typeof rec.step !== "number" || !isStepSize(rec.step)) return null;
      return {
        id: rec.id,
        scale: clampScale(rec.scale),
        step: rec.step,
        createdAt: rec.createdAt,
      };
    })
    .filter((item): item is SavedBuild => item != null)
    .slice(0, MAX_BUILDS);
}

function writeBuilds(builds: SavedBuild[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BUILDS_KEY, JSON.stringify(builds.slice(0, MAX_BUILDS)));
}

export function saveBuild(scale: number, step: StepSize): SavedBuild[] {
  const next: SavedBuild = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    scale: clampScale(scale),
    step: isStepSize(step) ? step : SCALE_STEP,
    createdAt: Date.now(),
  };
  const existing = loadBuilds().filter((b) => !(b.scale === next.scale && b.step === next.step));
  const builds = [next, ...existing].slice(0, MAX_BUILDS);
  writeBuilds(builds);
  saveSession(next.scale, next.step);
  return builds;
}

export function deleteBuild(id: string): SavedBuild[] {
  const builds = loadBuilds().filter((b) => b.id !== id);
  writeBuilds(builds);
  return builds;
}

export function presetLabel(step: number) {
  return STEP_PRESETS.find((p) => p.value === step)?.label ?? step.toFixed(2);
}
