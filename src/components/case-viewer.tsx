"use client";

import { Component, memo, useEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { MeshProgress } from "./viewer-loader";
import { getMeshBuilding, getMeshStep, subscribeMeshBuilding, subscribeMeshStep } from "@/lib/mesh-progress";
import { previewStats, subscribePreviewStats } from "@/lib/preview-stats";
import type { CaseViewerProps } from "./case-viewer-types";

export type { CaseViewerProps, PartView, CameraFocus } from "./case-viewer-types";

class CanvasGuard extends Component<{ children: ReactNode; onFail?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.warn("3D canvas crashed", err, info.componentStack);
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export const CaseViewer = memo(function CaseViewer(props: CaseViewerProps) {
  const [CanvasCmp, setCanvasCmp] = useState<ComponentType<CaseViewerProps> | null>(null);
  const [glFailed, setGlFailed] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const [step, setStep] = useState(getMeshStep);
  const [building, setBuilding] = useState(getMeshBuilding);
  const [late, setLate] = useState(false);
  useEffect(() => {
    let alive = true;
    const boot = () => {
      if (!alive) return;
      void import("@/lib/preview-loader").then((m) => m.loadBakedPair()).catch(() => {});
      void import("./case-canvas")
        .then((mod) => {
          if (alive) setCanvasCmp(() => mod.CaseCanvas);
        })
        .catch((err) => {
          console.warn("3D canvas failed to load", err);
          setGlFailed(true);
        });
    };
    const idle = window.setTimeout(boot, 0);
    return () => {
      alive = false;
      window.clearTimeout(idle);
    };
  }, []);
  useEffect(() => subscribeMeshStep(setStep), []);
  useEffect(() => subscribeMeshBuilding(setBuilding), []);
  useEffect(() => {
    return subscribePreviewStats(() => {
      if (previewStats.contextLost > 0) setGlLost(true);
    });
  }, []);
  const ready = step.id === "ready";
  useEffect(() => {
    if (ready) {
      setLate(false);
      return;
    }
    const t = window.setTimeout(() => setLate(true), 700);
    return () => window.clearTimeout(t);
  }, [ready]);
  return (
    <div className="relative h-full min-h-[20rem] w-full bg-surface">
      {CanvasCmp && !glFailed ? (
        <CanvasGuard onFail={() => setGlFailed(true)}>
          <CaseCanvasSafe Canvas={CanvasCmp} {...props} />
        </CanvasGuard>
      ) : null}
      {glFailed || glLost ? (
        <p className="absolute inset-x-0 bottom-3 z-20 mx-auto max-w-md px-3">
          <span className="block rounded-sm bg-elevated px-3 py-2 text-center text-xs leading-relaxed text-muted">
            {glFailed
              ? "3D did not start (Brave Shields often blocks WebGL). Lion icon → Shields down for this site, and enable graphics acceleration. Print pair still works."
              : "Graphics glitched. Orbit again, or use Print pair — download still works."}
          </span>
        </p>
      ) : null}
      <MeshProgress pct={step.pct} label={step.label} visible={late && !ready && !glFailed} />
      {building && ready && !glFailed ? (
        <p className="mesh-chip" role="status">
          Updating
        </p>
      ) : null}
    </div>
  );
});

function CaseCanvasSafe({
  Canvas,
  ...props
}: CaseViewerProps & { Canvas: ComponentType<CaseViewerProps> }) {
  return <Canvas {...props} />;
}
