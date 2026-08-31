import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Download, Minus, Plus, Trash2 } from "lucide-react";
import { CaseViewer, type PartView } from "@/components/case-viewer";
import type { CameraFocus } from "@/components/case-viewer-types";
import { FirstPrintCoach } from "@/components/first-print-coach";
import { LegalFooter } from "@/components/legal-footer";
import { modelReadme } from "@/lib/legal";
import {
  FASTENERS,
  HDMI_PLUGS,
  HDMI_PLUG_DEFAULT,
  USB_PLUGS,
  USB_PLUG_DEFAULT,
  KEYRINGS,
  KEYRING_DEFAULT,
  PRINT_FITS,
  PRINT_FIT_DEFAULT,
  formatScale,
  PRINT,
  SCALE_DEFAULT,
  SCALE_MAX,
  SCALE_MIN,
  SCALE_STEP,
  STEP_PRESETS,
  portMmLine,
  printFitSpec,
  printPairZipName,
  printSheet,
  sleeveSpec,
  type Fastener,
  type HdmiPlug,
  type UsbPlug,
  type Keyring,
  type PrintFit,
  type StepSize,
} from "@/lib/case-params";
import { MAX_LEN, NORTH_LABEL_DEFAULT, sanitizeNorthLabel } from "@/lib/north-type";
import {
  deleteBuild,
  loadBuilds,
  loadSession,
  saveBuild,
  saveSession,
  isShippingDefaults,
  type SavedBuild,
} from "@/lib/saved-builds";

export const Route = createFileRoute("/")({ component: Home });

const VIEWS: { id: PartView; label: string }[] = [
  { id: "lid", label: "Lid" },
  { id: "bottom", label: "Tray" },
  { id: "assembled", label: "Assembled" },
];

function clampScale(value: number) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number(value.toFixed(2))));
}

function snapScale(value: number, step: number) {
  return clampScale(Math.round(value / step) * step);
}

function nudgeScale(value: number, dir: -1 | 1, step: number) {
  return clampScale(value + dir * step);
}

function stepLabel(step: number) {
  return step.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
}

function savedSummary(build: SavedBuild) {
  const fit = PRINT_FITS.find((item) => item.id === build.fit)?.label ?? "Standard";
  const plug = (build.hdmi ?? HDMI_PLUG_DEFAULT) === "fat" ? "HDMI thick" : "HDMI slim";
  const usb = (build.usb ?? USB_PLUG_DEFAULT) === "fat" ? "USB thick" : "USB slim";
  const lug = (build.keyring ?? KEYRING_DEFAULT) === "on" ? "Lug" : "No lug";
  const close = build.fastener === "screw" ? "M2.5" : "No screws";
  return `${formatScale(build.scale)} · ${close} · ${fit} · ${plug} · ${usb} · ${lug}`;
}

function SegBtn({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={
        "min-h-7 w-full rounded-sm px-1.5 text-[11px] font-medium transition-colors duration-150 " +
        (active ? "bg-accent text-accent-fg" : "text-fg hover:bg-elevated")
      }
    >
      {children}
    </button>
  );
}

