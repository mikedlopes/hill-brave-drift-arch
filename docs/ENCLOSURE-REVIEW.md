# Enclosure review — Pi Zero Voronoi keychain case

Board law: [RP-008365](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf).  
Envelope reference: [RP-008362](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008362-DS-1-raspberry-pi-zero-case-mechanical-drawing.pdf).  
CAD: [`src/lib/case-params.ts`](../src/lib/case-params.ts), [`tray-body.ts`](../src/lib/tray-body.ts), [`voronoi-lid.ts`](../src/lib/voronoi-lid.ts).

Target locked (user silent): **Zero 2 W**, unpopulated header, PETG primary / PLA OK, snap + optional M2.5, SD hot-swap, CSI escape, **no HAT**, compact jewelry look.

---

## 1. Intake

**Variant:** Zero / Zero W / Zero 2 W / WH (same 65×30). Header **unpopulated**. Camera ribbon optional through east window. No HAT.

**Coordinates (CAD):** mm, origin at case XY centre, **+Z up from bed**. Connector long edge is **south**. SD **west**, CSI **east**, GPIO **north**. Canvas rotates the group `[-π/2,0,0]` for orbit only.

`boardOrigin()` SW of PCB = **(-33.0, -16.85)**. Extra width dumped north.

**On the model today**

| Feature | Where |
|---|---|
| Base (Tray) | Rounded rect 70×37.7×9.98, wall 1.6, floor 1.5, bottom chamfer 0.32 |
| Lid | Voronoi plate 70×37.7×2.15, soffit 5.2, lip 1.5×0.85, top chamfer 0.32 |
| Standoffs / pegs | Four at CTC 58×23, Ø2.16 × 11.53 snap; screw mode Ø2.3 pilots |
| Ports | South HDMI/USB/USB; west SD; east CSI — wall windows, floor solid |
| Clip | Friction lip + pegs (not a true cantilever snap) |
| Boss | Screw mode only, small |
| Window | Voronoi cells = RF/thermal/GPIO cover |
| Skirt | None |
| Chimney | Four 10×2 floor slots (Zero 2 W intake) as of this review |
| Antenna | Plastic lid + open cells |
| LED | No dedicated pipe |

**Mismatch vs official:** we are **70** long not 79. Wall **1.6** not 0.80 (FDM). GPIO is **lattice**, not a 62×23 well. PCB modeled **1.4** thick (drawing stack; bare PCB ~1.0).

---

## 2. Critique

| Axis | Score | What a 5 would be |
|---|---|---|
| Fit | **4** | 0.4 mm pocket is honest snug. Pegs hit Ø2.75. Risk: PLA shrink → Standard 0.40 mm peg clearance. Measure first print. |
| Access | **4** | SD hot-swap from floor. HDMI/USB pad 1.4 mm/side (cable bulk, not just jack). CSI east. GPIO **covered on purpose**. |
| Thermal / RF | **3** | Voronoi exhaust is real. Floor was sealed — **now four 2.0 mm intakes** under the SoC zone. Still no dedicated chimney up the south skirt. Antenna is plastic, not a Faraday cage; do not print carbon-filled. |
| Print / strength | **4** | Lid lip-down, tray floor-down, no supports. Wall 1.6. Screw bosses undersize for heat-set (OD ~3.6 vs ≥7). Pegs are locators, not clips. |
| Aesthetics / UX | **4** | Continuous 3.2 R, 0.32 outer chamfer, Voronoi on lid and tray. Port mouths still a bit “punched.” |

This is a **two-piece shell**. Do not scale a Pi 4 case down. Do not punch a HAT well unless asked. There is no keyring.

---

## 3. Intent lock (defaults)

- Zero 2 W, optional soldered header **pins only**, no HAT.
- PETG primary, PLA compatible.
- Snap-fit pegs + lip; screw path is M2.5 self-tap or heat-set as a **remix**.
- SD hot-swap, both micro-USB, mini HDMI, CSI ribbon, GPIO covered.
- Look: compact, jewelry, Voronoi. Not a brick.

---

## A. Design thesis

This case is a **65×30 Zero in a 70×37.7 FDM shell** with a Voronoi lid that is the product, not a vent sticker. Pegs through the official holes locate the board and the lid. The lip is a slip fit, not a click-hook — that is honest for PLA strain. Extra envelope goes **north** so HDMI stays on drawing 12.4. GPIO is a **cover**; say so. Zero 2 W needs **low intake**; four 2.0×10 floor slots under the SoC do that without reprinting the lid. Antenna lives at the SD (west) end — keep that wall plastic and the lattice open. Beauty is consistent 1.6 mm walls, 3.2 R, and 0.32 mm outer chamfers on skins only; mating faces stay square.

## B. Envelope and stack-up

| | mm | Note |
|---|---|---|
| Outer L×W | 70.0 × 37.7 | Lid and Base flush |
| Outer H assembled | 12.13 | 9.98 + 2.15 |
| Inner cavity XY | 66.8 × 34.5 | wall 1.6 |
| PCB | 65 × 30 × ~1.4 | 0.4 mm south/west clearance (snug press) |
| Standoff | 1.25 | ≥ SD cage 1.25 |
| Floor | 1.5 | bed face |
| Lid plate | 2.15 | lattice 1.35 webs |
| Lip | 1.5 deep × 0.85 | Standard gap 0.22 |
| Corner R | 3.2 | |
| Chamfer | 0.32 | outer skins only |

## C. Feature schedule

