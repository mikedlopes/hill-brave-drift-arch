# Viewer audit — work through in order

Source: 2026-08-26 web-3D audit of this **millimetre CAD print configurator** (not a glTF storefront). Check a box only when the named test is green. Do not skip P0.

Related: [HANDOFF.md](HANDOFF.md) · [IMPROVEMENTS.md](IMPROVEMENTS.md) · [CASE.md](CASE.md)

**Product:** Voronoi Pi Zero case. Preview in WebGL, print as binary STL. Fit beats GPU flex.

---

## P0 — tab must not freeze

### PERF-01 Worker CAD

Lid/tray tessellation must not run on the UI thread.

- [x] `src/lib/mesh-worker.ts` builds preview meshes
- [x] `src/lib/mesh-client.ts` posts jobs, copies `Float32Array`, main-thread fallback if Worker fails
- [x] Canvas keeps the last good mesh on failure / cancel
- [x] Test: Node can still `previewLidFast` under 150 ms; UI import path does not call `lidStlBuffer`

### PERF-02 Demand loop

- [x] `frameloop="demand"`
- [x] Invalidate on orbit, resize, mesh swap only
- [x] No `setInterval(invalidate)`
- [x] `document.hidden` does not need a running rAF (demand handles this)

### UX-01 Canvas has real pixels

- [x] Viewer pane has explicit height (`h-[50dvh]` / `lg:h-full`)
- [x] Playwright: canvas width > 400 on 1100×720; Lid/Tray/Assembled click without throw

---

## P1 — correctness and lifecycle

### GEOM-02 Preview ≠ print tessellation

- [x] Orbit path uses `quality: "preview"` (`previewLidFast` / `buildTrayGeometry(..., "preview")`)
- [x] `lidStlBuffer` / `trayStlBuffer` only on download
- [x] Download still works after worker split

### REND-01 Context loss

- [x] `webglcontextlost` preventDefault
- [x] `webglcontextrestored` invalidate + rebuild

### A11Y-01 Canvas is named; motion

- [x] Canvas `role="img"` + `aria-label="Pi Zero case preview"`
- [x] `prefers-reduced-motion`: no damping, demand loop only

### OBS-01 Black-canvas test

- [x] Smoke: canvas visible, non-empty pixel, view tabs

---

## P2 — later (do not start until P0/P1 ticked)

- [x] Print STL is welded + degenerates dropped (`preparePrintSolid`). Full CSG left off — boolean union shredded the tray before. `three-bvh-csg` stays unused.
- [x] Keyboard orbit (arrows / +/- / 0 reset) when the canvas is focused
- [x] Home route does not import auth/PGLite/Recharts/WebGPU; those packages stay in the sandbox
- [x] WebGPU JFA stays off the critical path (test reads `case-canvas.tsx` / `mesh-worker.ts`)
- [x] Telemetry: last mesh ms + context-loss count in the canvas `aria-label` only (no GPU HUD)

---

## Generator contract (viewer accept / reject)

| Rule | Preview | Print STL |
|---|---|---|
| Format | triangles `BufferGeometry` | binary STL |
| Units | mm | mm |
| Thread | Worker (fallback main + yield) | Worker or download click |
| Booleans | merge OK | no orbit-path CSG |
| Failure | keep last good | no file, error chip |

---

## Score snapshot (2026-08-26)

| Domain | Score |
|---|---|
| Format (print STL) | Acceptable |
| Runtime glTF | Missing (N/A) |
| Frame loop | Acceptable after demand + worker |
| Generator / Pi fit | Acceptable |
| A11y of canvas | Acceptable after keyboard + named canvas |
| Security (no user GLB) | Acceptable |

Ship as a bench tool **after P0**. Public mobile **after P1**.
