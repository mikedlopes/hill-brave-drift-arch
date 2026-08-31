# Case format

This repo is one **shipping family**: a Raspberry Pi Zero keychain cover with a truncated-CVT Voronoi lid. Format **v2** locks hole rims to R0.80, outer envelope to **0.80 × 45°**, nubs to **R0.45**, and the skin split (lid through-cut / tray floor deboss / walls smooth).

The format is the thing to clone. New boards, patterns, styles, and mods plug into the same slots. They do **not** start by editing Pi Zero millimetres.

Gold file: [`harness-snapshot.json`](harness-snapshot.json). Builder: [`src/lib/format-harness.ts`](../src/lib/format-harness.ts). Test: `src/lib/format-harness.test.ts`. Dump: `npm run harness`.

## Shipping tuple

| Slot | Id | Rule |
|---|---|---|
| Device | `pi-zero` | RP-008365. PCB 65 × 30. Holes Ø2.75 at 3.5, span 58 × 23. |
| Envelope | 70 × 37.7 × 12.13 | Wall 1.6. Flush lid/tray. Not official 79 mm. |
| Pattern | `truncated-cvt-voronoi` | Relaxed Voronoi on the **lid window** (through-cut) and **tray floor** (0.42 mm deboss). Lid frame + tray walls **smooth**. Poisson min-distance = spacing, clip to Ω, **2 Lloyd**, jitter 6–16%, sliver cull, **offset-only** punches. Hole rims **R0.80**. Looks 1.5×–2× (default 2× = **52 cells**, web ≥ 1.4 mm). |
| Style | `keychain-cover` | GPIO covered. No HAT. CSI is a ribbon window. NE paddle-eye on the tray. Filament `#e24a1c`. |
| Finish | `finish.*` in gold | Outer **0.80 × 45°**. Ports **0.54 × 45°**. Snap nubs **R0.45**. Bake `c80w150h80v47`. |
| Mods | snap/screw · fit · HDMI · USB · keyring · ERGO | Defaults: snap, standard, thick HDMI, thick USB, keyring on, 2×. Print-fit does **not** scale nubs. |

Zip: `pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug.zip`.

## How a family is built

```
device millimetres  →  envelope + port windows
pattern             →  lid field (and optional tray relief)
style               →  GPIO / HAT / camera / lug language
mods                →  toggles that do not retarget the board
print               →  two STLs + PRINT.txt, never the preview mesh
```

Code split (do not collapse):

| Piece | File |
|---|---|
| Numbers | `src/lib/case-params.ts` |
| Lid | `src/lib/voronoi-lid.ts` |
| Tray | `src/lib/tray-body.ts` |
| Lug | `src/lib/keyring.ts` |
| Viewer | `src/components/case-canvas.tsx` |
| UI | `src/routes/index.tsx` |

## Adding something

1. Open [`ROADMAP.md`](ROADMAP.md). Pick a slot with status `planned` or `same-envelope`.
2. **Do not** change `pi-zero` millimetres to make a Pico or a Pi 4 fit.
3. New device = new millimetre table + new envelope. Copy the format, do not scale this one.
4. New pattern = new generator behind the same lid envelope. Keep `SCALE_MIN = 1.5` unless you re-prove webs ≥ 1.2 mm. Do not reintroduce centroid-scale punches or half-spacing Poisson on this field.
5. New style = new lid/tray features, not a Boolean on the committed STL.
6. New mod = a typed toggle in `case-params.ts`, persisted in `saved-builds.ts`, encoded in the zip name.
7. Run `npm run harness` and `npm test`. Update the gold JSON if the shipping tuple actually changed.

## Forbidden

- Scale a Pi 3/4/5 case down, or this case up.
- Lattice under 1.5×.
- HAT well on this style.
- Camera housing (ribbon window only).
- Claiming Zero 2 / 2W until that device slot ships.
- Boolean-carving `bottom.stl` in a REPL.
