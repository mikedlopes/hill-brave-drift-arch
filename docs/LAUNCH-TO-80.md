# 67 → 80 → 90

Today: **67** as a first-article configurator. **28** as a daily-carry case.

Software can get you to **~80**. **85–90 requires one printed pair.** There is no CAD trick that replaces that.

---

## A — to ~80 without a printer (software)

Do in order. Each item is one score-mover, not a vibe.

### A1. Docs match the mesh  *(docs 52 → 82, overall +4)*

[docs/CASE.md](CASE.md) port table still lists HDMI z **2.50–6.70** and SD z **1.35–3.45**. Code is floor-to-rim for Thick (~1.72–8.66) and a shorter jack window for Slim. [docs/STATUS.md](STATUS.md) still says NW torus and soffit 2.5/5.0; code is **NE paddle**, soffit **5.2**.

- [x] Generate the port table from `portWindows()` / `sideWindows()` (or paste once from a dump test)
- [x] Kill NW torus / old soffit / `scripts/build-tray.py` as source of truth
- [x] One status page: current defaults, honesty lines, print recipe

### A2. Preview must not blank  *(preview 64 → 78, overall +5)*

Still the launch-killer. Needed:

- [x] Keep-last-good already exists — prove it with a test that HDMI/USB/keyring swap never leaves `tray === null`
- [x] Baked GLB is **Thick + keyring on** only; option changes must not dispose the bake
- [x] If WebGL dies: controls + Print pair still work (Brave copy is there — screenshot it)
- [x] `frameloop="always"` (demand + orbit `change` hung the canvas; live loop restored)

### A3. STL is what the slicer gets  *(download 79 → 88, overall +3)*

- Print-path union/weld already runs on download. Add: binary STL triangle count + bbox assert vs `LID.length/width/trayH`
- One PrusaSlicer/Orca dry check in CI is optional; a **local** “open in slicer, 0 errors” note after A6 is the real gate
- Zip name already encodes hdmi/usb/lug — show that name under Save zip (we shortened it away)

- [x] `readBinaryStl` on live lid + tray buffers (envelope + lug)
- [x] Zip name on Save zip (A6)
- [ ] Local slicer eyeball — not CI

### A4. Ports: show the millimetres  *(ports 71 → 76, overall +2)*

Hover blurbs are long. Put **one mono line** on Ports: `HDMI 16.2×6.9 · USB 11.0×6.9` that updates with Thick/Slim. First-timers need the number, not the USB-IF essay.

- [x] `portMmLine()` on the Ports field-head

### A5. Honesty visible, not a whisper  *(honesty 86 → 90, overall +1)*

Header is `Unprinted cut · GPIO cover · CSI ribbon`. Fine for dense UI. Listing/OG/README must use the full sentences. Restore them on the Print pair dock as a single wrapped line.

- [x] Dock uses `PRINT.firstArticle` + gpio + csi

### A6. First-print recipe locked to the STL  *(FDM 75 → 80, overall +2)*

- Default download = Snap · Standard · Thick HDMI · Thick USB · Keyring on · 2×
- Filename and UI agree
- Add a 6-line `PRINT.txt` inside the zip

- [x] `printPairZipName` + `printSheet` in the zip; filename shown under Save zip (layer, pose, no supports, dry-fit order)

**After A1–A6: ~80.** Still unprinted. Listing is allowed. “Fits your Pi” is not.

---

## B — the print gate (80 → 85)

I cannot print from this sandbox. CAD dry-fit: [B-PRINT-GATE.md](B-PRINT-GATE.md). All seven **CAD** rows pass. Plastic is still open.

One PLA pair, 0.4 mm, 0.20 mm, 3 walls, 20%, no supports. Default options.

| Test | CAD | Plastic |
|---|---|---|
| Board drops on four pegs, no scrape on south I/O | pass | |
| SD inserts/ejects without opening the case | pass | |
| Fat mini-HDMI seats (the default window) | pass | |
| Both micro-USB seat | pass | |
| Lid snaps, lifts straight off, 10 cycles | pass (geom) | |
| Keyring takes a 25 mm split ring, no crack at the neck | pass (geom) | |
| CSI ribbon can exit east (or we keep calling it a window) | pass | |

Write failures into CAD **with millimetres**, not “a bit more clearance.”

**After a clean B: ~85.**

---

## C — Pi Zero freeze (not Zero 2 / 2W)

Plastic B is still open. This batch is **docs + library**, not new vents and not guessed Slim.

1. **Plug library** — Type C metal 10.42×2.42, Thick window **16.2×6.9**. Catalogue chunky 15×7.5 **height-fails**. USB-IF 8.5 **height-fails**. Grow Thick after calipers, never guess Slim.
2. **Snap force** — default stays snap, nub **Ø1.24**. If lid walks: **+0.1 mm** radius (`SNAP_NUB.grow`). Do not make screws the default.
3. **Heat** — **skip.** Original Pi Zero. Four floor slots stay as light. No extra 2W chimney.
4. **Watertight** — `printMeshHealth` on the print weld (triangle count). Slicer “0 errors” still a local eyeball.
5. **Docs freeze** — CASE.md / README / PRINT.txt: **Raspberry Pi Zero only**.

Skip: HATs, camera lid, 79 mm official length, lattice under 1.5×, WebGPU rewrite, Zero 2 W vents.

---

## Do not do (does not raise the grade)

- More Voronoi styles
- 2020 mount in the first-print UI
- Photoreal Pi
- Auto-rotate
- Another loader spinner
- Slim as default

---

## Sequence

| Batch | Items | Target |
|---|---|---|
| **Now** | A1 docs, A4 port mm, A5 dock honesty, A6 zip PRINT.txt | 72 |
| **Then** | A2 preview proof, A3 STL bbox | **80** |
| **Then** | B print + fit log | **85** |
| **Later** | C only on a passing pair | **90** |

Current batch if we proceed: **A1 + A4 + A5 + A6** (docs and listing truth, no mesh risk).
