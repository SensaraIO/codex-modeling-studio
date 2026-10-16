# Four-Spark freestanding rack for Bambu H2S

Designed for four NVIDIA DGX Sparks, one per level, with continuous printed side frames, removable one-piece trays, and rigid retaining keys. This is a **prototype with checked geometry and slicing**, awaiting a physical fit test, load test, and cooling check.

Open the interactive model at **http://127.0.0.1:4186/rack.html**. Choose With Sparks, Rack only, Exploded, or a print part; drag to orbit. The silver boxes are nominal device envelopes, not printable parts or detailed models of the vents and feet. The viewer uses the same boolean geometry as the print files. Its colors distinguish parts; one filament color is sufficient.

## Why your H2S suits this design

| H2S feature | Effect on this rack |
| --- | --- |
| 340 × 320 × 340 mm build volume | A complete 318 mm side frame prints flat, avoiding a structural joint halfway up. The 240 mm trays also print as single parts. |
| Active chamber heating up to 65°C | Supports the 60°C chamber setting in the installed Bambu ABS-GF H2S profile. |
| Nozzle up to 350°C | Ample range for the profile's 260°C first layer and 270°C subsequent layers. Do not print this material at the printer's maximum temperature. |
| Stock 0.4 mm hardened steel nozzle | Compatible with Bambu ABS-GF. These prepared projects and estimates use that nozzle. A 0.6 mm hardened nozzle is an alternative, but needs its own profile and a new fit test. |
| Servo extruder, optical motion calibration, filament detection | Helpful print controls, but not a guarantee of joint accuracy, adhesion, or structural strength. |
| Multicolor and optional laser | Neither is needed for the rack. It prints in one material and color. |
| 100–120 V version | Does not change the model dimensions. Use the electrical setup specified for your machine. |

This review uses the supplied printer specifications and the installed Bambu Studio H2S profiles; it is not an inspection of your physical printer or fitted accessories.

## Material choice

**Use Bambu ABS-GF for the frames, trays, and rigid keys.** The supplied comparison gives 2,860 MPa bending modulus and 99°C HDT, compared with 1,880 MPa and 87°C for ABS. Its stiffness is useful for these shelves. The keys have no flexible snap arms.

PC is also within the H2S's capabilities and has higher bending strength and HDT in your comparison. ASA is a reasonable alternative, particularly where UV exposure matters. Neither substitution has been sliced or fit-tested for this design. PLA Tough+ has good impact toughness, but its 61°C HDT in your table makes it my weaker choice for a rack carrying a constant load near warm computers.

**HDT is a short laboratory deflection test under a stated load, not a continuous-use temperature or a long-term load rating.** None of these material tables proves the finished rack's capacity. Geometry, layer direction, print quality, temperature, and time under load all matter.

Dry the filament according to Bambu's instructions for the actual spool and dryer. The ABS-GF product data lists 80°C for 8 hours in a suitable drying oven; that is a drying specification, not an instruction to use a kitchen oven or exceed a spool/dryer's rating. Use an appropriately ventilated printing area.

## Dimensions and capacity target

| Item | Dimension |
| --- | --- |
| Rack including retaining-key heads | 240.8 W × 208 D × 318 H mm |
| Height with the top Spark | 350.5 mm |
| Each Spark's nominal enclosure | 150 × 150 × 50.5 mm |
| Shelf surfaces above the table | 24, 116, 208, 300 mm |
| Clear gap above each lower Spark to the next tray | 27.5 mm |
| Centered Spark edge to inner side frame | 23 mm |
| Nominal device mass | 1.2 kg each; 4.8 kg total |

The 4.8 kg is the intended payload, **not a verified rack rating**. Power supplies are not included in that mass or mounted to this design. Put them separately where they can ventilate.

Keep the front and rear open, with cable slack. NVIDIA's quick-start guide calls for **100 mm front, 20 mm sides, and 400 mm rear clearance** around a Spark. The 27.5 mm vertical spacing is a design choice, not an NVIDIA-validated stacking clearance. Check temperatures and airflow with your workloads after mechanical testing.

