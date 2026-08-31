"use client";

import { useLayoutEffect, useRef } from "react";
import { paintCase2D } from "@/lib/preview-2d";
import type { CaseViewerProps } from "./case-viewer-types";

export function CasePreview2D({ view, showBoard }: CaseViewerProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(32, host.clientWidth || 640);
      const h = Math.max(32, host.clientHeight || 400);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintCase2D(ctx, w, h, view, showBoard);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(host);
    return () => ro.disconnect();
  }, [view, showBoard]);
  return (
    <canvas
      ref={ref}
      width={640}
      height={400}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
    />
  );
}
