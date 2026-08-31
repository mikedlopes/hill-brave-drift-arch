export type MeshStep = {
  id: string;
  label: string;
  pct: number;
};

export const MESH_STEPS = {
  lid: { id: "lid", label: "Lid lattice", pct: 35 },
  tray: { id: "tray", label: "Tray", pct: 70 },
  texture: { id: "texture", label: "Surface", pct: 92 },
  ready: { id: "ready", label: "Ready", pct: 100 },
} as const;

type Step = (typeof MESH_STEPS)[keyof typeof MESH_STEPS];

let current: Step = MESH_STEPS.ready;
let building = false;
const listeners = new Set<(step: Step) => void>();
const buildListeners = new Set<(on: boolean) => void>();

export function setMeshStep(id: keyof typeof MESH_STEPS) {
  current = MESH_STEPS[id];
  for (const fn of listeners) fn(current);
}

export function getMeshStep() {
  return current;
}

export function subscribeMeshStep(fn: (step: Step) => void) {
  listeners.add(fn);
  fn(current);
  return () => {
    listeners.delete(fn);
  };
}

export function setMeshBuilding(on: boolean) {
  if (building === on) return;
  building = on;
  for (const fn of buildListeners) fn(building);
}

export function getMeshBuilding() {
  return building;
}

export function subscribeMeshBuilding(fn: (on: boolean) => void) {
  buildListeners.add(fn);
  fn(building);
  return () => {
    buildListeners.delete(fn);
  };
}

export function yieldFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
