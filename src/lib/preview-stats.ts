export const previewStats = {
  lastMs: 0,
  contextLost: 0,
};

const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function recordBuildMs(ms: number) {
  previewStats.lastMs = Math.max(0, Math.round(ms));
  emit();
}

export function recordContextLost() {
  previewStats.contextLost += 1;
  emit();
}

export function subscribePreviewStats(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function previewStatsLabel() {
  const ms = previewStats.lastMs ? ` Last mesh ${previewStats.lastMs} milliseconds.` : "";
  const lost = previewStats.contextLost ? ` Graphics context recovered ${previewStats.contextLost} times.` : "";
  return `Pi Zero case preview.${ms}${lost}`;
}
