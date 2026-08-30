# Codex Modeling Studio

Codex Modeling Studio is a browser-based parametric 3D editor built for a person and a Codex agent to use together. It supports additive and subtractive solids, print checks, camera captures, and binary STL export. Five WebMCP tools let Codex inspect and edit the model shown in the browser.

The app runs entirely on the local machine. It has no backend, database, or required API key.

## What your machine needs

Install these before cloning:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20.19+ or 22.12+. Node.js 22 is recommended. npm is included with Node.js.
- [Codex](https://developers.openai.com/codex/) for agent-driven editing. The editor also works manually in a regular browser.

No API key, database, container runtime, or cloud service is required.

Confirm the command-line tools are available:

```bash
git --version
node --version
npm --version
```

## Clone and run

The repository is public, so a GitHub account is not required to clone it.

```bash
git clone https://github.com/SensaraIO/codex-modeling-studio.git
cd codex-modeling-studio
npm ci
npm run check
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Vite will print a different URL if that port is already occupied.

Keep `npm run dev` running while using the editor. Stop it with `Control-C` in the terminal.

`npm run check` runs all eight model and STL tests, TypeScript, and the production build. Run it before handing work to another agent or pushing changes.

## Use the editor

- Select a primitive in the model tree.
- Set it to **Add solid** to union it with the model or **Cut away** to subtract it.
- Edit dimensions and X, Y, and Z transforms in millimeters. Z is height and the print bed is Z=0.
- Drag the viewport to orbit and scroll to zoom. The toolbar resets the camera to isometric, front, right, or top.
- Open **Print checks** before exporting an STL. Error-level checks block export. Warnings remain visible for slicer review.

The initial project is a hollow, parametric ceramic vase. Select it to edit the belly radius, neck radius, height, and wall thickness. **Load sample** restores that project.

## Use it with Codex

1. Clone the repository and run the setup commands above.
2. Open the cloned folder as a project in Codex.
3. Ask the agent to read `AGENTS.md` before changing a design. Codex reads this root file automatically when a new task starts.
4. Start `npm run dev` and open the printed URL in the Codex in-app browser.
5. Wait for the status card to read **Agent tools live**. This confirms that the page's WebMCP tools are registered.

The root `AGENTS.md` contains a hard project rule: every new or changed design must be rendered and visually inspected in this viewer before an agent can call it complete. A build, test run, geometry calculation, or STL export does not replace the render.

A useful first prompt is:

> Read AGENTS.md. Inspect the current model, then turn it into a compact tablet stand with a 12 mm cable opening. Keep it inside the configured build volume. Render and inspect isometric and right-side views, then run the print checks. Do not export an STL.

The page exposes these tools:

- `inspect_model` returns the project, shape ids, axis conventions, bounds, and current print report.
- `edit_model` applies a batch of parametric changes as one undoable history entry.
- `capture_model_view` renders an agent-only PNG without moving the visible camera.
- `validate_and_export_stl` runs print checks and downloads an STL only when requested.
- `report_tool_feedback` records a specific problem with a page tool in the activity log.

The editor still works by hand in browsers without WebMCP. Its status card reads **Preview mode** in that case, and agent tools will not be available.

## Project map

```text
AGENTS.md                        repository-wide instructions for Codex agents
README.md                        fresh-machine setup and operating guide
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

Read `AGENTS.md` first. Before changing geometry behavior, read `src/types.ts`, `src/lib/model.ts`, and the tests. Keep dimensions in millimeters and rotations in degrees. Solid shapes participate in validation and STL export; reference shapes render in the viewport but do neither. Preserve the inspect, edit, visual capture, validate, and explicit-export workflow when changing the WebMCP tools.

The test run currently prints a deprecation warning from the BVH dependency, and Vite warns that the production JavaScript chunk is larger than 500 kB. Both commands still pass. Treat either as maintenance work unless it causes a regression.

WebMCP is experimental. The implementation follows `document.modelContext.registerTool()` from the [WebMCP project](https://github.com/webmachinelearning/webmcp) and the workflow described by OpenAI's [WebMCP Challenge](https://openai.com/webmcp-challenge/).
