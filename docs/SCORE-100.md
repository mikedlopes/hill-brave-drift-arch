# 78 → 100 — work through in order

Current overall: **78**. Software S2–S3 is in the repo. **S0 is still the score lock** — no printed pair.

**100 is not a UI polish number.** A case scores 100 when a stranger can print the default zip, drop in a Pi Zero, plug fat HDMI + two micro-USB, eject the SD, hang a split ring, snap the lid ten times, and nothing is a lie on the listing.

Check a box only when the test in the row is green. Do not skip S0.

Related: [HANDOFF.md](HANDOFF.md) · [CASE.md](CASE.md) · [ROADMAP.md](ROADMAP.md)

---

## Score map

| Band | Score if done | What it actually is |
|---|---|---|
| S0 First article | 78 → 90 | Plastic exists. CAD stops being a guess. |
| S1 Fit lock | 90 → 94 | Ports, snap, lug measured on *this* printer. |
| S2 Viewer truth | 94 → 97 | Preview never lies, never hangs, first orbit < 2 s. |
| S3 Listing & pack | 97 → 99 | Stranger can use it without us in the chat. |
| S4 Proof | 99 → 100 | Second printer, second filament, no surprises. |

You cannot skip S0 and buy points with banners.

---

## S0 — first article (78 → 90)

Print the **shipping zip only**. Do not tune lattice, lug, or ports until this pair exists.

Default: `pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug.zip`  
Slice: 0.20 mm · 3 walls · 20% · no supports · tray floor-down · lid lip-down · PETG preferred, PLA acceptable.

- [ ] **S0.1 Dry fit, no board**  
  Lid drops onto tray, four pegs find four sockets, nubs click, lid lifts straight off. No grind on the lip.  
  Fail → Standard lipClear 0.22 is wrong for that printer. Try Loose before touching nub R.

- [ ] **S0.2 Board in tray**  
  Pi Zero (RP-008365) sits on four pegs. PCB does not scrape the south I/O wall. GPIO is unpopulated.  
  Fail → peg Ø or board origin, not “scale the case.”

- [ ] **S0.3 Ports with real cables**  
  Fat mini-HDMI seats. Two micro-USB seat. SD inserts and ejects without opening the case. CSI ribbon can leave east above the paddle.  
  Caliper the plugs. Write the numbers into `plug-library.ts`. Thick/Slim become measured, not catalogue.

- [ ] **S0.4 Snap cycle**  
  10 open/close. Nubs still catch. No cracked socket, no rattle.  
  Fail → nub R 0.45 too proud or too shy. Change R, not the Voronoi.

- [ ] **S0.5 Lug**  
  25 mm split ring through Ø7. Hang with SD pointing up, not at the floor. Neck does not crack.  
  Fail → plate T or neck, not a new archetype.

- [ ] **S0.6 Heat soak**  
  Board powered 30 min in the case. Lid still removable. No cooked SoC smell. This cut is a **cover**, not a heatsink. If it cooks, that is a new style (`slot-vents`), not a lattice density tweak.

When S0 is ticked, flip the listing: “First article printed” + printer / filament / the one number that moved. Score **90**. Until then, leave “Nobody has printed this cut.”

---

## S1 — lock millimetres from that pair (90 → 94)

- [ ] **S1.1 Plug library**  
  Replace catalogue HDMI 16.2×6.9 / USB 11.0×6.9 with calipers from S0.3. Keep Slim as a second measured plug, not a guess 1 mm smaller.

- [ ] **S1.2 Snap table**  
  Confirm Standard is the daily default. If Loose was required, say so on the listing. Nub R stays 0.40–0.50. Fit does not scale nubs.

- [ ] **S1.3 Envelope photo**  
  Assembled pair next to a ruler. 70 × 37.7 × 12.13 should read. If it doesn’t, elephant-foot / chamfer — compensate in slice notes, do not scale XYZ.

- [ ] **S1.4 Gate B plastic column**  
  `print-gate-b.ts` plastic stays `unknown` until S0. Fill pass/fail from the pair. Cad already closed.

---

## S2 — viewer is the product (94 → 97)

The configurator is a lie if the canvas is black.

- [x] **S2.1 First orbit < 2 s**  
  Shell on frame 0. Baked GLB swap (decode once, warmup from the viewer). Last-good never blanked. Full-screen loader only if nothing is orbitable after 700 ms.

- [x] **S2.2 Option rebuilds do not hang**  
  Debounce 160 ms lattice / 80 ms toggles. Cancel in-flight. Last-good stays. Corner “Updating” chip, not a covering spinner.

- [x] **S2.3 Isolated parts**  
  Lid camera from slightly under so sockets read. Tray looks into the cavity (pegs). Assembled stays NE iso.

- [x] **S2.4 Preview === print topology**  
  Same cell count, same hole rims. Preview may drop curve segments only. Test: `preview and print share Voronoi topology`.

Score 97 only if a cold load on a mid laptop and on Brave-with-Shields-down both orbit.

---

## S3 — stranger can finish (97 → 99)

- [ ] **S3.1 One-screen panel**  
  No scrollbar at 1024×800. Looks open. Print pair still the only primary.

- [x] **S3.2 PRINT.txt matches the pair**  
  Layer / walls / pose / “unzip two STLs” / license / first-article checklist. README.txt in every zip.

- [x] **S3.3 Listing copy**  
  GPIO cover. No HATs. CSI ribbon, not a camera. Zero only, not 2W. Personal hobby, no selling prints. Raspberry Pi is a trademark.

- [x] **S3.4 Contact**  
  Takedown: Grok Build listing. No email invented. Terms §7.

- [x] **S3.5 Save zip fallback**  
  After Print pair, Save zip stays on the dock with a blocked-click note.

---

## S4 — 100

- [ ] **S4.1 Second printer**  
  Different machine, same zip. Fit still Standard or we document the delta.

- [ ] **S4.2 Second filament**  
  PETG and PLA. Snap still 10 cycles on both, or we say PLA-only.

- [ ] **S4.3 Kill remaining lies**  
  No “ready for daily carry” until S4.1–S4.2. No Zero 2 / Pico / HAT in the UI.

100 = two printers, two filaments, listing still true.

---

## Do not spend points here

These do not raise the score. They reset it.

- Voronoi on tray walls, soffit, or lug collar
- Lattice under 1.5×
- Scaling this envelope for Pi 3 / 4 / 5 / Pico
- GPIO well or camera hood on this style
- Recoloring the mesh to chrome `#FF5E18`
- CSG on the viewport path
- New banners before S0

---

## Suggested order for the next chat

1. S0.1–S0.5 on the default zip (you, one printer).  
2. S1.1–S1.4 with the calipers from that pair.  
3. S2 only if the canvas misbehaves on that same session.  
4. S3.4 contact line.  
5. S4 when a second machine exists.

Until S0 is green, the honest score stays **78**.
