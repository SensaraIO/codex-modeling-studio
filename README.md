# Codex Modeling Studio

Codex Modeling Studio is a browser-based parametric 3D editor built for a person and a Codex agent to use together. It supports additive and subtractive solids, print checks, camera captures, and binary STL export. Five WebMCP tools let Codex inspect and edit the model shown in the browser.

The app runs entirely on the local machine. It has no backend, database, or required API key.

## Clone and run

You need Git, GitHub CLI, npm, and either Node.js 20.19+ or 22.12+. The repository is private, so authenticate GitHub first on a new machine.

```bash
gh auth login
gh repo clone SensaraIO/codex-modeling-studio
cd codex-modeling-studio
npm ci
npm run check
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Vite will print a different URL if that port is already occupied.

`npm run check` runs all seven model and STL tests, TypeScript, and the production build. Run it before handing work to another agent or pushing changes.

## Use the editor

- Select a primitive in the model tree.
- Set it to **Add solid** to union it with the model or **Cut away** to subtract it.
- Edit dimensions and X, Y, and Z transforms in millimeters. Z is height and the print bed is Z=0.
- Drag the viewport to orbit and scroll to zoom. The toolbar resets the camera to isometric, front, right, or top.
- Open **Print checks** before exporting an STL. Error-level checks block export. Warnings remain visible for slicer review.

The initial project is a desktop device cradle made from three additive boxes and one cylindrical cable cut. **Load sample** restores that project.

## Use it with Codex

Open the development URL in the Codex in-app browser. That browser supports WebMCP. The status card reads **Agent tools live** after the page registers its tools.

A useful first prompt is:

> Inspect the current model. Turn it into a compact tablet stand with a 12 mm cable opening. Keep it inside the configured build volume. Capture isometric and right-side views to verify your work, then run the print checks. Do not export until the checks pass.

The page exposes these tools:

- `inspect_model` returns the project, shape ids, axis conventions, bounds, and current print report.
- `edit_model` applies a batch of parametric changes as one undoable history entry.
- `capture_model_view` renders an agent-only PNG without moving the visible camera.
- `validate_and_export_stl` runs print checks and downloads an STL only when requested.
- `report_tool_feedback` records a specific problem with a page tool in the activity log.

The editor still works by hand in browsers without WebMCP. Its status card reads **Preview mode** in that case.

## Project map

```text
src/App.tsx                       main studio layout and UI coordination
src/components/ModelViewport.tsx Three.js scene, cameras, and PNG capture
src/components/                  model tree, inspector, toolbar, and activity UI
src/lib/model.ts                 project edits, CSG geometry, and print validation
src/lib/export.ts                binary STL generation and browser download
src/useStudio.ts                 local state, undo and redo, and persistence
src/useWebMCP.ts                 WebMCP schemas and tool registration
src/__tests__/model.test.ts       state, geometry, validation, and STL tests
```

React owns the interface. React Three Fiber renders the scene. `three-bvh-csg` evaluates additive and subtractive shapes in model-tree order.

## State and generated files

The current model is stored in browser `localStorage` under `codex-modeling-studio.project.v1`. It is specific to the browser profile and does not follow the Git checkout. Use **Load sample** or clear that key when a test needs a clean model.

Do not commit these generated directories:

- `node_modules/` contains installed packages.
- `dist/` contains the Vite production build.

The tracked `package-lock.json` is the dependency source of truth. Use `npm ci` after cloning and when checking a clean install.

## Commands

```bash
npm run dev       # start the local development server
npm run test      # run the Vitest suite once
npm run build     # type-check and create dist/
npm run check     # run tests and the production build
npm run preview   # serve dist/ on 127.0.0.1:4173
```

## Notes for the next agent

Before changing geometry behavior, read `src/types.ts`, `src/lib/model.ts`, and the tests. Keep dimensions in millimeters and rotations in degrees. Solid shapes participate in validation and STL export; reference shapes render in the viewport but do neither. Preserve the inspect, edit, visual capture, validate, and explicit-export workflow when changing the WebMCP tools.

The test run currently prints a deprecation warning from the BVH dependency, and Vite warns that the production JavaScript chunk is larger than 500 kB. Both commands still pass. Treat either as maintenance work unless it causes a regression.

WebMCP is experimental. The implementation follows `document.modelContext.registerTool()` from the [WebMCP project](https://github.com/webmachinelearning/webmcp) and the workflow described by OpenAI's [WebMCP Challenge](https://openai.com/webmcp-challenge/).
