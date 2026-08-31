import { useEffect, useState } from "react";
import { dismissCoach, loadCoach } from "@/lib/first-print-coach";
import type { PartView } from "./case-viewer-types";

export function FirstPrintCoach({ view }: { view: PartView }) {
  const [orbit, setOrbit] = useState(true);
  const [ports, setPorts] = useState(true);

  useEffect(() => {
    const saved = loadCoach();
    setOrbit(!saved.orbitDismissed);
    setPorts(!saved.portsDismissed);
  }, []);

  useEffect(() => {
    if (!orbit) return;
    const onUse = () => {
      dismissCoach("orbitDismissed");
      setOrbit(false);
    };
    window.addEventListener("pointerdown", onUse, { once: true, capture: true });
    return () => window.removeEventListener("pointerdown", onUse, true);
  }, [orbit]);

  if (!orbit && !(ports && view === "bottom")) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center gap-2 px-3">
      {orbit ? (
        <p className="rounded-sm bg-elevated/95 px-3 py-2 text-center text-[12px] leading-snug text-fg shadow-panel">
          Drag to orbit · scroll to zoom
        </p>
      ) : null}
      {ports && view === "bottom" ? (
        <div className="pointer-events-auto max-w-sm rounded-sm bg-elevated/95 px-3 py-2 text-[12px] leading-snug text-muted shadow-panel">
          <p className="text-fg">Tray ports</p>
          <ul className="mt-1 space-y-0.5">
            <li>Long edge — mini HDMI, then two USB</li>
            <li>West short — microSD</li>
            <li>East short — CSI ribbon, not a camera</li>
          </ul>
          <button
            type="button"
            className="mt-1.5 text-[11px] font-medium text-filament hover:text-fg"
            onClick={() => {
              dismissCoach("portsDismissed");
              setPorts(false);
            }}
          >
            Got it
          </button>
        </div>
      ) : null}
    </div>
  );
}
