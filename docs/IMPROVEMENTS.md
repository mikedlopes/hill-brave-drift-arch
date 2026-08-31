# Improvements — work through in order

Source: 2026-08-26 stack audit. Do **not** skip P0. Check a box only when the test (or print) named in the row is green.

How to use: pick the next unchecked P0, do that one thing, run the test, tick it. Do not mix in “while I’m here” GPU or UI polish.

Related: [STATUS.md](STATUS.md) · [HANDOFF.md](HANDOFF.md) · [CASE.md](CASE.md)

---

## P0 — do not ship until done

### 1. Preview lattice === print lattice

The viewport must show the **same Voronoi cells** as the downloaded STL. Cheap preview may only drop `curveSegments` / skip the 0.32 mm chamfer merge. It must **not** change seed count, Poisson radius, or cell topology.

- [x] `seedPoints()` uses the same `attempts` for `"preview"` and `"print"`
- [x] Same `mulberry32(11)` seed, same hole injection
- [x] Preview may use `curveSegments: 4` and skip outer chamfer; that is the only quality split
- [x] Test: `buildVoronoiLidParts(1, "preview")` and `buildVoronoiLidParts(1, "print")` have the **same** `holesCut` and the same edge midpoints (within 0.05 mm)
- [x] Files: [`src/lib/voronoi-lid.ts`](../src/lib/voronoi-lid.ts), [`src/lib/voronoi-lid.print.test.ts`](../src/lib/voronoi-lid.print.test.ts)

### 2. One number table for lid + tray

`LID` / `PI_ZERO` / `portWindows()` / `sideWindows()` in TS are gospel. [`scripts/build-tray.py`](../scripts/build-tray.py) must not invent millimetres.

- [x] Python reads constants from a generated file **or** a small JSON dumped from TS (e.g. `scripts/case-dims.json` written by a node one-liner)
- [x] Locked fields: `L, W, H, WALL, FLOOR, CORNER, C`, board origin, four hole XY, HDMI/USB x-spans, SD/CSI y-spans, peg R/H, screw pilot R
- [x] Test: Python bbox `70 × 37.7` (plus torus), HDMI centre **12.4**, tray H **9.98**
- [x] After every tray rebuild, bump `trayPreviewUrl()` `?v=`
- [x] Files: `voronoi-lid.ts`, `build-tray.py`, new dump script if needed

### 3. Say GPIO is a cover, not a HAT

Populated 40-pin is ~8.5 mm off the PCB. Lid plate starts at z **9.98**. Pins hit the lid. Official case used a 62×23 well; we put Voronoi over the header on purpose (keychain).

- [x] UI copy under Closure or Print: **“GPIO is covered. No HATs. Unpopulated header only.”**
- [x] Same sentence in [CASE.md](CASE.md)
- [x] Do **not** punch a 62×23 hole unless the user asks to kill the Voronoi

---

## P1 — CAD / print

### 4. Tray STL smoke test

- [x] Test loads `public/models/pi_zero_case_bottom.stl`
- [x] Watertight
- [x] Body XY is **70 × 37.7** (torus may exceed north/west)
- [x] Z max on snap tray ≈ **11.53** (pegs), body **9.98**
- [x] HDMI windows come from `portWindows()` via `case-dims.json` (no second table)

### 5. Stop magic numbers in `cut_ports`

- [x] South / west / east knives come from the generated table (item 2), not literals like `(-27.60, -13.60, …)`
- [x] Comment cites RP-008365 centres 12.4 / 41.4 / 54 and SD 16.9 from north

### 6. Key-ring clip cubes

`add_corner_ring` still differences `cube((90,12,20))` south and `cube((12,50,20))` east to shave hull bleed.

- [x] After a tray rebuild, south rim y-min is **-18.85** (not proud of the lid)
- [x] East rim x-max is **35.0**
- [x] If the torus union is clean, delete those clip cubes; if not, keep them and document why

### 7. USB overmold

Windows are 10.8 mm wide (8 + 1.4 pad × 2). Fat cables will be snug.

- [ ] First real print notes whether USB-power / OTG overmolds bind
- [ ] If they bind, bump `usbW` or `portClear` in **one** place (the table), rebuild tray, re-test item 4
- [ ] Do not open-top the ports and do not add outer bezels

### 8. Lid STL quality

Three.js `ExtrudeGeometry` → binary STL is fine for FDM. Not a mill.