| ID | Type | Size / position | Print |
|---|---|---|---|
| HDMI | Base south | centre 12.4 from PCB west; window ≈ 14.0 wide; z 2.5–6.7 | wall window, no floor trench |
| USB PWR | Base south | 41.4 | same z |
| USB OTG | Base south | 54.0 | same z |
| SD | Base west | 16.9 from north; ≥12 wide; z from floor | hot-swap |
| CSI | Base east | 16.5+ pad; z at PCB top | ribbon escape |
| Peg / socket | 4× | CTC 58×23; peg Ø2.16; socket Ø2.56 Standard | snap |
| Screw | optional | lid Ø3.0, tray pilot Ø2.3 | M2.5×8 pan |
| Floor vents | 4× | 10×2.0 R0.9 at (-8,-5.4), (6,-5.4), (-8,-1.2), (6,-1.2) | through floor |
| Antenna | west/SD + lid cells | no metal/carbon | — |
| LED | none | remix: 1.2×3 slot south of HDMI | — |
| GPIO | lid lattice | covered, 4.73 header will hit plate | no HAT |

## D. Parametric values

```
L=70  W=37.7  H_tray=9.98  t_lid=2.15  wall=1.6  floor=1.5
corner=3.2  chamfer=0.32  boardClear=0.4  standoff=1.25
frame=5.2  lattice=1.35  lipClear=0.22  lipDepth=1.5  lipThick=0.85
pegR=1.08  socketR=1.28  pegH=11.53
ventL=10  ventW=2.0  ventR=0.9
holeOx=3.5  holeOy=3.5  holeSx=58  holeSy=23
```

Print-fit: Tight / Standard / Loose → `lipClear` 0.12/0.22/0.34, `socketR` 1.2/1.28/1.4.

## E. CAD operations (Fusion / Onshape / FreeCAD)

1. XY plane sketch: rounded rectangle 70×37.7 R3.2. Extrude Base 9.98. Shell 1.6, leave floor 1.5.
2. Inner pocket: offset PCB 65×30 from SW **(wall+0.4)**; dump leftover **north**.
3. Four Ø2.16 cylinders on 58×23, height 11.53, 0.18 taper last 1.2. Or Ø2.3 holes + Ø3.6 bosses for screw.
4. South wall: three rectangular cuts, centres 12.4 / 41.4 / 54 from PCB west, pad 1.4/side, z from PCB top−0.4 × 4.2. Outer 0.32 chamfer on skin only.
5. West: SD slot from floor, 16.9 from north, width ≥12. East: CSI at PCB top, width ≥16.5+0.8.
6. Floor: four rounded slots 10×2.0, centres `(-8,-5.4)`, `(6,-5.4)`, `(-8,-1.2)`, `(6,-1.2)`. Web ≥2 mm to pegs.
7. Lid: same outer sketch, extrude 2.15. Inner offset 5.2 = Voronoi well. Poisson Voronoi, inset 0.675, web 1.35. Lip down 1.5 with 0.22 clearance. Blind sockets Ø2.56 × 1.55, 0.6 skin.
8. Fillet 0.6–1.0 on outer verticals if the 3.2 R is not enough; **do not** chamfer the lid/tray mating land.

## F. OpenSCAD-sized sketch (vents)

```scad
module floor_vents() {
  for (p=[[-8,-5.4],[6,-5.4],[-8,-1.2],[6,-1.2]])
    translate([p[0], p[1], -0.1])
      linear_extrude(2)
        offset(r=0.9) square([10-1.8, 2-1.8], center=true);
}
```

## G. Print + finish

| | Lid | Base |
|---|---|---|
| Pose | lip **down**, lattice up | floor **down** |
| Supports | none | none |
| Nozzle / layer | 0.4 / 0.20 | same |
| Walls / infill | 3 / 20% | 3 / 20% |
| Material | PETG (Zero 2 W heat) or PLA | same |
| First layer | outer chamfer 0.32 sits on bed | same |

## H. First-article checklist

1. Dry fit PCB: seats on four pegs with finger pressure, no bow.
2. Mini-HDMI, both micro-USB **plugged** (not just jack body).
3. microSD insert/remove **lid on**.
4. CSI ribbon can leave east window.
5. Lid: pegs enter blind sockets; lip does not scrape GPIO pins (unpopulated).
6. Snap cycle ×20 — if PLA lip cracks, switch PETG or Loose fit.
7. Heat soak Zero 2 W 15 min at load — SoC under 80 °C or add the south-skirt chimney remix.
8. Wi-Fi RSSI vs bare board: drop < 3 dB; if worse, stop using carbon PETG.

## I. Remix roadmap (separate STLs)

| Cut | Why |
|---|---|
| **GPIO lid** | 62×23 well, 8.5 mm header; kills keychain thesis |
| **Camera lid** | CSI strain-relief slot + optional Zero cam puck |
| **Heatsink lid** | Cut lattice over SoC only; Zero 2 W SoC ≠ Zero W |
| **LED pipe** | 1.2×3 south of HDMI, 0.6 wall |
| **Heat-set bosses** | OD 7, M2.5 insert, 8 mm screw |
| **2020 / M3 mount** | Separate bracket under Base; do not drill the PCB pocket |
| **TPU feet** | 1 mm pads, not the whole Base |
| **Sealed look** | Skip floor vents; accept Zero 2 W throttle |

**Do not ship:** metal lid, carbon lattice over west/SD, 0.1 mm clearances, Pi 4 scaled down, HAT as default.

---

## What changed in CAD this pass

Floor of the Base: **four 10×2.0 mm rounded intakes** under the SoC zone. Lid, pegs, ports, Voronoi, key donut unchanged. That is the only change that earned its keep for Zero 2 W heat without touching the jewelry lid.
