# Lid lattice

Shipping pattern: **relaxed Voronoi** through-cut on the lid window. **Tray floor** is 0.42 mm deboss. Lid frame and tray walls are smooth.
Locked look: **Build Version 2** / format v2 / field cache `v40clean`.

## Algorithms (what we use vs what we refused)

| Algorithm | What it is | Lid |
|---|---|---|
| **Delaunay dual** (`d3-delaunay` / Delaunator) | Triangulate generators, Voronoi vertices = circumcenters | **Yes — this is the tessellation** |
| Fortune sweep | Direct Voronoi, O(n log n) | Same diagram. No benefit. |
| Incremental Bowyer–Watson | Build Delaunay by inserting sites | Same dual. Delaunator is faster. |
| Full CVT / Lloyd-to-residual | Move sites to cell centroids until hex | **No.** Honeycomb. Planned `hex-honeycomb` slot. |
| Weighted / power diagram | Sites have weights; dual is regular triangulation | No. Would restyle webs. |
| Jump flood (GPU) | Approximate Voronoi on a grid | Preview paint only, never print. |
| Circumcenter insertion (Chew) | Empty circumcircle too large → new generator | **Yes**, min-distance `0.48 × spacing`. |
| Farthest-point Steiner | Residual coverage miss → one extra site | **Yes**, only if ≥4 raster misses remain. |
| Centroid-scale hole | Shrink a cell toward its centroid | **No.** Punches through the web. Offset-convex only. |
| Flatten-then-keep-seeds | Snap skinny border verts without retessellating | **No.** Breaks the dual and leaves solid islands. |

## Pipeline

Poisson + wall band (**min-distance = spacing**, not half) → 2 Lloyd → jitter **6–16%** → break rectangular 4-cycles → Chew fat empty triangles → **cull sliver seeds** (area < 9 mm² or inradius < 1.32 mm) and retessellate → farthest-point Steiner only if a coverage miss remains → clip each cell to Ω → punch 1.5 mm webs with **offset-only** holes. Overlapping punches extra-inset both sides; never emit colliding Shape holes.

Ghost mirrors + clip-to-Ω is our bounded Voronoi.

## Locked field (default 2×)

| Scale | Cells (all punched) | Min web |
|---|---|---|
| 1.5× | 87 | ≥ 1.34 mm |
| 1.75× | 64 | ≥ 1.41 mm |
| **2×** | **52** | **≥ 1.4 mm** (live ~1.46) |

Hole rims **R0.80** (same number as the outer 0.80×45°). Web target **1.5 mm**. Looks 1.5×–2×, default **2×**.

Harness gold: `pattern.fieldAt2x = 52`, `pattern.webMinAt2x = 1.4`, `pattern.punch = "offset-convex"`.

Cache keys: field `v40clean`, lid parts `v18chamfer`, bake `c80w150h80v47`. Harness gold: `finish.cacheLid` / `finish.bake`.

## Skin vs through (assembly exterior)

| Face | Treatment | Why |
|---|---|---|
| Lid window Ω | **Through-cut** Voronoi | The photo. Air + GPIO view. |
| Lid soffit (all sides) | **Solid frame** | Pegs live here as islands. No bezel pockets. |
| Lid vertical edge | **0.80 × 45° chamfer** | Top outer only. Mating lip square. |
| Lid lip / sockets | Square, untextured | Mating faces. |
| Tray floor | **Deboss** 0.42 mm (`TRAY_RELIEF`) | Same language as the lid, on the bed face. Vents, pads, lug keep-outs. |
| Tray walls | **Smooth** 1.6 mm | Ports and ERGO type only. No lattice on the sides. |
| Tray corners | Solid quarter-pipes | Unwrapping a 1.6 mm R3.2 onto cells is a sliver field. |
| Keyring lug | Solid | Eye collar stays meat. Optional micro-pockets refused. |

**Emboss (raised cells) is refused on this family.** FDM vertical walls print raised islands as blobs; deboss is the outer perimeters with pockets. Through-cuts on the lid stay through — do not turn Ω into blind pockets.

Keyring is a floor-level teardrop paddle-eye on the CSI + GPIO corner. Hex honeycomb lives in `hex-lattice.ts` as a planned slot — not the lid.
