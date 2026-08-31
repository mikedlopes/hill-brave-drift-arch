# Handoff — current and future Grok

You are in **Pi Zero Case Builder (Test)**: a print-ready configurator for one family.

**Read in order:** [STATUS.md](STATUS.md) → [FORMAT.md](FORMAT.md) → [CASE.md](CASE.md) → [LATTICE.md](LATTICE.md) → this file → [ROADMAP.md](ROADMAP.md).

Then run:

```
npm run harness
npm test
npm run typecheck
```

If the harness gold fails, the shipping tuple moved. Do not “fix” it by retargeting the board.

## What this product is

A user configures a **Raspberry Pi Zero** case (RP-008365 only), sees a truthful millimetre preview, downloads **lid + tray STLs** that fit a real board and real cables.

- Nobody has printed this cut. First pair is a fit article.
- GPIO is a **cover**. No HATs. Unpopulated header only.
- East CSI is a **ribbon window**, not a camera housing.
- Pattern is **relaxed Voronoi** (Poisson min-distance = spacing, clip to Ω, 2 Lloyd, sliver cull, offset-only punches). **Lid window through-cut.** Lid **frame solid.** Tray **floor 0.42 mm deboss.** Tray **walls smooth.** Lattice hole rims **R0.80**. Outer envelope **0.80 × 45° chamfer** (lid top, tray bottom; mating faces square). Port rims **0.54 × 45°** both faces. Looks 1.5×–2×, default **2×** (52 cells, web ≥ 1.4 mm). See [LATTICE.md](LATTICE.md).
- Style is a **keychain cover**. NE teardrop paddle-eye on the **tray**, opposite the SD.

Drawings:

- Board: [RP-008365-DS-1](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf)
- Official case envelope (reference only): [RP-008362-DS-1](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008362-DS-1-raspberry-pi-zero-case-mechanical-drawing.pdf)
- Original photos: `/workspace/attachments/` (`HQkJ*.jfif`)

## Architecture (do not collapse)

| Piece | File | Rule |
|---|---|---|
| Format / harness | [`src/lib/format-harness.ts`](../src/lib/format-harness.ts) | Shipping tuple + slots. No three.js. |
| Numbers | [`src/lib/case-params.ts`](../src/lib/case-params.ts) | Single millimetre table. |
| Lid | [`src/lib/voronoi-lid.ts`](../src/lib/voronoi-lid.ts) | Procedural field. Preview tessellation on screen. Print weld only on STL download. |
| Tray | [`src/lib/tray-body.ts`](../src/lib/tray-body.ts) | Procedural. Do **not** boolean-carve committed STLs in a REPL. |
| Lug | [`src/lib/keyring.ts`](../src/lib/keyring.ts) | BASE only. Opposite SD. |
| Board (visual) | [`src/components/pi-zero-board.tsx`](../src/components/pi-zero-board.tsx) | Lambert boxes. Not printable. |
| Viewer | [`src/components/case-canvas.tsx`](../src/components/case-canvas.tsx) | R3F, `frameloop="always"`, MeshLambert. Shell first, bake swap, last-good. Camera focuses: default / hdmi / usb / **keyring** / **looks**. Tween: Perlin smootherstep, 0.62 s. |
| Legal | [`src/lib/legal.ts`](../src/lib/legal.ts) | By-downloading line (no checkbox). Terms + Safety routes. README in zip. |
| UI | [`src/routes/index.tsx`](../src/routes/index.tsx) | Ergo chrome `#FF5E18`. Saved builds: `src/lib/saved-builds.ts`. |

CAD is millimetres, **Z-up**, origin at case XY centre. Canvas parents the group `rotation={[-π/2,0,0]}`. Assembled lid at `z = LID.trayH` (9.98). Board origin `(-33.0, -16.85)`. Extra width is dumped **north** so HDMI/USB stay in the south wall.

## Shipping defaults

| | |
|---|---|
| Lattice | 2× (floor 1.5×), hole rims R0.80 |
| Closure | Snap — nubs **R0.45** (~0.23 mm overlap at Standard) |
| Fit | Standard (lipClear 0.22, socket Ø2.56). Fit does **not** scale nubs. |
| HDMI / USB | Thick |
| Keyring | On |
| Label | ERGO |
| Zip | `pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug.zip` |
| Envelope | 70 × 37.7 × 12.13 |
| Outer chamfer | **0.80 × 45°** lid top + tray bottom. Ports **0.54 × 45°**. |
| Filament | `#e24a1c` (chrome `#FF5E18` is UI only) |

## Goals from here

Score path: [SCORE-100.md](SCORE-100.md) (78 → 90 is a printed pair, not UI).

Build **out from this format**, not by mutating Pi Zero numbers.

1. Keep the Zero family honest (print, thick-plug calipers).
2. Add **patterns** (`hex-honeycomb`, later frustum) as enums on the same lid envelope.
3. Add **mods** that already have slots (SD flap, LED pipe, feet) only with proven millimetres.
4. Add **devices** as new millimetre tables (`pi-zero-w` same envelope + antenna; Pico as a new family).
5. Add **styles** (GPIO well, camera hood, TPU bumper) as separate parts, not Booleans on this tray.

Details: [ROADMAP.md](ROADMAP.md).

## Landmines

- Boolean-carving `bottom.stl` in Python.
- Lattice under 1.5×.
- Covering spinner over an empty canvas. Keep last-good; chip only.
- Agree checkbox. Direct download + README in the zip.
- Inventing a contact email. Takedown is the Grok Build listing.
- Half-spacing Poisson, centroid-scale hole punches, or flatten-without-retessellate (those were the overlapping leftovers).
- Recoloring the mesh to chrome `#FF5E18`.
- Loading IGS / Pi GLB as a printable solid.
- CSG / manifold repair on the viewport path.
- Scaling a Pi 4 case, or this case, to “fit” another board.
- Calling this daily-carry until a pair has been printed.
- Covering a W / 2W antenna with dense lattice.
- Trapping the SD. 0.1 mm FDM gaps. HAT well on this style.

## Preview

Baked GLBs in `public/models/` are the **default** (2×, snap, thick plugs, keyring on, 0.80×45° outer chamfer, 52-cell field). Option changes rebuild async and keep the last good mesh. `frameloop="always"`. Do not put a spinner over an empty canvas.

Locked snapshot: **Build Version 2** (lattice cache `v40clean`, lid `v18chamfer`, bake `c80w150h80v47`).

## If you only do one thing

Do not break the shipping tuple. Run the harness. Print is the product.
