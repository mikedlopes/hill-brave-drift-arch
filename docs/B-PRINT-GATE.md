# B — print gate

I cannot run a printer from this sandbox. This page is the **CAD dry-fit** of the first-article pair. Plastic column stays empty until you print it.

Locked in `src/lib/print-gate-b.ts`.

## Pair

| | |
|---|---|
| Zip | `pi_zero_case_1_40x_snap_hdmi-fat_usb-fat_lug.zip` |
| STLs | [`public/prints/`](../public/prints/) — lid + tray + `PRINT.txt` |
| Options | Snap · Standard · Thick HDMI · Thick USB · Keyring on · 2× |
| Slice | PLA, 0.4 mm nozzle, **0.20 mm**, **3 walls**, **20%**, **no supports** |
| Pose | Tray floor-down. Lid lip-down. Unzip two STLs — do not print the zip. |

## Checklist

| # | Test | CAD | Plastic | mm |
|---|---|---|---|---|
| 1 | Board on four pegs, no scrape on south I/O | **pass** | | peg Ø2.16 through Ø2.75 (0.29 mm radial). 1.55 mm into lid. HDMI centre 12.4. Lip above PCB. |
| 2 | SD inserts/ejects without opening the case | **pass** | | west 13.60 × 3.10, centre 16.9 from south. Card can stand ~1.2 mm past the wall. |
| 3 | Fat mini-HDMI seats | **pass** | | 16.2 × 6.9. Not plug-tested. |
| 4 | Both micro-USB seat | **pass** | | 11.0 × 6.9 each. HDMI–USB wall 15.38. USB–USB wall **1.56** (tight). 8.5 mm overmold height will not fit. |
| 5 | Lid snaps, 10 cycles | **pass** (geometry) | | nubs Ø0.90, socket Ø2.56, peg clear 0.40. Cycles = plastic only. |
| 6 | 25 mm split ring, no neck crack | **pass** (geometry) | | NE paddle, hole Ø7.0, T 3.0, bulb Ø14. Not on SD. Crack = plastic only. |
| 7 | CSI ribbon exits east | **pass** | | east 18.10 × 3.10, sill z 3.90. Ribbon runs **0.90 mm above** the 3.0 mm lug plate. Not a camera housing. |

Watch in plastic: **USB–USB 1.56 mm wall**, **snap cycles**, **lug neck**, **HDMI overmold**.

Write failures back in millimetres. Do not start C on a failed row.
