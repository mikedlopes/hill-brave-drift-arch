"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { DoubleSide, MeshLambertMaterial, MOUSE, Spherical, TOUCH, Vector3, WebGLRenderer, type BufferGeometry } from "three";
import { HDMI_PLUG_DEFAULT, KEYRING_DEFAULT, USB_PLUG_DEFAULT, LID, PRINT_FIT_DEFAULT, type HdmiPlug, type Keyring, type PrintFit, type UsbPlug } from "@/lib/case-params";
import { NORTH_LABEL_DEFAULT } from "@/lib/north-type";
import { loadBakedPair, matchesBake } from "@/lib/preview-loader";
import { lidShell, trayShell } from "@/lib/preview-hulls";
import { setMeshBuilding, setMeshStep } from "@/lib/mesh-progress";
import { previewStatsLabel, recordContextLost, subscribePreviewStats } from "@/lib/preview-stats";
import { getWebGlContext } from "@/lib/webgl-probe";
import { PiZeroBoard } from "./pi-zero-board";
import type { CameraFocus, CaseViewerProps, PartView } from "./case-viewer-types";

const FILAMENT = "#e24a1c";
const noopRaycast = () => {};

const filament = new MeshLambertMaterial({
  color: FILAMENT,
  emissive: FILAMENT,
  emissiveIntensity: 0.28,
  toneMapped: false,
  side: DoubleSide,
});

type Pose = { p: [number, number, number]; t: [number, number, number] };

/** OrbitControls: one wheel notch ≈ radius × 1/0.95. Default views sit 8 notches further out. */
const WHEEL_OUT = (1 / 0.95) ** 8;

function dolly(pose: Pose, k: number): Pose {
  const [px, py, pz] = pose.p;
  const [tx, ty, tz] = pose.t;
  return {
    p: [tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k],
    t: pose.t,
  };
}

/** NE isometric: north wall (ERGO) + east keyring. Group is Z-up → Y-up. Lid from slightly under so sockets read. */
const POSE: Record<PartView, Pose> = {
  lid: dolly({ p: [52, -26, -74], t: [0, 0.6, 0] }, WHEEL_OUT),
  bottom: dolly({ p: [28, 82, -36], t: [0, 5, 0] }, WHEEL_OUT),
  assembled: dolly({ p: [69, 56, -75], t: [8, 6, -4] }, WHEEL_OUT),
};

/** South I/O — mini HDMI (CAD x ≈ −20.6). World +Z is case south. */
const HDMI_POSE: Record<PartView, Pose> = {
  lid: POSE.lid,
  bottom: { p: [-18, 34, 96], t: [-18, 6, 6] },
  assembled: { p: [-18, 36, 98], t: [-18, 8, 6] },
};

/** South I/O — both micro-USB (CAD x ≈ 14.7). Same south-face offset as HDMI. */
const USB_POSE: Record<PartView, Pose> = {
  lid: POSE.lid,
  bottom: { p: [15, 34, 96], t: [15, 6, 6] },
  assembled: { p: [15, 36, 98], t: [15, 8, 6] },
};

/** NE pad-eye on the tray (CAD ≈ 37, 20.8 → world +X −Z). */
const KEYRING_POSE: Record<PartView, Pose> = {
  lid: { p: [78, 28, -58], t: [34, 4, -16] },
  bottom: { p: [78, 28, -58], t: [34, 4, -16] },
  assembled: { p: [82, 30, -60], t: [34, 6, -16] },
};

/** Lid lattice from above. Tray view looks into the floor field. */
const LOOKS_POSE: Record<PartView, Pose> = {
  lid: { p: [42, 78, -52], t: [0, 4, 0] },
  bottom: { p: [18, 88, -22], t: [0, 5, 0] },
  assembled: { p: [38, 86, -48], t: [0, 10, 0] },
};

function poseOf(view: PartView, focus: CameraFocus) {
  if (focus === "hdmi") return HDMI_POSE[view];
  if (focus === "usb") return USB_POSE[view];
  if (focus === "keyring") return KEYRING_POSE[view];
  if (focus === "looks") return LOOKS_POSE[view];
  return POSE[view];
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function disposeLater(g: BufferGeometry) {
  requestAnimationFrame(() => g.dispose());
}

function SizeWatch() {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", previewStatsLabel());
    canvas.tabIndex = 0;
    const syncLabel = () => canvas.setAttribute("aria-label", previewStatsLabel());
    const unsub = subscribePreviewStats(syncLabel);
    const onLost = (event: Event) => {
      event.preventDefault();
      recordContextLost();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", () => invalidate());
    const el = canvas.parentElement;
    const ro = el ? new ResizeObserver(() => invalidate()) : null;
    if (el) ro?.observe(el);
    const onVis = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", onVis);
    invalidate();
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
      unsub();
    };
  }, [gl, invalidate]);
  return null;
}

