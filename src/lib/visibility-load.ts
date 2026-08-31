/**
 * IntersectionObserver gates for the 3D pane.
 *
 * Spec: threshold is the visible fraction of the target (0 = 1px, 1 = fully on screen).
 * A single high threshold (e.g. 1) never fires if the pane is taller than the
 * viewport — that's why we use a ladder, not "wait until fully visible".
 *
 * 0      first pixel (or 0-area layout with isIntersecting)
 * 0.08   enough of the pane to pay for WebGL
 * 0.2–1  progress ticks only
 */
export const IO_THRESHOLDS = [0, 0.08, 0.2, 0.4, 0.75, 1] as const;
export const IO_ROOT_MARGIN = "80px 0px";
export const PREFETCH_AT = 0;
export const MOUNT_AT = 0.08;

export function shouldPrefetch(ratio: number, intersecting: boolean) {
  return intersecting && ratio >= PREFETCH_AT;
}

export function shouldMount(ratio: number, intersecting: boolean) {
  if (!intersecting) return false;
  return ratio >= MOUNT_AT || ratio === 0;
}

export function visibilityPct(ratio: number) {
  const r = Math.min(1, Math.max(0, ratio));
  return Math.round(8 + r * 32);
}
