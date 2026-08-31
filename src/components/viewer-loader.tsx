/** Centered studio chip — kit label + bar, not a top-left sliver. */

export function MeshProgress({
  pct,
  label,
  visible,
}: {
  pct: number;
  label: string;
  visible: boolean;
}) {
  if (!visible) return null;
  const shown = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      className="mesh-progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
      aria-label={label}
      aria-live="polite"
    >
      <div className="mesh-progress-card">
        <span className="mesh-progress-arc" aria-hidden="true" />
        <div className="mesh-progress-track">
          <div className="mesh-progress-fill" style={{ width: `${shown}%` }} />
        </div>
        <p className="mesh-progress-label">
          <span className="mesh-progress-kicker">Loading</span>
          <span className="mesh-progress-pct">{shown}%</span>
        </p>
        <p className="mesh-progress-step">{label}</p>
      </div>
    </div>
  );
}
