# Four Sparks in two joined two-tier modules

Interactive preview: http://127.0.0.1:4186/rack-2x2.html

The rack is 492.8 W × 208 D × 166.5 H mm with four nominal 150 × 150 × 50.5 mm Spark envelopes. Each module supports two devices independently. Front and rear stay open. Two joining plates connect the inner feet at the front and rear, using four M4 bolts total.

## Print parts

| Part | Quantity | Print size, mm |
| --- | ---: | --- |
| Side frame | 4 | 150 × 208 × 12 |
| Shelf tray | 4 | 240 × 166 × 14 |
| Retaining key | 16 | 10 × 23.05 × 8 |
| Joining plate | 2 | 68 × 18 × 6 |
| Fit coupon | 1 first | Production tray joint samples |

Print the separate 3MF parts in millimeters, in their supplied orientations. All fit the H2S 340 × 320 × 340 mm volume with an 8 mm brim. The GLB assemblies are previews, not print jobs.

Start with ABS-GF and the matching H2S material profile, a compatible hardened nozzle, 0.20 mm layers, six walls, six top/bottom layers, 35% gyroid, and an 8 mm brim. Slice for your actual nozzle and plate. New parts have geometry checks but have not been sliced or physically tested. The joint coupon tests 0.4, 0.5, and 0.7 mm total allowance; the rack uses 0.5 mm.

## Assemble

Build each module from two frames, two trays, and eight keys. The tray shoulders seat against the inside frame faces. Keys slide down through the beam ends outside the frames. Vertical load rests on the frame mortises, not on the keys.

Set both modules on a level table, with centers 252 mm apart. At each end, place a joining plate over the inner frame feet. The two holes are 44 mm apart. Install four M4 × 20 mm bolts without washers and four M4 hex nuts in the underside recesses. Nut pockets are approximately 7.45 mm across flats and 3.5 mm deep. Check your actual nuts fit and that bolt tips do not extend below the feet. Do not overtighten. These plates keep the modules aligned; they are not lifting handles.

Four 4.6 mm holes in each side frame provide a 105 mm square mounting pattern for a standard 120 mm fan centered 84 mm above the desk. Use only the two outermost frames for fans. Verify the actual fan frame, fasteners, vibration isolation and finger guards fit before installation; fan hardware is not included in the geometry checks. Use a supply/controller matched to the fans. Fans are optional auxiliary airflow, and their cooling benefit has not been established. Leave them off initially to establish a thermal baseline.

Secure cables loosely beside the rear uprights with removable straps. Leave strain relief and the cable manufacturer's specified bend radius. Do not fill the gap between modules with power bricks. Keep all power supplies separately ventilated.

## Before loading computers

All four printable part types are closed, consistently wound, single solids. Each fits the H2S bed with the brim allowance, and the modeled assembly has no volume intersections. These checks do not prove load capacity, fit, creep resistance, or cooling.

Print the fit coupon first. Check device feet rest on tray ribs. Test each module with inert weights approaching 1.2 kg per tier and inspect for sag, cracks, rocking, or loose joints over 24–48 hours. Unload before moving or disassembling.

The shelf surfaces are 24 and 116 mm high, leaving 27.5 mm above the lower Spark to the upper tray. Chassis-to-frame clearance is 23 mm. NVIDIA calls for 100 mm front, 20 mm sides, and 400 mm rear clearance. The vertical stacking gap is a design choice, not an NVIDIA-validated clearance. Compare sustained-load temperatures against the existing setup before relying on it.

Sources: [NVIDIA hardware dimensions](https://docs.nvidia.com/dgx/dgx-spark/hardware.html), [NVIDIA clearance guide](https://www.nvidia.com/content/dam/en-zz/Solutions/dgx-spark/DGX-Spark-Quick-Start-Guide.pdf), [Bambu H2S](https://us.store.bambulab.com/en/products/h2s).
