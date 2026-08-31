# Pi Zero Voronoi Case

Workshop configurator for a **3D-printable Raspberry Pi Zero** case (RP-008365). Not Zero 2 / 2W. Shipping lock: **Build Version 2** (format v2 — Voronoi hole rims R0.80).

- Parametric **Voronoi lid** (in-browser STL)
- Solid **tray** (snap pegs or M2.5 screws)
- Orbit preview, print-fit presets, NE paddle-eye

This is a **print tool**, not a game. Units **mm**. CAD is Z-up; the canvas parents the group with `rotation={[-π/2,0,0]}` so the bench view is Z-up on screen.

## Next Grok — read these in order

1. [docs/STATUS.md](docs/STATUS.md) — current numbers, honesty, open issues
2. [docs/FORMAT.md](docs/FORMAT.md) — shipping tuple + how to clone the family
3. [docs/HANDOFF.md](docs/HANDOFF.md) — wiring, landmines
4. [docs/ROADMAP.md](docs/ROADMAP.md) — more devices / patterns / styles / mods
5. [docs/CASE.md](docs/CASE.md) — RP-008365 millimetres
6. `npm run harness` then `npm test`


## Drawings (gospel)

| | |
|---|---|
| Board | [RP-008365-DS-1](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf) |
| Official case (envelope reference) | [RP-008362-DS-1](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008362-DS-1-raspberry-pi-zero-case-mechanical-drawing.pdf) |

Board: **65 × 30**, holes **Ø2.75** at **3.5**, span **58 × 23**, HDMI **12.4**, USB **41.4 / 54**, SD **16.9** from north.

We take official-case **width 37.70** and **height 12.13**. Length stays **70**. Wall stays **1.6** (FDM; official is 0.80 molded).

## Product

| Control | What it does |
|---|---|
| Lid / Tray / Assembled | Which mesh is on the bench |
| Pattern scale | Voronoi cell size (`1.5×`–`2×`, default `2×`, nothing under 1.5×) |
| Step presets | Slider increment |
| Snap / Screw | Tall pegs vs short bosses + Ø2.3 pilots |
| Tight / Standard / Loose | Lip clearance + screw hole shrink |
| Show Pi Zero | Procedural board (not a GLB) |
| Download lid / tray | Binary STL |

## Stack

- Vite + React 19 + TanStack Router
- `@react-three/fiber` + `@react-three/drei` — **client-only** canvas, `frameloop="demand"`
- Lid: `three` `ExtrudeGeometry` + `d3-delaunay`
- Tray: `manifold3d` via Python
- Theme: Ergo chrome (`#FF8218` / `#0B0C12`) — **not** the mesh color (`#e24a1c`)

## Commands

```bash
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm test             # includes src/lib/voronoi-lid.print.test.ts
python3 scripts/build-tray.py
```

After regenerating the tray, bump `?v=` in `trayPreviewUrl()` (`src/lib/voronoi-lid.ts`).
