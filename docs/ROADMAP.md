# Roadmap — build out from this format

Shipping today: **Pi Zero · truncated-CVT Voronoi · keychain cover**. See [FORMAT.md](FORMAT.md).

Do not start a new board by stretching `LID.length`. Each row is a slot. Ship one slot at a time. A printed Zero pair still beats every row below.

## Devices

| Id | Status | What it takes |
|---|---|---|
| `pi-zero` | **shipping** | RP-008365. Do not retarget. |
| `pi-zero-w` | same-envelope | Same 65 × 30. Antenna keepout on the south-west. Plastic lug only. |
| `pi-zero-2w` | same-envelope | Same holes. Heat: slot vents or chimney, not a dense Faraday lid. After a printed Zero pair. |
| `pi-pico` | planned | New millimetre table. New envelope. New family id. |
| `pi-3` / `pi-4` / `pi-5` | **forbidden** | New family. Never a scale of this case. |

## Patterns

| Id | Status | What it takes |
|---|---|---|
| `truncated-cvt-voronoi` | **shipping** | Relaxed Voronoi: Poisson min-distance = spacing, clip to Ω, 2 Lloyd, sliver cull, offset-only punches. Hole rims R0.80. 1.5×–2×. 2× = 52 cells, web ≥ 1.4 mm. |
| `hex-honeycomb` | planned | `hex-lattice.ts` already computes flats. Wire as a lid pattern enum, same soffit. |
| `frustum-hex` | planned | 45° inward chamfer cells. Min web 1.2 mm. No fillets on rims. |
| `solid-lid` | planned | Skip the field. Keep lip, sockets, chamfer. |
| `slot-vents` | planned | Zero 2 W heat. Keep GPIO cover unless the style changes. |

## Styles

| Id | Status | What it takes |
|---|---|---|
| `keychain-cover` | **shipping** | GPIO covered. CSI ribbon. NE paddle-eye. |
| `gpio-well` | planned | Open 40-pin well. New lid stack-up. Header clearance is a new number, not a guess. |
| `camera-hood` | planned | Separate STL. East window stays on the tray. |
| `tpu-bumper` | planned | Second body / second STL. Do not union TPU into the PLA tray. |

## Modifications

| Id | Status | What it takes |
|---|---|---|
| fastener, print-fit, HDMI, USB, keyring, north-label | **shipping** | Typed toggles. Zip name encodes them. |
| `sd-flap` | planned | Print-in-place only with a proven gap. Else skip. |
| `led-pipe` | planned | Activity LED. Pipe through the lid, not the PCB pocket. |
| `feet` | planned | Wells on the tray floor. Keep pegs. |

## Order (when the Zero pair has been printed)

1. **P0** — keep this family honest (print gate B, thick-plug calipers).
2. **P1** — `hex-honeycomb` as a pattern toggle (same device, same style).
3. **P2** — `pi-zero-w` antenna keepout (same envelope).
4. **P3** — `gpio-well` style **or** `pi-zero-2w` vents — pick one, not both in the same PR.
5. **Later** — Pico as a new family, camera hood as a third STL.

## Done looks like

- Harness gold still passes for `pi-zero`.
- New slot has its own millimetre table or generator, plus a test.
- Zip / PRINT.txt name the device.
- Preview still keep-last-good. No CSG on the viewport path.