- [x] Download path uses `"print"` quality only (`lidStlBuffer` already passes `"print"`)
- [x] Spot-check: print solid has lip below z=0 and four socket bores (automated; still eyeball in a slicer before first print)
- [x] 2× field is a clean tessellation: 52 punched cells, web ≥ 1.4 mm, offset-only holes (no overlapping leftovers). Locked in harness gold `pattern.fieldAt2x` / `webMinAt2x`.
- [ ] Optional later: manifold3d lid. Not a P0.

---

## P1 — software (make the viewer boring)

### 9. One lid path on the bench

`bakedLattice` is always true. Instanced bars, Naive, and Compute do not draw the product.

- [x] Viewport: hull (instant) → `getPreviewLidParts` swap → single `mesh`
- [x] Delete viewport use of `ComputeLid`, `NaiveLid`, `compute-batch.ts`
- [x] Delete or stop importing [`gpu-hud.tsx`](../src/components/gpu-hud.tsx)
- [x] Keep `DrawMode` out of the UI (already hidden)
- [x] Files: [`case-canvas.tsx`](../src/components/case-canvas.tsx)

### 10. Clicks vs WebGL (do not regress)

Lid / Tray / Assembled died because `eventSource` was a fullscreen wrapper.

- [x] Canvas `pointer-events: none`
- [x] Orbit hit target is **right of the panel** (`sm:left-[26.5rem]`) and **below it** on small screens (`top-[calc(52dvh+2.5rem)]`)
- [x] Panel stays `z-50` + `pointer-events-auto`
- [x] Manual: every control still works with the canvas mounted

### 11. Loader

- [x] No full-screen “Building lid” dimmer
- [x] 3px CSS bar, auto-hide ~2.4 s
- [x] `onCreated` → `onReady` (do not wait for Voronoi)
- [x] Keep-last-good mesh on scale change; chip “Updating lattice” only
- [x] Do not put `animation: none` on the boot bar under `prefers-reduced-motion` in a way that leaves a frozen 40% pill

### 12. Default view

- [x] Default **Assembled** so tray GLB is on screen before Voronoi
- [x] Instant `previewLidHull()` so Lid is never a blank `#0b0c12` frame

---

## P2 — UI copy and clutter

### 13. Print ticket

- [x] Keep: view, lattice scale, snap/screw, tight/standard/loose, download, print recipe
- [ ] Consider dropping step presets to one default (0.05) — optional, ask before deleting
- [x] “Hide board” should not look disabled-broken on Lid (hide the control or explain)

### 14. Accessibility

- [x] Keep 44 px targets, `aria-pressed`, skip link
- [x] Check `text-subtle` contrast on `bg-surface`
- [x] Scope `prefers-reduced-motion` — do not `*` `{ animation-duration: 0.01ms }` the whole app

---

## P2 — tests to add when touching CAD

- [x] HDMI / USB / USB centres vs `boardOrigin()` (already in print test — keep)
- [x] `LID.trayH + LID.thick === 12.13`
- [x] `SCALE_MIN === 1.5` (no lattice under 1.5×)
- [x] Preview topology === print topology (item 1)
- [x] Tray STL bbox (item 4)
- [x] Peg Ø ≤ 2.35, socket − peg ≥ 0.30 diameter

---

## Do not do (landmines)

These already destroyed the tray or the viewer. If a task smells like one, stop.

- Open-top U-slots for HDMI/USB
- Floor channel for SD
- Outer port bezels (tray bigger than lid)
- Chamfer on the mating rim
- Centering the board in the 37.7 mm width (ports leave the south wall)
- Lattice scale < 1.5×
- Recoloring the mesh to Ergo `#FF8218` (filament is `#e24a1c`)
- Loading IGS / Pi GLB as a printable solid
- Boolean-carving the committed `bottom.stl` in a REPL
- Eager `import("./case-canvas")` from the page (SSR WebGL)
- Growing length to official **79** unless the user asks
- 0.80 mm walls (molded, not FDM)

---

## Launch gate (all must be true)

- [x] P0-1, P0-2, P0-3 ticked
- [x] P1-4 tray STL test green
- [x] P1-9 dead GPU path gone
- [x] P1-10 buttons work with canvas up
- [ ] One physical print: **Standard + snap**, 0.20 mm / 0.40 mm / 3 walls / PLA or PETG
  - [ ] Board drops on four pegs
  - [ ] Lid seats, no GPIO crush (header **unpopulated**)
  - [ ] HDMI + both micro-USB cables in
  - [ ] SD in/out with board seated

Until that print, this is a configurator demo, not a product.
