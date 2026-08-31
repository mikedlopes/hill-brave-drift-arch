# Enclosure improvements — work through in order

Source: [ENCLOSURE-REVIEW.md](ENCLOSURE-REVIEW.md). Check a box only when CAD + a print-fit test (or first-article note) match. Do **not** boolean-carve the committed tray STL in a REPL.

Target: Zero 2 W keychain. GPIO stays covered. Voronoi lid stays.

---

## P0 — do not ship until done

### 1. Floor intakes for Zero 2 W

Low air in, lattice out.

- [x] Four floor slots **10 × 2.0 mm**, R0.9
- [x] Centres `(-8,-5.4)`, `(6,-5.4)`, `(-8,-1.2)`, `(6,-1.2)`
- [x] Keepout around pegs and key donut
- [x] `LID.ventL / ventW / ventR` in [`case-params.ts`](../src/lib/case-params.ts)

### 2. Honest docs

- [x] [CASE.md](CASE.md) soffit **5.2** all sides (not 5.0 / 2.5)
- [x] Key is a **Voronoi donut** at NW, not a torus
- [x] Floor vents listed in the envelope table

---

## P1 — print and heat (this pass)

### 3. Port mouth flare

Skin opening **0.35 mm** larger per side than the liner so the jack is recessed, not a raw hole.

- [x] `addPortHoles(shape, face, flare)`
- [x] Liner flare **0**, outer skin flare **0.35**
- [x] Mating lid land still square

### 4. South-skirt chimney

Intakes in the **south wall**, below the HDMI/USB mouths (z 0.45–2.15), so Zero 2 W can pull air without a sealed brick.

- [x] Three 2 mm-tall slots: west of HDMI, between HDMI and USB power, east of OTG
- [x] Webs ≥ 2 mm to port windows
- [x] Skip Voronoi over those slots

### 5. Screw bosses (optional path)

- [x] Snap peg bosses stay **Ø3.6** (`R 1.8`)
- [x] Screw bosses **Ø5.0** (`R 2.5`) — stronger self-tap, still not a 7 mm heat-set (that is a remix)

---

## P2 — remixes

### 6. LED pipe

- [x] 2.8 × 1.6 mm window on the south wall, west of HDMI, aligned with the west skirt slot
- [x] z starts at PCB top + 0.2 (activity LED on Zero / 2 W)

### 7. GPIO well lid 62×23 — **not on the default lid**

Official well is **62 × 23**. Our lattice window is ~59.6 × 27.3. Punching 62 mm eats the soffit and kills the Voronoi keychain.

Fusion remix (separate STL):

1. Duplicate lid. Delete Voronoi holes.
2. Sketch rectangle **58 × 21**, centred **2 mm north of board centre** (GPIO is the north edge).
3. Extrude-cut through 2.15. Outer frame stays 5.2 south/east/west, thinner north.
4. Print as `pi_zero_gpio_lid.stl`. Do not ship as default.

### 8. Camera puck

CSI window already in the east wall (z to PCB top + 2.85). Glue-on puck:

```scad
difference() {
  rounded_cube([18, 8, 4], r=1.2);
  translate([0, 1.2, 1.4]) cube([16.5, 3, 3], center=true); // ribbon
}
```

Print on the 18×8 face. Super-glue to the east wall over CSI. Not booleaned into the tray.

### 9. M2.5 heat-set

- [x] Screw-mode boss **Ø7.0** (`screwBossR 3.5`)
- [x] Insert bore **Ø3.7** (`insertR 1.85`)
- Snap pegs unchanged Ø3.6 / Ø2.16

Insert: M2.5 × 4–5 mm brass, 220 °C iron. Lid clearance stays Ø3.0.

### 10. 2020 T-slot mount

- [x] Separate STL [`src/lib/mount-2020.ts`](../src/lib/mount-2020.ts)
- [x] 40 × 20 × 5 plate, M3 at ±10, M4 T-nut centre
- [x] UI: “2020 T-slot mount (separate)”
- Print flat, PETG, 3 walls. Bolt to extrusion; case sits on it — **no holes through the PCB pocket**.

---

## Do not

- Scale a Pi 4 case
- Cover the SD-end antenna with carbon or a solid metal-effect lid
- Trap the SD card
- 0.1 mm FDM clearances
- True cantilever snaps in PLA (pegs + lip stay)
