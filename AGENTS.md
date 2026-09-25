# Codex Modeling Studio agent instructions

## Render rule

A design is complete only after you have rendered it in this repository's live model viewer and inspected the renders yourself. This applies to every new or changed design, material geometry change, and variant; render and inspect each one. Source inspection, unit tests, a successful build, generated geometry, or an STL file do not count as a rendered design.

- Start the app with `npm run dev`, open the printed local URL in the Codex in-app browser, and wait for the studio to report **Agent tools live**.
- Use `inspect_model` before editing. Use `capture_model_view` for at least an isometric view plus every orthographic view needed to judge the design, and read the rendered PNGs.
- Run `validate_and_export_stl` with `download=false` after visual inspection, and `npm run check` after code changes.
- If the viewer or capture tool is unavailable, repair the workflow or report the design as blocked rather than claiming visual verification.
- Do not download or export an STL unless the user asks for one.

## Project conventions

- Keep dimensions in millimeters and rotations in degrees. Z is height, and the print bed is Z=0.
- Preserve the ordered additive and subtractive CSG model and the inspect, edit, capture, validate, and explicit-export workflow.
- Treat browser `localStorage` as user-owned project state. Inspect the current model before replacing it, and keep edits undoable when possible.
- Read `src/types.ts`, `src/lib/model.ts`, and `src/__tests__/model.test.ts` before changing geometry behavior.
- Do not commit `node_modules/` or `dist/`.
