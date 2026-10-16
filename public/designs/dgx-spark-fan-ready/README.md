# Four DGX Sparks, H2S fan-ready rack

Open `DGX-Spark-four-fan-ready.glb` in Codex's 3D file viewer. Drag to orbit and zoom to inspect. `rack-only.glb` hides the computer and fan references. The GLBs are assembly previews, not print jobs. Print the millimeter-scale 3MFs in `print/`.

The design holds four nominal NVIDIA DGX Sparks, 150 × 150 × 50.5 mm each, on open trays. Continuous side frames avoid a joint halfway up the rack. The optional side carrier holds two 120 × 120 × 25 mm fans on 105 mm square mounting patterns. Removable cable guides keep loose cables beside the opposite upright. Power bricks remain separate.

| Item | Size or quantity |
| --- | --- |
| Rack with fan references and cable guides | 289 W × 208 D × 350.5 H mm |
| Side frame | 318 × 208 × 12 mm, print 2 |
| Shelf tray | 240 × 166 × 14 mm, print 4 |
| Retaining keys | Print one 16-key plate |
| Dual fan carrier | 304 × 188 × 22 mm, print 1 optionally |
| Cable guide | 20 × 48 × 22 mm, print 3 optionally |
| Fit coupon | Print first |
| H2S build volume | 340 × 320 × 340 mm |
| Space above each lower Spark | 27.5 mm to next tray |
| Chassis to inner side frame | 23 mm |

All parts fit the H2S with an 8 mm brim in their supplied orientations. The 350.5 mm assembled height does not need to fit the printer. Use the separate print parts.

## Printing

Use ABS-GF as the starting material, with the matching Bambu H2S filament profile and a compatible hardened nozzle. Start with 0.20 mm layers, six walls, six top and bottom layers, 35% gyroid, and an 8 mm outer brim. Slice the plain 3MF geometry with your actual printer, nozzle, material, and plate selected. Accessory print time and material consumption have not been sliced. No printer job has been sent.

Parts are oriented with broad faces on the bed. The fan carrier's six standoffs grow upward from the flat plate. Print the fit coupon before the structural parts. Its three sockets test 0.4, 0.5, and 0.7 mm total clearance; the rack uses 0.5 mm. Do not scale the whole rack to tune a joint.

## Assembly and hardware

1. Fit all four trays between the two continuous frames. The broad tray shoulders seat against the inner frame faces. Insert all sixteen retaining keys through the exposed beam ends outside the frames.
2. Put the fan carrier on the right outside frame. Its six standoff tips meet the outer faces of the two uprights, at heights 45, 155, and 310 mm. The standoffs keep the plate clear of the shelf keys.
3. Attach it using six approximately 2.5 mm wide, 150 mm long nylon cable ties. At each station, pass a tie through the paired slots at 44 and 86 mm from the centerline, around the matching upright. Mirror that route on the other upright. Tighten without crushing the plastic. Verify the real tie head and route before loading the rack.
4. Attach each fan with four M4 through-bolts, washers, and nuts through the 4.6 mm mounting holes. For a 25 mm fan and 6 mm carrier, M4 × 40 mm bolts are a starting choice; check thread engagement and your actual fan mounting arrangement. Use purchased 120 mm finger guards on exposed sides and choose bolt length to suit them.
5. Mount the three cable guides on the opposite rear upright at heights 45, 155, and 310 mm. Use the outer slots to tie each guide around the post. Use the center slot for a loose cable loop. Keep the actual QSFP cable manufacturer's minimum bend radius and avoid pulling on connectors.
6. Use a separate fan supply/controller matched to the fan voltage and connector. Aim both fans in the same direction. Side airflow is experimental auxiliary ventilation, and does not establish cooling performance or replace the Sparks' internal cooling.

The fan hardware and silver Spark bodies in the viewer are reference envelopes. The printed pieces are dark teal and the keys/cable guides are bronze for visibility; one filament color is sufficient.

## Fit and cooling checks

This is an untested physical prototype. Mesh checks show closed, consistently wound, single-solid accessories, H2S print fit, and no volume intersections between the accessories and existing rack/device meshes. They do not establish structural capacity, resistance to creep, cable routing fit, or cooling performance.

Test the coupon and one accessory first. Check the real Spark feet land on tray ribs. Load the empty rack gradually with inert weights up to the intended 1.2 kg per shelf, 4.8 kg total, and inspect it over 24–48 hours for bowing, loosening, cracking, or racking. Do not install computers if it moves or sags. Keep it on a level surface and unload before moving.

NVIDIA specifies 100 mm front, 20 mm sides, and 400 mm rear clear space. Keep the rear open and power supplies ventilated separately. The chosen vertical gap and side fan arrangement are not NVIDIA-validated. Compare temperatures under sustained load with and without the carrier; remove it if cooling worsens. The fan panel partially surrounds the side frame and may alter airflow even with fans off.

## Sources and editable files

- [NVIDIA dimensions, mass, and operating environment](https://docs.nvidia.com/dgx/dgx-spark/hardware.html)
- [NVIDIA clearance diagram, page 6](https://www.nvidia.com/content/dam/en-zz/Solutions/dgx-spark/DGX-Spark-Quick-Start-Guide.pdf)
- [Bambu H2S print volume](https://us.store.bambulab.com/en/products/h2s)
- `build.py` generates the accessories, checks, and GLB previews using the existing four-Spark structural rack in `codex-modeling-studio/designs/dgx-spark-h2s`.
- `geometry-checks.json` records accessory mesh and clearance results.
