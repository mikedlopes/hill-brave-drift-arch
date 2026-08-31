# Status (read this first on a new session)

**Nobody has printed this cut.** Raspberry Pi Zero only (RP-008365). Not Zero 2 / 2W. First pair is a fit article, not a gift. GPIO is a cover — no HATs, unpopulated header only. East CSI is a ribbon window, not a camera housing.

Source of truth: `PI_ZERO` + `LID` in [`src/lib/case-params.ts`](../src/lib/case-params.ts) and generators in [`voronoi-lid.ts`](../src/lib/voronoi-lid.ts) / [`tray-body.ts`](../src/lib/tray-body.ts). Format contract: [`FORMAT.md`](FORMAT.md) · harness gold [`harness-snapshot.json`](harness-snapshot.json) · expansion [`ROADMAP.md`](ROADMAP.md). Not `scripts/build-tray.py`.

Locked snapshot: **Build Version 2** (format v2). Lattice hole rims **R0.80**. Outer envelope **0.80 × 45° chamfer** (stepped solids so the facet is the silhouette). Lid field locked: **52 cells at 2×**, offset-only punches. Finish: lid window through-cut, frame solid, tray floor deboss, tray walls smooth, nubs R0.45. Details: [LATTICE.md](LATTICE.md) · gold [`harness-snapshot.json`](harness-snapshot.json).

## Current defaults (first print)

| | |
|---|---|
| Lattice | **2×** (1.5× most condensed) — **52 cells**, web ≥ 1.4 mm, all punched |
| Closure | **Snap** — nubs **R0.45** (~0.23 mm overlap). Fit does not scale nubs. |
| Printer fit | **Standard** (lip 0.22, socket Ø2.56) |
| Mini HDMI | **Thick** 16.2 × 6.9 |
| USB | **Thick** 11.0 × 6.9 |
| Keyring | **On** — NE teardrop paddle-eye |
| Wall text | **ERGO** |
| Zip | `pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug.zip` + `PRINT.txt` |

Recipe in the zip: 0.20 mm · 3 walls · 20% infill · no supports · tray floor-down · lid lip-down. Unzip two STLs. Do not print the zip.

## Envelope

| | |
|---|---|
| Lid/tray body | **70 × 37.7 mm** flush |
| Tray H / lid thick / assembled | **9.98 / 2.15 / 12.13** |
| Wall / floor / corner | 1.6 / 1.5 / 3.2 |
| Soffit | E/W 8.36 mm; N/S **2.64 mm** (both long walls maxed) |
| Lattice min scale | **1.5×** (87 cells; 1.75× is 64) |
| Lattice hole rims | **R0.80** — inside every cell |
| Lattice punch | **offset-convex** — no centroid-scale, no overlapping holes |
| Peg H (snap) | 11.53 |
| Board origin | **(-33.0, -16.85)** |
| Standoff | **1.25 mm** (PCB at z 2.75) |
| Snap sockets | Blind, **0.6 mm** outer skin |
| Outer chamfer | **0.80 × 45°** lid top + tray bottom. Mating square. Ports **0.54 × 45°**. |
| Snap nubs | **R0.45** |
| Skin | Lid window through-cut. Lid frame solid. Tray floor 0.42 mm deboss. Tray walls smooth. |

Port millimetres: [CASE.md](CASE.md). Locked in `voronoi-lid.print.test.ts`.

## Open

1. **Score stays 78 until a printed pair** ([SCORE-100.md](SCORE-100.md) S0). Thick plugs are catalogue, not calipered.
2. Viewer: shell on frame 0 → baked GLB swap (decode once). Last-good on lattice/HDMI/USB/keyring. Corner “Updating” chip, no covering spinner. Camera: HDMI / USB / keyring / Looks poses, **smootherstep 0.62 s** (reduced-motion snaps). Brave still the riskiest browser.
3. Listing: no agree checkbox. “By downloading…” under Print pair. `/terms` `/safety`. README.txt + PRINT.txt in every zip. Takedown = Grok Build listing (no email).
4. Length is **70** not official **79**. Wall **1.6** not molded 0.80.
5. C freeze: Pi Zero only. No extra 2W vents. Snap default; nub grow +0.1 mm if lid walks. Do not use print-fit to tune the click.

## Do not start by

- Boolean-carving `bottom.stl` in a Python REPL
- Adding lattice scales under 1.5×
- Recoloring the mesh to Ergo orange `#FF8218` (filament is `#e24a1c`)
- Loading IGS/GLTF of the Pi as a printable solid
- Calling this daily-carry until a pair has been printed
