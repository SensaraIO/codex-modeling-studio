# Two Mac minis, one-piece rack

One connected print for two 2024 Mac mini M4 / M4 Pro enclosures. The original eight-part design is preserved.

## Open and print

Open `slice/mini-single-piece-sliced.3mf` in Bambu Studio. It includes the rear-face-down orientation and P1S 0.4 mm / Bambu ABS settings. Do not print the viewer's assembly orientation.

- 0.28 mm layers, 0.2 mm first layer, four walls, 15% cubic infill, five top/bottom layers, 5 mm brim.
- Automatic tree supports enabled. Keep them enabled for this version.
- Bambu Studio reports Success, no warning message, estimated 7 h 24 min 20 s and 220.52 g.
- Support extrusion accounts for 28 min 39 s. This is not a support-free model.
- Compared with the old two-plate total of 7 h 43 min / 238.57 g, this estimate is about 19 minutes shorter and 18 g lighter.
- No print job has been sent.

## Geometry

154 × 188 × 148 mm assembled; 154 × 148 × 188 mm on the print bed. Both tiers slope down toward the front by 15 degrees. Their vertical spacing is 80 mm. The rear frame, feet, shelves, guides, and front stops are one connected solid. Shelves have no center joints.

Each shelf has a 120 mm circular opening merging into a 96 mm front opening. The outer underside rests on the shelf around the opening; the central circular base is kept clear. This is deliberately an open cradle, not a press-fit locator. The 120 mm opening is a design allowance, not a measured Apple base diameter. Verify the actual underside and its contact with the shelf before loading both machines. Exact bottom contour, long-term deflection, heat behavior, and cable/power-button access have not been physically tested.

The reference enclosures in the viewer are simplified 127 × 127 mm bodies. Apple lists the complete devices as 127 × 127 × 50 mm. The nominal circular underside is not shown as a measured part. Clearance checks use a 119 mm diameter cylinder extending 10 mm below the support plane and show no rack intersection. No interference is found with square 127 × 127 × 50 mm device envelopes. The silver bodies are reference geometry and are excluded from the print.

## Verification and source

`geometry-checks.json`: watertight, one connected body, positive volume, inside the 256 mm P1S build volume, device and underside clearance checks pass. Inspected isometric, side, and top views in the live Modeling Studio, plus print orientation. The slice result is in `slice/result.json`.

`build.py` rebuilds the model and portable model-only 3MF using the local CAD environment. `parameters.json` records principal dimensions. `*.mesh.json` are the viewer meshes. The editable source remains in this directory.

Apple specifications: https://support.apple.com/en-ca/121555
Apple describes airflow entering and leaving through the foot: https://www.apple.com/newsroom/2024/10/apples-new-mac-mini-is-more-mighty-more-mini-and-built-for-apple-intelligence/