## Print files and estimates

The `output/prepared/` files are Bambu Studio projects with the H2S/ABS-GF settings. Open as a project, verify your actual nozzle and plate, then slice in Bambu Studio. They contain **no pre-generated printer G-code**. The plain files in `output/` contain geometry for other slicers.

| Prepared project | Print quantity | Part/plate size | Material per print | Estimated time per print |
| --- | ---: | --- | ---: | --- |
| `fit-coupon-first-h2s-abs-gf.3mf` | 1 first | Five small test pieces | 41.61 g | 1 h 45 min |
| `side-frame-h2s-abs-gf.3mf` | 2 | 318 × 208 × 12 mm | 237.51 g | 8 h 22 min |
| `shelf-tray-h2s-abs-gf.3mf` | 4 | 240 × 166 × 14 mm | 235.72 g | 8 h 16 min |
| `locking-keys-print-16-h2s-abs-gf.3mf` | 1 | All 16 keys laid flat | 16.23 g | 56 min |

Rack total: **1,434 g and about 50 h 42 min**. Including the coupon: **1,476 g and about 52 h 27 min**. Have roughly 2 kg available to leave room for the coupon and a reprint. These are slicer estimates, not measured production times.

Settings used:

- H2S, 0.4 mm hardened steel nozzle; 0.20 mm layers.
- Bambu ABS-GF H2S filament profile; 260°C first layer, 270°C other layers, 60°C chamber, 90°C textured PEI bed.
- Six walls, six top and six bottom layers, 35% gyroid infill.
- 8 mm outer brim, 0.1 mm brim gap, supports disabled.
- Keep the supplied flat orientations and millimeter scale. The side frames must lie flat with their large side face on the bed.
- Use the plate preparation/adhesive guidance for your actual build plate. Let broad ABS parts cool before removing them; reject a warped frame instead of pulling it straight with the joints.

The largest sliced first-layer footprint, including its brim, runs from X 3.59 to 336.41 mm and Y 48.59 to 271.41 mm. It fits the H2S plate and clears the profile's rear wrapping-detection region.

## Fit test before a full print

1. Print `fit-coupon-first-h2s-abs-gf.3mf` in the actual ABS-GF you will use for the rack.
2. In the Top view, the three rectangular sockets run left to right with **0.4, 0.5, and 0.7 mm total clearance**. These are total opening allowances, not per-side gaps. The production frame uses 0.5 mm.
3. Stand a socket in its assembly orientation and slide the sample tray end through it until the broad shoulder meets its inner face. Insert the key through the exposed hole outside the socket, with its finger tab facing outward.
4. The 0.5 mm socket should seat fully by hand with little play; the key should insert and withdraw by hand. Clean off the brim and any first-layer flare first. Do not hammer a tight joint or force a brittle key.
5. If only another socket fits, update `SLOT_ALLOWANCE` in `build.py` and regenerate/re-slice the frame. Do not globally scale the rack: that also changes the Spark clearances, tray positions, and key holes.

The coupon tests print tolerance and the joint mechanism. It does not test the complete rack's strength.

## Assembly

1. Print two matching side frames, four matching trays, and the 16-key plate. No mirror operation is needed. Remove brims and inspect the mortises and key holes.
2. Lay one frame flat, inside face up. Its extended foot identifies the bottom. Fit the two projecting beam ends of each tray into the matching pair of openings at each height. Use temporary supports so no tray levers against a partly engaged joint.
3. Align the other frame with all eight opposite beam ends and slide it into place. Tray shoulders should meet the inner frame faces. The designed allowance leaves a small clearance; do not force the frames past the shoulders.
4. Stand the empty rack on a flat table. Insert a retaining key down through each exposed beam-end hole, **outside the side frame**, with the finger tab pointing away from the rack. There are four keys per tray.
5. The tray beams bear on the bottom faces of the frame openings. The keys stop the side frames withdrawing; they are not intended to carry the vertical load.
6. Check that every tray is fully seated, both feet sit flat, and the rack remains square without rocking. Tray removal requires unloading the rack and releasing the relevant frame joints; these are not sliding drawers.