function Home() {
  const [view, setView] = useState<PartView>("assembled");
  const [focus, setFocus] = useState<CameraFocus>("default");
  const [scale, setScale] = useState(SCALE_DEFAULT);
  const [step, setStep] = useState<StepSize>(SCALE_STEP);
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [fastener, setFastener] = useState<Fastener>("snap");
  const [labelDraft, setLabelDraft] = useState(NORTH_LABEL_DEFAULT);
  const [label, setLabel] = useState(NORTH_LABEL_DEFAULT);
  const [fit, setFit] = useState<PrintFit>(PRINT_FIT_DEFAULT);
  const [hdmi, setHdmi] = useState<HdmiPlug>(HDMI_PLUG_DEFAULT);
  const [usb, setUsb] = useState<UsbPlug>(USB_PLUG_DEFAULT);
  const [keyring, setKeyring] = useState<Keyring>(KEYRING_DEFAULT);
  const [showBoard, setShowBoard] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [saveLink, setSaveLink] = useState<{ href: string; name: string } | null>(null);
  const saveRef = useRef<HTMLAnchorElement>(null);
  const scaleLabel = useMemo(() => formatScale(scale), [scale]);
  const atMin = scale <= SCALE_MIN + 1e-6;
  const atMax = scale >= SCALE_MAX - 1e-6;
  const fitSpec = useMemo(() => printFitSpec(fit), [fit]);
  const sleeve = useMemo(() => sleeveSpec(fit), [fit]);
  const alreadySaved = builds.some(
    (b) =>
      b.scale === scale &&
      b.step === step &&
      b.fastener === fastener &&
      b.fit === fit &&
      b.hdmi === hdmi &&
      b.usb === usb &&
      b.keyring === keyring &&
      b.label === label,
  );
  const recommended =
    fastener === "snap" &&
    fit === PRINT_FIT_DEFAULT &&
    hdmi === HDMI_PLUG_DEFAULT &&
    usb === USB_PLUG_DEFAULT &&
    keyring === KEYRING_DEFAULT &&
    Math.abs(scale - SCALE_DEFAULT) < 0.001;
  const chars = sanitizeNorthLabel(labelDraft).length;

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setScale(session.scale);
      setStep(session.step);
      setFastener(session.fastener);
      setFit(session.fit);
      setHdmi(session.hdmi);
      setUsb(session.usb);
      setKeyring(session.keyring);
    }
    setBuilds(loadBuilds());
    void import("@/lib/voronoi-lid");
    void import("@/lib/tray-body");
    void import("@/lib/stl-download");
  }, []);

  useEffect(() => {
    saveSession(scale, step, fastener, fit, hdmi, keyring, usb);
  }, [scale, step, fastener, fit, hdmi, keyring, usb]);

  useEffect(() => {
    setSaveLink(null);
  }, [scale, fastener, fit, label, hdmi, usb, keyring]);

  useEffect(() => {
    return () => {
      void import("@/lib/stl-download").then((m) => m.disposeDownload());
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setLabel(sanitizeNorthLabel(labelDraft)), 420);
    return () => window.clearTimeout(t);
  }, [labelDraft]);

  function handleSave() {
    try {
      setBuilds(
        saveBuild(scale, step, fastener, fit, {
          name: isShippingDefaults({ scale, step, fastener, fit, hdmi, usb, keyring, label })
            ? "Build Version 2"
            : undefined,
          label,
          hdmi,
          usb,
          keyring,
        }),
      );
      setJustSaved(true);
      setNotice(null);
      window.setTimeout(() => setJustSaved(false), 1400);
    } catch {
      setNotice("Couldn't save. Storage may be full.");
    }
  }

  async function handleLidDownload() {
    try {
      const { downloadVoronoiLidStl } = await import("@/lib/voronoi-lid");
      const ok = downloadVoronoiLidStl(scale, fastener === "screw", fit);
      setNotice(ok ? null : "Couldn't build the lid. Try again.");
      return ok;
    } catch (err) {
      console.warn(err);
      setNotice("Couldn't build the lid. Try again.");
      return false;
    }
  }

  async function handleTrayDownload() {
    try {
      const { downloadVoronoiTrayStl } = await import("@/lib/tray-body");
      const ok = downloadVoronoiTrayStl(scale, fastener === "screw", label, hdmi, keyring, usb);
      setNotice(ok ? null : "Couldn't build the tray. Try again.");
      return ok;
    } catch (err) {
      console.warn(err);
      setNotice("Couldn't build the tray. Try again.");
      return false;
    }
  }

  async function handlePrintPair() {
    if (printing) return;
    setPrinting(true);
    setNotice("Building lid and tray STLs…");
    try {
      const [{ lidStlBuffer, lidStlFilename }, { trayStlBuffer, trayStlFilename }, { zipStore, createDownloadObject, textBytes }] =
        await Promise.all([import("@/lib/voronoi-lid"), import("@/lib/tray-body"), import("@/lib/stl-download")]);
      const screw = fastener === "screw";
      const lid = lidStlBuffer(scale, screw, fit);
      const tray = trayStlBuffer(scale, screw, label, hdmi, keyring, usb);
      const zipName = printPairZipName({ scale, fastener, hdmi, usb, keyring });
      const zip = zipStore([
        { name: lidStlFilename(scale, screw, fit), data: lid },
        { name: trayStlFilename(scale, screw, label, hdmi, keyring, usb), data: tray },
        {
          name: "PRINT.txt",
          data: textBytes(printSheet({ scale, fastener, fit, hdmi, usb, keyring })),
        },
        {
          name: "README.txt",
          data: textBytes(modelReadme({ model: zipName.replace(/\.zip$/i, "") })),
        },
      ]);
      const file = createDownloadObject(zipName, zip, "application/octet-stream");
      setSaveLink({ href: file.url, name: file.filename });
      setNotice(null);
    } catch (err) {
      console.warn("print pair failed", err);
      setNotice("Couldn't build the print pair. Try Lid and Tray separately.");
    } finally {
      setPrinting(false);
    }
  }

  const fitLine =
    fastener === "snap"
      ? `Snap · peg Ø${sleeve.pegDia.toFixed(2)} · socket Ø${sleeve.sleeveDia.toFixed(2)} · ${sleeve.diametral.toFixed(2)} mm clear`
      : `Screw · lid Ø${(fitSpec.screwClearR * 2).toFixed(1)} · tray Ø2.30 · ${PRINT.screw}`;

  return (
    <main className="studio">
      <a href="#case-controls" className="skip-link">
        Skip to controls
      </a>
      <aside id="case-controls" tabIndex={-1} className="studio-panel">
        <header className="studio-brand">
          <p className="sr-only" aria-live="polite">
            {justSaved ? `Saved ${scaleLabel} ${fastener} build.` : ""}
          </p>
          <p className="label">Pi Zero</p>
          <h1 className="display mt-0.5 text-base text-fg">Case Builder</h1>
          <p className="mono mt-0.5 text-[11px] leading-tight">Test cut · GPIO cover · CSI ribbon</p>
        </header>

        <div className="studio-fields">
          <div className="seg seg-3" role="group" aria-label="Part view">
            {VIEWS.map((item) => (
              <SegBtn key={item.id} active={view === item.id} onClick={() => setView(item.id)}>
                {item.label}
              </SegBtn>
            ))}
          </div>
          {view !== "lid" ? (
            <button
              type="button"
              aria-pressed={showBoard}
              onClick={() => setShowBoard((v) => !v)}
              className="field-head min-h-7 rounded-sm px-1 text-[11px] font-medium text-muted hover:bg-elevated hover:text-fg"
            >
              <span>Reference board</span>
              <span className="font-mono text-fg">{showBoard ? "On" : "Off"}</span>
            </button>
          ) : null}

          <div className="pair">
            <div className="field">
              <p className="text-[11px] font-medium text-muted" id="fastener-label">
                Closure
              </p>
              <div role="group" aria-labelledby="fastener-label" className="seg seg-2">
                {FASTENERS.map((item) => (
                  <SegBtn key={item.id} active={fastener === item.id} onClick={() => setFastener(item.id)}>
                    {item.id === "snap" ? "Snap" : "M2.5"}
                  </SegBtn>
                ))}
              </div>
            </div>
            <div className="field">
              <p className="text-[11px] font-medium text-muted" id="keyring-label">
                Keyring
              </p>
              <div role="group" aria-labelledby="keyring-label" className="seg seg-2">
                {KEYRINGS.map((item) => (
                  <SegBtn
                    key={item.id}
                    active={keyring === item.id}
                    label={item.blurb}
                    onClick={() => {
                      setKeyring(item.id);
                      setFocus("keyring");
                      if (view === "lid") setView("assembled");
                    }}
                  >
                    {item.label}
                  </SegBtn>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <p className="text-[11px] font-medium text-muted" id="print-fit-label">
                Fit
              </p>
              <p className="truncate font-mono text-[10px] text-subtle">{fitLine}</p>
            </div>
            <div role="group" aria-labelledby="print-fit-label" className="seg seg-3">
              {PRINT_FITS.map((item) => (
                <SegBtn
                  key={item.id}
                  active={fit === item.id}
                  onClick={() => setFit(item.id)}
                  label={item.id === "standard" ? "Standard, use this" : item.label}
                >
                  {item.label}
                </SegBtn>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <p className="text-[11px] font-medium text-muted">Ports</p>
              <p className="truncate font-mono text-[10px] text-subtle">{portMmLine(hdmi, usb)}</p>
            </div>
            <div className="ports">
              <p className="text-[11px] text-subtle" id="hdmi-plug-label">
                HDMI
              </p>
              <div role="group" aria-labelledby="hdmi-plug-label" className="seg seg-2">
                {HDMI_PLUGS.map((item) => (
                  <SegBtn
                    key={item.id}
                    active={hdmi === item.id}
                    label={item.blurb}
                    onClick={() => {
                      setHdmi(item.id);
                      setFocus("hdmi");
                      if (view === "lid") setView("bottom");
                    }}
                  >
                    {item.id === "fat" ? "Thick" : "Slim"}
                  </SegBtn>
                ))}
              </div>
              <p className="text-[11px] text-subtle" id="usb-plug-label">
                USB
              </p>
              <div role="group" aria-labelledby="usb-plug-label" className="seg seg-2">
                {USB_PLUGS.map((item) => (
                  <SegBtn
                    key={item.id}
                    active={usb === item.id}
                    label={item.blurb}
                    onClick={() => {
                      setUsb(item.id);
                      setFocus("usb");
                      if (view === "lid") setView("bottom");
                    }}
                  >
                    {item.id === "fat" ? "Thick" : "Slim"}
                  </SegBtn>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <label className="text-[11px] font-medium text-muted" htmlFor="north-label">
                Wall text
              </label>
              <span className="font-mono text-[10px] tabular-nums text-subtle">
                {chars}/{MAX_LEN}
              </span>
            </div>
            <input
              id="north-label"
              value={labelDraft}
              maxLength={MAX_LEN}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ERGO"
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={() => setLabelDraft(sanitizeNorthLabel(labelDraft))}
              className="min-h-7 w-full rounded-sm border-0 bg-elevated px-2 font-mono text-xs uppercase tracking-wide text-fg outline-none ring-1 ring-transparent focus:ring-accent"
              aria-describedby="north-label-help"
            />
            <p id="north-label-help" className="sr-only">
              North GPIO wall. A–Z, 0–9. Cover, not a HAT well.
            </p>
          </div>

          <details className="rounded-sm" open>
            <summary className="field-head min-h-7 cursor-pointer list-none text-[11px] font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
              Looks
              <span className="font-mono tabular-nums text-fg">{scaleLabel}</span>
            </summary>
            <div className="pb-1 pt-1.5">
              <label htmlFor="voronoi-scale" className="sr-only">
                Lattice
              </label>
              <div className="lattice-row">
                <button
                  type="button"
                  aria-label={`Decrease pattern scale by ${step}`}
                  disabled={atMin}
                  onClick={() => {
                    setFocus("looks");
                    if (view === "bottom") setView("assembled");
                    setScale((v) => nudgeScale(v, -1, step));
                  }}
                  className="flex size-7 shrink-0 items-center justify-center rounded-sm text-fg hover:bg-elevated disabled:opacity-40"
                >
                  <Minus className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                <input
                  id="voronoi-scale"
                  type="range"
                  min={SCALE_MIN}
                  max={SCALE_MAX}
                  step={step}
                  value={scale}
                  aria-valuetext={scaleLabel}
                  onChange={(e) => {
                    setFocus("looks");
                    if (view === "bottom") setView("assembled");
                    setScale(snapScale(Number(e.target.value), step));
                  }}
                  className="h-7 min-w-0 flex-1 accent-filament"
                />
                <button
                  type="button"
                  aria-label={`Increase pattern scale by ${step}`}
                  disabled={atMax}
                  onClick={() => {
                    setFocus("looks");
                    if (view === "bottom") setView("assembled");
                    setScale((v) => nudgeScale(v, 1, step));
                  }}
                  className="flex size-7 shrink-0 items-center justify-center rounded-sm text-fg hover:bg-elevated disabled:opacity-40"
                >
                  <Plus className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <div role="group" aria-label="Lattice step size" className="seg seg-5 mt-1">
                {STEP_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={preset.value === step}
                    aria-label={`${preset.label} step ${stepLabel(preset.value)}`}
                    onClick={() => setStep(preset.value)}
                    className={
                      "min-h-7 min-w-0 flex-1 rounded-sm px-1 font-mono text-[10px] tabular-nums " +
                      (preset.value === step
                        ? "bg-elevated text-fg"
                        : "text-subtle hover:bg-elevated hover:text-fg")
                    }
                  >
                    {stepLabel(preset.value)}
                  </button>
                ))}
              </div>
            </div>
          </details>

          {builds.length > 0 && (
            <details className="rounded-sm">
              <summary className="field-head min-h-9 cursor-pointer list-none text-[11px] font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                Saved
                <span className="font-mono tabular-nums text-fg">{builds.length}</span>
              </summary>
              <ul className="mt-1 divide-y divide-border">
                {builds.map((build) => {
                  const active =
                    build.scale === scale &&
                    build.step === step &&
                    build.fastener === fastener &&
                    build.fit === fit &&
                    (build.hdmi ?? HDMI_PLUG_DEFAULT) === hdmi &&
                    (build.usb ?? USB_PLUG_DEFAULT) === usb &&
                    (build.keyring ?? KEYRING_DEFAULT) === keyring &&
                    build.label === label;
                  return (
                    <li key={build.id} className="saved-row">
                      <button
                        type="button"
                        onClick={() => {
                          setScale(build.scale);
                          setStep(build.step);
                          setFastener(build.fastener);
                          setFit(build.fit);
                          setHdmi(build.hdmi ?? HDMI_PLUG_DEFAULT);
                          setUsb(build.usb ?? USB_PLUG_DEFAULT);
                          setKeyring(build.keyring ?? KEYRING_DEFAULT);
                          setLabelDraft(build.label);
                          setLabel(build.label);
                        }}
                        className={
                          "min-h-9 flex-1 truncate px-1 text-left text-xs " +
                          (active ? "text-fg" : "text-muted hover:text-fg")
                        }
                        aria-current={active ? "true" : undefined}
                        aria-label={`Load ${build.name}`}
                      >
                        <span className="text-fg">{build.name}</span>
                        <span className="block truncate text-[10px] text-subtle">{savedSummary(build)}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${formatScale(build.scale)} ${build.fastener} build`}
                        onClick={() => setBuilds(deleteBuild(build.id))}
                        className="flex size-9 shrink-0 items-center justify-center text-subtle hover:text-fg"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>

        <div className="dock">
          {recommended ? null : (
            <button
              type="button"
              onClick={() => {
                setFastener("snap");
                setFit(PRINT_FIT_DEFAULT);
                setHdmi(HDMI_PLUG_DEFAULT);
                setUsb(USB_PLUG_DEFAULT);
                setKeyring(KEYRING_DEFAULT);
                setScale(SCALE_DEFAULT);
                setStep(SCALE_STEP);
                setFocus("default");
              }}
              className="text-left text-[10px] text-accent hover:text-fg"
            >
              Reset
            </button>
          )}
          {notice && (
            <p role="alert" className="text-[11px] leading-snug text-accent">
              {notice}
            </p>
          )}
          {saveLink ? (
            <>
              <a
                ref={saveRef}
                href={saveLink.href}
                download={saveLink.name}
                title={saveLink.name}
                className="btn-primary flex min-h-8 w-full items-center justify-center gap-2"
              >
                <Download className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                Save zip
              </a>
              <p className="truncate font-mono text-[10px] leading-snug text-subtle" title={saveLink.name}>
                {saveLink.name}
              </p>
              <p className="text-[10px] leading-snug text-muted">
                If the click is blocked, use Save zip. Two STLs + PRINT.txt + README.txt.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSaveLink(null);
                  void handlePrintPair();
                }}
                className="text-left text-[10px] text-subtle hover:text-fg"
              >
                Rebuild
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handlePrintPair}
              disabled={printing}
              aria-busy={printing}
              title={`${PRINT.firstArticle} ${PRINT.layer} · ${PRINT.walls} · ${PRINT.infill} · ${PRINT.supports}`}
              className="btn-primary flex min-h-8 w-full items-center justify-center gap-2 disabled:opacity-70"
            >
              <Download className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              {printing ? "Building…" : "Print pair"}
            </button>
          )}
          <p className="legal-agree">
            By downloading you agree to the <Link to="/terms">Terms of Use</Link> and{" "}
            <Link to="/safety">Safety Disclaimer</Link>. Hobby files, not certified products.
          </p>
          <div className="seg seg-3">
            <button
              type="button"
              onClick={handleLidDownload}
              className="flex min-h-7 items-center justify-center rounded-sm text-[11px] font-medium text-fg hover:bg-elevated"
            >
              Lid
            </button>
            <button
              type="button"
              onClick={handleTrayDownload}
              className="flex min-h-7 items-center justify-center rounded-sm text-[11px] font-medium text-fg hover:bg-elevated"
            >
              Tray
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={alreadySaved && !justSaved}
              className="flex min-h-7 items-center justify-center gap-1 rounded-sm text-[11px] font-medium text-fg hover:bg-elevated disabled:opacity-50"
            >
              <Bookmark className="size-3" strokeWidth={1.75} aria-hidden="true" />
              {justSaved || alreadySaved ? "Saved" : "Save"}
            </button>
          </div>
          <LegalFooter />
        </div>
      </aside>
      <section className="studio-stage">
        <div className="absolute inset-0">
          <CaseViewer
            view={view}
            scale={scale}
            screw={fastener === "screw"}
            fit={fit}
            hdmi={hdmi}
            usb={usb}
            keyring={keyring}
            focus={focus}
            label={label}
            showBoard={showBoard}
          />
          <FirstPrintCoach view={view} />
        </div>
      </section>
    </main>
  );
}