function useCaseMeshes(scale: number, screw: boolean, fit: PrintFit, label: string, hdmi: HdmiPlug, keyring: Keyring, usb: UsbPlug) {
  const dScale = useDebounced(scale, 160);
  const dLabel = useDebounced(label, 160);
  const dScrew = useDebounced(screw, 80);
  const dFit = useDebounced(fit, 80);
  const dHdmi = useDebounced(hdmi, 80);
  const dKeyring = useDebounced(keyring, 80);
  const dUsb = useDebounced(usb, 80);
  const [lid, setLid] = useState<BufferGeometry>(() => lidShell);
  const [tray, setTray] = useState<BufferGeometry>(() => trayShell);
  const [fromFile, setFromFile] = useState(false);
  const bakeRef = useRef<{ lid: BufferGeometry; tray: BufferGeometry } | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const isBake = (g: BufferGeometry | null) =>
    Boolean(
      g &&
        (g === lidShell ||
          g === trayShell ||
          (bakeRef.current && (g === bakeRef.current.lid || g === bakeRef.current.tray))),
    );

  useEffect(() => {
    let cancelled = false;
    setMeshStep("ready");
    void loadBakedPair()
      .then((next) => {
        if (cancelled) return;
        bakeRef.current = next;
        setLid(next.lid);
        setTray(next.tray);
        setFromFile(true);
        setMeshStep("ready");
        setMeshBuilding(false);
        invalidateRef.current();
      })
      .catch((err) => {
        console.warn("baked preview failed, building parametric", err);
        if (cancelled) return;
        void import("@/lib/mesh-client")
          .then(({ buildPreviewLid, buildPreviewTray }) => {
            if (cancelled) return;
            const nextTray = buildPreviewTray(dScale, dScrew, "preview", dLabel, dHdmi, dKeyring, dUsb);
            const nextLid = buildPreviewLid(dScale, dScrew, dFit);
            setTray(nextTray);
            setLid(nextLid);
            setFromFile(true);
            setMeshStep("ready");
            setMeshBuilding(false);
            invalidateRef.current();
          })
          .catch((fallbackErr) => {
            console.warn("parametric preview failed", fallbackErr);
            if (!cancelled) {
              setMeshStep("ready");
              setMeshBuilding(false);
            }
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fromFile) return;
    let cancelled = false;
    if (matchesBake(dScale, dScrew, dFit, dLabel, dHdmi, dKeyring, dUsb)) {
      const bake = bakeRef.current;
      if (bake) {
        setLid((prev) => {
          if (prev && prev !== bake.lid && !isBake(prev)) disposeLater(prev);
          return bake.lid;
        });
        setTray((prev) => {
          if (prev && prev !== bake.tray && !isBake(prev)) disposeLater(prev);
          return bake.tray;
        });
        setMeshBuilding(false);
        setMeshStep("ready");
        invalidateRef.current();
      }
      return () => {
        cancelled = true;
      };
    }
    const timer = window.setTimeout(() => {
      setMeshBuilding(true);
      void import("@/lib/mesh-client")
        .then(({ buildPreviewLid, buildPreviewTray }) => {
          if (cancelled) {
            setMeshBuilding(false);
            return;
          }
          try {
            const next = buildPreviewTray(dScale, dScrew, "preview", dLabel, dHdmi, dKeyring, dUsb);
            setTray((prev) => {
              if (prev && prev !== next && !isBake(prev)) disposeLater(prev);
              return next;
            });
          } catch (err) {
            console.warn("tray preview failed, keeping last mesh", err);
          }
          try {
            const next = buildPreviewLid(dScale, dScrew, dFit);
            setLid((prev) => {
              if (prev && prev !== next && !isBake(prev)) disposeLater(prev);
              return next;
            });
          } catch (err) {
            console.warn("lid preview failed, keeping last mesh", err);
          }
          if (!cancelled) {
            setMeshBuilding(false);
            setMeshStep("ready");
          }
          invalidateRef.current();
        })
        .catch((err) => {
          console.warn("mesh-client failed, keeping baked preview", err);
          if (!cancelled) {
            setMeshBuilding(false);
            setMeshStep("ready");
          }
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setMeshBuilding(false);
    };
  }, [fromFile, dScale, dScrew, dFit, dLabel, dHdmi, dKeyring, dUsb]);

  return { lid, tray };
}

function KeyboardOrbit({ view }: { view: PartView }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    el.tabIndex = 0;
    const spherical = new Spherical();
    const offset = new Vector3();
    const onKey = (event: KeyboardEvent) => {
      const key = event.key;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "0", "Home"].includes(key)) return;
      event.preventDefault();
      const c = controls as { target: Vector3; update: () => void } | null;
      if (!c?.target) return;
      if (key === "0" || key === "Home") {
        const pose = poseOf(view, "default");
        camera.position.set(...pose.p);
        c.target.set(...pose.t);
        camera.lookAt(c.target);
        c.update();
        invalidate();
        return;
      }
      offset.copy(camera.position).sub(c.target);
      spherical.setFromVector3(offset);
      if (key === "ArrowLeft") spherical.theta -= 0.08;
      if (key === "ArrowRight") spherical.theta += 0.08;
      if (key === "ArrowUp") spherical.phi = Math.max(0.08, spherical.phi - 0.08);
      if (key === "ArrowDown") spherical.phi = Math.min(Math.PI - 0.08, spherical.phi + 0.08);
      if (key === "+" || key === "=") spherical.radius = Math.max(28, spherical.radius * 0.9);
      if (key === "-") spherical.radius = Math.min(220, spherical.radius * 1.1);
      offset.setFromSpherical(spherical);
      camera.position.copy(c.target).add(offset);
      camera.lookAt(c.target);
      c.update();
      invalidate();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [view, camera, controls, gl, invalidate]);
  return null;
}

/**
 * Camera tween, millimetre preview — not a game.
 * Rejected: easeOutExpo (cinematic kick), linear (mechanical click),
 * easeInOutCubic (still a punch in the middle).
 * smootherstep: zero velocity and acceleration at both ends.
 */
function cameraEase(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

const TWEEN_SEC = 0.62;

function shortestTheta(from: number, to: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d;
}

function CameraRig({
  view,
  focus,
  reduceMotion,
}: {
  view: PartView;
  focus: CameraFocus;
  reduceMotion: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const primed = useRef(false);
  const offset = useRef(new Vector3());
  const anim = useRef<{
    t: number;
    fromT: Vector3;
    toT: Vector3;
    fromR: number;
    toR: number;
    fromPhi: number;
    toPhi: number;
    fromTheta: number;
    toTheta: number;
  } | null>(null);

  useLayoutEffect(() => {
    const next = poseOf(view, focus);
    const c = controls as { target?: Vector3; update?: () => void } | null;
    if (reduceMotion || !primed.current || !c?.target) {
      primed.current = true;
      camera.position.set(...next.p);
      c?.target?.set(...next.t);
      camera.lookAt(...next.t);
      c?.update?.();
      anim.current = null;
      invalidate();
      return;
    }
    const fromT = c.target.clone();
    const fromS = new Spherical().setFromVector3(offset.current.copy(camera.position).sub(fromT));
    const toT = new Vector3(...next.t);
    const toS = new Spherical().setFromVector3(new Vector3(...next.p).sub(toT));
    if (camera.position.distanceTo(new Vector3(...next.p)) < 0.45 && fromT.distanceTo(toT) < 0.45) return;
    anim.current = {
      t: 0,
      fromT,
      toT,
      fromR: fromS.radius,
      toR: toS.radius,
      fromPhi: fromS.phi,
      toPhi: toS.phi,
      fromTheta: fromS.theta,
      toTheta: shortestTheta(fromS.theta, toS.theta),
    };
  }, [view, focus, camera, controls, reduceMotion, invalidate]);

  useFrame((_, delta) => {
    const run = anim.current;
    if (!run) return;
    run.t = Math.min(1, run.t + delta / TWEEN_SEC);
    const k = cameraEase(run.t);
    const c = controls as { target?: Vector3; update?: () => void } | null;
    if (!c?.target) return;
    c.target.lerpVectors(run.fromT, run.toT, k);
    offset.current.setFromSphericalCoords(
      run.fromR + (run.toR - run.fromR) * k,
      run.fromPhi + (run.toPhi - run.fromPhi) * k,
      run.fromTheta + (run.toTheta - run.fromTheta) * k,
    );
    camera.position.copy(c.target).add(offset.current);
    camera.lookAt(c.target);
    c.update?.();
    if (run.t >= 1) anim.current = null;
  });

  useEffect(() => {
    const el = gl.domElement;
    const cancel = () => {
      anim.current = null;
    };
    el.addEventListener("pointerdown", cancel);
    return () => el.removeEventListener("pointerdown", cancel);
  }, [gl]);

  return null;
}

function Scene({
  view,
  scale,
  screw,
  fit,
  label,
  hdmi,
  keyring,
  usb,
  showBoard,
}: {
  view: PartView;
  scale: number;
  screw: boolean;
  fit: PrintFit;
  label: string;
  hdmi: HdmiPlug;
  keyring: Keyring;
  usb: UsbPlug;
  showBoard: boolean;
}) {
  const { lid, tray } = useCaseMeshes(scale, screw, fit, label, hdmi, keyring, usb);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    invalidate();
  }, [view, showBoard, lid, tray, invalidate]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {tray && view !== "lid" && (
        <mesh geometry={tray} material={filament} frustumCulled={false} raycast={noopRaycast} />
      )}
      {showBoard && view !== "lid" ? <PiZeroBoard /> : null}
      {lid && view !== "bottom" && (
        <mesh
          geometry={lid}
          material={filament}
          position={view === "assembled" ? [0, 0, LID.trayH] : [0, 0, 0]}
          frustumCulled={false}
          raycast={noopRaycast}
        />
      )}
    </group>
  );
}

export function CaseCanvas({
  view,
  scale,
  screw,
  fit = PRINT_FIT_DEFAULT,
  hdmi = HDMI_PLUG_DEFAULT,
  keyring = KEYRING_DEFAULT,
  usb = USB_PLUG_DEFAULT,
  focus = "default",
  label = NORTH_LABEL_DEFAULT,
  showBoard,
}: CaseViewerProps) {
  const reduceMotion = prefersReducedMotion();
  const antialias = !reduceMotion;
  return (
    <Canvas
      className="absolute inset-0 z-10 h-full w-full cursor-grab touch-none active:cursor-grabbing"
      style={{ width: "100%", height: "100%", display: "block", background: "#1c2128" }}
      dpr={[1, 1]}
      frameloop="always"
      flat
      gl={(defaultProps) => {
        const canvas = (defaultProps as { canvas: HTMLCanvasElement }).canvas;
        const context = getWebGlContext(canvas, antialias);
        return new WebGLRenderer({
          canvas,
          context,
          antialias,
          alpha: true,
          stencil: false,
          depth: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
        });
      }}
      camera={{ position: POSE.assembled.p, fov: 35, near: 0.5, far: 400 }}
      onCreated={({ gl, camera, invalidate }) => {
        camera.up.set(0, 1, 0);
        gl.setClearColor("#1c2128", 1);
        gl.domElement.setAttribute("role", "img");
        gl.domElement.setAttribute("aria-label", previewStatsLabel());
        gl.domElement.tabIndex = 0;
        invalidate();
      }}
    >
      <hemisphereLight args={["#fff6ea", "#3a342c", 1.15]} />
      <directionalLight position={[40, 80, 30]} intensity={1.45} />
      <directionalLight position={[-20, 55, -50]} intensity={0.7} />
      <directionalLight position={[30, 18, -40]} intensity={0.45} />
      <Grid
        infiniteGrid
        fadeDistance={160}
        fadeStrength={1.15}
        cellSize={5}
        cellThickness={0.55}
        cellColor="#3a424c"
        sectionSize={25}
        sectionThickness={1.05}
        sectionColor="#5c6b7a"
        position={[0, -0.04, 0]}
      />
      <SizeWatch />
      <CameraRig view={view} focus={focus} reduceMotion={reduceMotion} />
      <KeyboardOrbit view={view} />
      <Scene view={view} scale={scale} screw={screw} fit={fit} hdmi={hdmi} keyring={keyring} usb={usb} label={label} showBoard={showBoard} />
      <OrbitControls
        makeDefault
        enableDamping={!reduceMotion}
        dampingFactor={0.12}
        enablePan
        enableRotate
        enableZoom
        minDistance={28}
        maxDistance={220}
        target={POSE.assembled.t}
        mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
      />
    </Canvas>
  );
}
