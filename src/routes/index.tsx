import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, Box, Download, Minus, Plus, RotateCw, Trash2 } from "lucide-react";
import { CaseViewer, type PartView } from "@/components/case-viewer";
import {
  downloadVoronoiLidStl,
  formatScale,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  STEP_PRESETS,
  type StepSize,
} from "@/lib/voronoi-lid";
import {
  deleteBuild,
  loadBuilds,
  loadSession,
  presetLabel,
  saveBuild,
  saveSession,
  type SavedBuild,
} from "@/lib/saved-builds";

export const Route = createFileRoute("/")({ component: Home });

const VIEWS: { id: PartView; label: string }[] = [
  { id: "lid", label: "Voronoi lid" },
  { id: "bottom", label: "Tray" },
  { id: "assembled", label: "Assembled" },
];

function clampScale(value: number) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(value.toFixed(2))));
}

function snapScale(value: number, step: number) {
  const stepped = Math.round(value / step) * step;
  return clampScale(stepped);
}

function nudgeScale(value: number, dir: -1 | 1, step: number) {
  return clampScale(value + dir * step);
}

function stepLabel(step: number) {
  return step.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

function Home() {
  const [view, setView] = useState<PartView>("lid");
  const [autoRotate, setAutoRotate] = useState(true);
  const [scale, setScale] = useState(SCALE_DEFAULT);
  const [step, setStep] = useState<StepSize>(SCALE_STEP);
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const scaleLabel = useMemo(() => formatScale(scale), [scale]);
  const atMin = scale <= SCALE_MIN + 1e-6;
  const atMax = scale >= SCALE_MAX - 1e-6;
  const alreadySaved = builds.some((b) => b.scale === scale && b.step === step);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setScale(session.scale);
      setStep(session.step);
    }
    setBuilds(loadBuilds());
  }, []);

  useEffect(() => {
    saveSession(scale, step);
  }, [scale, step]);

  function handleSave() {
    setBuilds(saveBuild(scale, step));
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1400);
  }

  return (
    <main className="relative min-h-dvh bg-bg text-fg">
      <div className="absolute inset-0">
        <CaseViewer view={view} autoRotate={autoRotate} scale={scale} />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
        <div className="pointer-events-auto max-w-md rounded-xl border border-border bg-surface/90 p-4 shadow-panel backdrop-blur-md sm:p-5">
          <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
            Raspberry Pi Zero
          </p>
          <h1 className="mt-1 font-display text-3xl leading-tight text-fg italic sm:text-4xl">
            Voronoi lid
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Drag to orbit. Scale the honeycomb, save a build, then download
            that lid.
          </p>

          <div className="mt-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label htmlFor="voronoi-scale" className="text-sm font-medium text-fg">
                Pattern scale
              </label>
              <span className="font-mono text-sm tabular-nums text-muted">{scaleLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Decrease pattern scale by ${step}`}
                disabled={atMin}
                onClick={() => setScale((v) => nudgeScale(v, -1, step))}
                className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border text-fg hover:bg-elevated disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-4" strokeWidth={1.75} />
              </button>
              <input
                id="voronoi-scale"
                type="range"
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={step}
                value={scale}
                onChange={(e) => setScale(snapScale(Number(e.target.value), step))}
                className="h-11 min-w-0 flex-1 accent-filament"
              />
              <button
                type="button"
                aria-label={`Increase pattern scale by ${step}`}
                disabled={atMax}
                onClick={() => setScale((v) => nudgeScale(v, 1, step))}
                className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border text-fg hover:bg-elevated disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-subtle">
              <span>Finer</span>
              <span>Coarser</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-fg" id="step-size-label">
                Step presets
              </p>
              <span className="font-mono text-sm tabular-nums text-muted">
                {stepLabel(step)}
              </span>
            </div>
            <div
              role="group"
              aria-labelledby="step-size-label"
              className="grid grid-cols-2 gap-1 sm:grid-cols-5"
            >
              {STEP_PRESETS.map((preset) => {
                const active = preset.value === step;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${preset.label} step ${stepLabel(preset.value)}`}
                    onClick={() => setStep(preset.value)}
                    className={
                      "flex min-h-11 flex-col items-center justify-center rounded-md px-2 py-1.5 transition-colors duration-150 " +
                      (active ? "bg-accent text-accent-fg" : "text-fg hover:bg-elevated")
                    }
                  >
                    <span className="text-xs font-medium leading-none">{preset.label}</span>
                    <span
                      className={
                        "mt-1 font-mono text-[11px] tabular-nums leading-none " +
                        (active ? "text-accent-fg/70" : "text-subtle")
                      }
                    >
                      {stepLabel(preset.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <aside className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:top-1/2 sm:right-6 sm:bottom-auto sm:-translate-y-1/2 sm:p-0">
        <div className="pointer-events-auto mx-auto flex max-w-lg flex-col gap-2 rounded-xl border border-border bg-surface/90 p-2 shadow-panel backdrop-blur-md sm:w-56">
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-1">
            {VIEWS.map((item) => {
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={
                    "min-h-11 rounded-md px-3 text-sm font-medium transition-colors duration-150 " +
                    (active ? "bg-accent text-accent-fg" : "text-fg hover:bg-elevated")
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden h-px bg-border sm:block" />

          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg sm:justify-start"
          >
            <RotateCw className="size-4" strokeWidth={1.75} />
            {autoRotate ? "Stop spin" : "Auto-rotate"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={alreadySaved && !justSaved}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-fg hover:bg-elevated disabled:opacity-60 sm:justify-start"
          >
            <Bookmark className="size-4" strokeWidth={1.75} />
            {justSaved ? "Saved" : alreadySaved ? "Build saved" : "Save build"}
          </button>

          {builds.length > 0 && (
            <ul className="max-h-36 space-y-1 overflow-y-auto px-1">
              {builds.map((build) => {
                const active = build.scale === scale && build.step === step;
                return (
                  <li key={build.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setScale(build.scale);
                        setStep(build.step);
                      }}
                      className={
                        "flex min-h-11 min-w-0 flex-1 items-center justify-between rounded-md px-2 text-left text-sm " +
                        (active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg")
                      }
                    >
                      <span className="font-mono tabular-nums">{formatScale(build.scale)}</span>
                      <span className="text-xs text-subtle">{presetLabel(build.step)}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete saved ${formatScale(build.scale)} build`}
                      onClick={() => setBuilds(deleteBuild(build.id))}
                      className="flex size-11 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-elevated hover:text-fg"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => downloadVoronoiLidStl(scale)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-filament px-3 text-sm font-medium text-fg hover:bg-filament-deep"
          >
            <Download className="size-4" strokeWidth={1.75} />
            Lid STL · {scaleLabel}
          </button>
          <a
            href="/models/pi_zero_case_bottom.stl"
            download
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-fg hover:bg-elevated"
          >
            <Box className="size-4" strokeWidth={1.75} />
            Tray STL
          </a>
        </div>
      </aside>
    </main>
  );
}
