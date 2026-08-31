# Case design (print)

Two-piece FDM case for **Raspberry Pi Zero** ([RP-008365](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf), 65×30). Units **mm**. **Not Zero 2 / 2W.**

| Drawing | |
|---|---|
| Board (gospel) | [RP-008365-DS-1](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008365-DS-1-raspberry-pi-zero-mechanical-drawing.pdf) |
| Official case (envelope) | [RP-008362-DS-1](https://pip-assets.raspberrypi.com/categories/579-raspberry-pi-zero/documents/RP-008362-DS-1-raspberry-pi-zero-case-mechanical-drawing.pdf) |

Official molded case: **79.00 × 37.70 × 12.13**, wall **0.80**, GPIO well **62 × 23**.  
We take **width 37.70**, **assembled height 12.13**, and the GPIO well. Length stays **70**. Wall stays **1.6** (FDM).

## Why this shape exists

A Zero case is a **shell**, not a sculpture:

- Solid floor, 1.6 mm walls, four pegs on the official holes
- Framed **windows** in the walls (not open-top slots, not floor trenches)
- Voronoi lid over GPIO + airflow (not a 62×23 punched rectangle)
- Four **10×2.0 mm** floor slots (light. Original Pi Zero — no extra chimney.)

## Envelope

| | mm |
|---|---|
| Outer L×W | **70 × 37.7** — lid and tray body flush |
| Corner R | **3.2** |
| Tray height | **9.98** (`LID.trayH`) |
| Lid plate | **2.15** + lip **1.5** down |
| Assembled | **12.13** (= 9.98 + 2.15) |
| Wall | **1.6** (official 0.80 will not print on 0.4 mm nozzle) |
| Board pocket | 65×30 with **0.4** on south/west; extra width dumped **north** for GPIO |
| Floor | **1.5**, plus four **10×2.0** intakes |
| Outer edge | **0.80 × 45° chamfer** — lid **top** outer, tray **bottom** outer. Mating faces **square**. |
| Port rims | **0.54 × 45° chamfer** both faces of each window (HDMI, USB, SD, CSI). |
| Lattice hole rims | **R0.80** — same number, inside every Voronoi cell. Echoes the outer chamfer. |
| Soffit | E/W **8.36 mm** (pegs in the bezel). N/S **2.64 mm** — maxed to the same outer rim on both long walls. |
| Port flare | **0.35** on the outer skin only |

Lid and tray outer envelope match except a floor-level circular pad-eye on the tray’s CSI + GPIO corner. Lid lifts straight off.

## Board (RP-008365) — top view is gospel

PCB **65 × 30 × 1.4**, corners **R3.0**, holes **Ø2.75 ± 0.05** at **3.5** from each edge, spacing **58 × 23**. Dimension **29** on the drawing is `58/2` (centre at 32.5).

`boardOrigin()` (SW of PCB): **(-33.0, -16.85)**  
Holes: `(-29.5, -13.35)`, `(28.5, -13.35)`, `(-29.5, 9.65)`, `(28.5, 9.65)`

| Port | Drawing | Window (default Thick, case mm) |
|---|---|---|
| Mini HDMI | centre **12.4** from left, shell 11.2 + fat pad | x **-28.70 … -12.50** (16.2 wide), z **1.72–8.66** |
| USB power | centre **41.40** | x **2.88 … 13.92** (11.0 wide), z **1.72–8.66** |
| USB OTG | centre **54.00** | x **15.48 … 26.52** (11.0 wide), z **1.72–8.66** |
| microSD | **16.9** from the HDMI/south edge | west wall y **-6.75 … 6.85**, z **3.90–7.00** |
| CSI | east short edge | east wall y **-8.50 … 9.60**, z **3.90–7.00** |
| GPIO | north long edge, header **4.73** tall | through the lattice; lip stays outside the pins |

Slim (jack + 0.6 mm/side): HDMI **12.4 × 4.0**, USB **9.2 × 3.2**. USB-IF 8.5 mm overmold height will not fit. Numbers come from `portWindows()` / `sideWindows()` — locked in `voronoi-lid.print.test.ts`.

HDMI used to be a 6.8–20.5 “shield span” centred at **13.65**. That was **1.25 mm** toward the USBs. Use **12.4**.

## Pegs / screws

Snap tray: four **Ø2.16** pins, **11.53 mm** tall (`LID.pegH`), on the official holes. Through the Pi’s Ø2.75 and **~1.5 mm into lid sockets**. Tapered tips. Locates the board **and** the lid.

| Mode | Tray | Lid | Hardware |
|---|---|---|---|
| Snap | tall Ø2.16 pins | sockets Ø2.40 / 2.56 / 2.80 by fit | none — pegs + lip |
| Screw | short Ø3.6 bosses, **Ø2.3** pilots | clearance **Ø3.0** (standard) | **M2.5 × 8** pan-head |

Print-fit presets: `lipClear` 0.12 / 0.22 / 0.34 and `screwClearR` 1.4 / 1.5 / 1.7.

## Status

**Nobody has printed this cut.** First pair is a fit article. GPIO is a **cover** — no HATs, unpopulated header only. East CSI is a **ribbon window**, not a camera case. Mini HDMI default is **Fat** (chunky molded plugs); **Normal** is the drawing pad only.

## Keyring

Teardrop paddle-eye on the **tray NE corner** (CSI + GPIO). Floor-level, T = 3.0, hole Ø7. Dry-fit a CSI ribbon before you call it camera-ready — we do not.

## Snap

Pegs through the Pi holes still locate the board and enter lid sockets. HauntFreaks taught the click: four **R0.45 nubs** on the tray inner rim catch the lid lip (~0.23 mm overlap at Standard). Pegs get a short **ridge** at the socket mouth.

## North wall text

Embossed on the **GPIO / north** elevation (no ports). Default string **ERGO**.

| | |
|---|---|
| String | ERGO (custom, A–Z 0–9, 12 chars) |
| Cap height | 6.0 mm (7.0 would not clear lid split + floor keep-outs on a 10 mm tray) |
| Stroke | 1.10 mm |
| Raise | 0.70 mm from a 0.40 mm recessed plaque |
| Field | centered on the north wall, z ≈ 1.9 to 8.0 |

I/O wall and SD wall are untouched.

## Lid (Voronoi)

Keep the pattern. Do not replace with a solid plate or a 62×23 GPIO hole. Generator: [`voronoi-lid.ts`](../src/lib/voronoi-lid.ts). Contract: [LATTICE.md](LATTICE.md).

**GPIO is covered. No HATs. Unpopulated header only.** A populated 40-pin is ~8.5 mm off the PCB; the lid plate starts at z 9.98. Pins would hit the lattice. This is a keychain cover, not a HAT case.

| | |
|---|---|
| Soffit E/W | **8.36 mm** (pegs sit in the bezel as islands) |
| Soffit N/S | **2.64 mm** — maxed to the same outer rim on both long walls |
| Lattice web | **1.5 mm** (0.4 mm nozzle, 3 perimeters) |
| Punch | **offset-convex** only — no centroid-scale, no overlapping holes |
| Soffit | Solid frame. Pegs are local islands. E/W **8.36 mm**, N/S **2.64 mm**. |
| Slivers | culled (area < 9 mm² or inradius < 1.32 mm), then retessellated |
| Scale | **1.5×–2×** (2× default = **52 cells**, web ≥ 1.4 mm; 1.5× = 87 cells) |
| Hole rims | **R0.80** |
| Lip | 1.5 deep × 0.85 thick, clearance 0.22 standard |
| Screw pads | Voronoi-clipped, not round islands |

Print **lip-down**, no supports. Pattern scale is visual; the STL always has the full lattice (`LATTICE_MAX_EDGES = 2048`).

## Print

- PLA or PETG, **0.20 mm**, **0.40 mm** nozzle, **3 walls**, 20% infill
- Tray **floor-down** (chamfer and pegs on the bed)
- Lid **lip-down**
- First print: **Standard** fit. Tight only on a calibrated printer
- Check the first layer around the NW torus

## Regenerating the tray

```bash
python3 scripts/build-tray.py
```

Writes snap + screw STL **and** GLB. Then bump `trayPreviewUrl()` (`?v=case362` today).

Python `L, W, H` **must** match `LID.length`, `LID.width`, `LID.trayH`.

Do not:

- Difference huge boxes through the cavity
- Add outer port bezels
- Chamfer the rim the lid sits on
- Put the ring through the board pocket
- Mill the floor for SD
- Open-top the south ports