## Physical checks before installing the Sparks

Use inexpensive inert weights first, gradually approaching 1.2 kg on each tier. Check for visible bowing, opening joints, layer cracks, loose keys, or sideways racking. Leave the representative load in place for at least 24–48 hours and recheck; this is a preliminary check, not a long-term certification. If it rocks or sways, revise the joints/bracing before using it.

Confirm the real Spark feet are supported on the tray ribs and the chassis sits flat. The model does not include measured foot locations, cable bend envelopes, or anti-slide stops. The devices rely on their feet/contact friction and must not be pushed or pulled by tight cables. Use the rack stationary on a level surface; unload it before moving it.

After the mechanical checks, compare device inlet temperatures and behavior under your normal sustained workload, keeping the stated external clearance. Watch for warmer upper tiers or hot-air recirculation. The published ideal ambient range is 5–30°C. Increase spacing or change the layout if cooling deteriorates; the material's HDT is not an acceptable computer operating temperature.

## What was checked

- Each production print mesh is watertight, consistently wound, positive-volume, and one connected solid.
- The separate assembled parts and four nominal device envelopes have no volumetric intersections.
- Every part fits within the H2S envelope with the planned brim; sliced extrusion coordinates and the slicer's first-layer bounds fit the plate.
- Assembly, bare frame, exploded assembly, side frame, tray, key, key plate, and coupon were rendered in the live viewer and inspected from isometric and relevant orthographic views.
- Four plate types were sliced with Bambu Studio 02.08.02.61, the installed H2S machine profile, and Bambu ABS-GF. All slicer runs returned success.
- The slicer logged `Invalid T command (T65535).` while processing the **unmodified installed H2S end template**, which contains that command. That diagnostic is retained in `output/sliced/*.log`; the delivered prepared projects are unsliced so the current printer profile can regenerate the job in Bambu Studio. No custom replacement end G-code was introduced.
- Physical fit, creep/load behavior, cooling, and actual print success remain untested. No job has been sent to a printer.

## Editable source and reproduction

`build.py` is the dimensioned CAD source. It produces the meshes, geometry checks, and ordered primitive JSON for editing. The production preview reads precomputed meshes to avoid an expensive browser-side union of the complete assembly.

```sh
/tmp/spark-rack-cad/bin/python designs/dgx-spark-h2s/build.py
/tmp/spark-rack-cad/bin/python designs/dgx-spark-h2s/prepare_profiles.py
/tmp/spark-rack-cad/bin/python designs/dgx-spark-h2s/slice.py
npm run dev -- --host 127.0.0.1 --port 4186
```

The Python environment needs `numpy`, `trimesh`, `manifold3d`, and `networkx`. Dimensions are millimeters; Z is height. The full assembly is for viewing, not a single print job.

## References

- [NVIDIA DGX Spark physical specifications](https://docs.nvidia.com/dgx/dgx-spark/hardware.html)
- [NVIDIA quick-start guide: clearance diagram](https://www.nvidia.com/content/dam/en-zz/Solutions/dgx-spark/DGX-Spark-Quick-Start-Guide.pdf)
- [Bambu H2S](https://us.store.bambulab.com/en/products/h2s?from=home_page_3dprinter)
- [Bambu ABS-GF product information](https://bambulab-us.myshopify.com/products/abs-gf)
- [ASTM D648: heat deflection testing](https://store.astm.org/d0648-18.html)
- Installed H2S and ABS-GF profiles in `/Applications/BambuStudio.app/Contents/Resources/profiles/BBL/`, checked September 28, 2026.
- Material comparison screenshots supplied in this conversation.
